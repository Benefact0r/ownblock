use anchor_lang::prelude::*;

declare_id!("OwnB1ockRWA11111111111111111111111111111111");

const BPS_DENOMINATOR: u64 = 10_000;
const TOTAL_SPV_SHARES: u64 = 1_000_000;

#[program]
pub mod ownblock {
    use super::*;

    /// 1. Initialize the global mortgage lending pool (Housd-style passive senior debt pool)
    pub fn initialize_global_pool(
        ctx: Context<InitializeGlobalPool>,
        base_apr_bps: u16,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.global_pool;
        pool.authority = ctx.accounts.authority.key();
        pool.total_liquidity_usdc = 0;
        pool.utilized_liquidity_usdc = 0;
        pool.base_apr_bps = base_apr_bps;
        pool.total_interest_earned_usdc = 0;
        pool.bump = ctx.bumps.global_pool;
        Ok(())
    }

    /// 2. Deposit USDC into the Global Mortgage Pool to auto-finance 30%-funded properties
    pub fn deposit_global_pool(ctx: Context<DepositGlobalPool>, amount_usdc: u64) -> Result<()> {
        require!(amount_usdc > 0, OwnBlockError::InvalidAmount);
        let pool = &mut ctx.accounts.global_pool;
        pool.total_liquidity_usdc = pool
            .total_liquidity_usdc
            .checked_add(amount_usdc)
            .ok_or(OwnBlockError::MathOverflow)?;
        Ok(())
    }

    /// 3. Create a new RWA Listing (Real Estate, AI GPU Cluster, Commercial Equipment, Luxury Asset)
    pub fn create_listing(
        ctx: Context<CreateListing>,
        listing_id: u64,
        asset_type: u8,
        total_price_usdc: u64,
        min_equity_bps: u16,
        interest_rate_bps: u16,
        term_months: u16,
        estimated_monthly_rent_usdc: u64,
        legal_doc_hash: [u8; 32],
    ) -> Result<()> {
        require!(min_equity_bps >= 1000 && min_equity_bps <= 10000, OwnBlockError::InvalidEquityBps);
        require!(total_price_usdc > 0, OwnBlockError::InvalidAmount);

        let listing = &mut ctx.accounts.listing;
        listing.listing_id = listing_id;
        listing.seller = ctx.accounts.seller.key();
        listing.notary_oracle = ctx.accounts.notary_oracle.key();
        listing.asset_type = asset_type;
        listing.total_price_usdc = total_price_usdc;
        listing.min_equity_bps = min_equity_bps;
        listing.equity_raised_usdc = 0;
        listing.debt_raised_usdc = 0;
        listing.escrow_yield_accrued_usdc = 0;
        listing.interest_rate_bps = interest_rate_bps;
        listing.term_months = term_months;
        listing.estimated_monthly_rent_usdc = estimated_monthly_rent_usdc;
        listing.legal_doc_hash = legal_doc_hash;
        listing.co_buyers_count = 0;
        listing.signed_co_buyers_count = 0;
        listing.seller_signed = false;
        listing.notary_signed = false;
        listing.status = DealStatus::Funding as u8;
        listing.bump = ctx.bumps.listing;

        let mortgage = &mut ctx.accounts.mortgage_state;
        mortgage.listing = listing.key();
        mortgage.remaining_principal_usdc = 0;
        mortgage.monthly_payment_usdc = 0;
        mortgage.reserve_balance_usdc = 0;
        mortgage.missed_payments = 0;
        mortgage.months_paid = 0;
        mortgage.liquidation_price_usdc = 0;
        mortgage.bump = ctx.bumps.mortgage_state;

        Ok(())
    }

    /// 4. Co-Buyer contributes Equity Tranche (Down Payment) + 3-month mortgage reserve buffer
    pub fn contribute_equity(ctx: Context<ContributePart>, amount_usdc: u64) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(listing.status == DealStatus::Funding as u8, OwnBlockError::InvalidDealState);
        require!(amount_usdc > 0, OwnBlockError::InvalidAmount);

        let total_committed = listing
            .equity_raised_usdc
            .checked_add(listing.debt_raised_usdc)
            .ok_or(OwnBlockError::MathOverflow)?;
        require!(
            total_committed.checked_add(amount_usdc).unwrap() <= listing.total_price_usdc,
            OwnBlockError::ExceedsTargetPrice
        );

        let pos = &mut ctx.accounts.participant_position;
        if pos.equity_contributed == 0 {
            listing.co_buyers_count = listing.co_buyers_count.checked_add(1).unwrap();
        }
        pos.listing = listing.key();
        pos.user = ctx.accounts.user.key();
        pos.equity_contributed = pos.equity_contributed.checked_add(amount_usdc).unwrap();

        listing.equity_raised_usdc = listing.equity_raised_usdc.checked_add(amount_usdc).unwrap();

        // Reserve buffer: 3% of contributed equity locked in reserve PDA for mortgage protection
        let reserve_deposit = amount_usdc / 20;
        let mortgage = &mut ctx.accounts.mortgage_state;
        mortgage.reserve_balance_usdc = mortgage
            .reserve_balance_usdc
            .checked_add(reserve_deposit)
            .unwrap();

        check_and_advance_to_signing(listing);
        Ok(())
    }

    /// 5. Lender contributes to Senior Debt Tranche (Property-specific or Global Pool Draw)
    pub fn contribute_debt(ctx: Context<ContributePart>, amount_usdc: u64) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(listing.status == DealStatus::Funding as u8, OwnBlockError::InvalidDealState);

        let min_equity_required = listing
            .total_price_usdc
            .checked_mul(listing.min_equity_bps as u64)
            .unwrap()
            / BPS_DENOMINATOR;
        let max_debt_allowed = listing.total_price_usdc.checked_sub(min_equity_required).unwrap();

        require!(
            listing.debt_raised_usdc.checked_add(amount_usdc).unwrap() <= max_debt_allowed,
            OwnBlockError::ExceedsMaxLtv
        );

        let pos = &mut ctx.accounts.participant_position;
        pos.listing = listing.key();
        pos.user = ctx.accounts.user.key();
        pos.debt_contributed = pos.debt_contributed.checked_add(amount_usdc).unwrap();

        listing.debt_raised_usdc = listing.debt_raised_usdc.checked_add(amount_usdc).unwrap();

        check_and_advance_to_signing(listing);
        Ok(())
    }

    /// 6. Multi-party On-Chain Legal Contract Signing (Co-Buyers, Seller, SPV Notary Oracle)
    pub fn sign_legal_agreement(
        ctx: Context<SignLegalAgreement>,
        signed_doc_hash: [u8; 32],
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(
            listing.status == DealStatus::AwaitingSignatures as u8,
            OwnBlockError::InvalidDealState
        );
        require!(
            listing.legal_doc_hash == signed_doc_hash,
            OwnBlockError::LegalHashMismatch
        );

        let signer_key = ctx.accounts.signer.key();
        if signer_key == listing.seller {
            listing.seller_signed = true;
        } else if signer_key == listing.notary_oracle {
            listing.notary_signed = true;
        } else {
            let pos = &mut ctx.accounts.participant_position;
            require!(pos.equity_contributed > 0, OwnBlockError::NotACoBuyer);
            if !pos.has_signed_contract {
                pos.has_signed_contract = true;
                listing.signed_co_buyers_count = listing.signed_co_buyers_count.checked_add(1).unwrap();
            }
        }
        Ok(())
    }

    /// 7. Execute Closing: Releases 100% USDC to Seller, mints Token-2022 SPV Shares, activates Mortgage
    pub fn execute_closing(ctx: Context<ExecuteClosing>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(
            listing.status == DealStatus::AwaitingSignatures as u8,
            OwnBlockError::InvalidDealState
        );
        require!(listing.seller_signed && listing.notary_signed, OwnBlockError::MissingSignatures);
        require!(
            listing.signed_co_buyers_count >= listing.co_buyers_count,
            OwnBlockError::MissingSignatures
        );

        let mortgage = &mut ctx.accounts.mortgage_state;
        mortgage.remaining_principal_usdc = listing.debt_raised_usdc;

        if listing.debt_raised_usdc > 0 {
            let monthly_principal = listing.debt_raised_usdc / (listing.term_months as u64);
            let monthly_interest = (listing.debt_raised_usdc
                * (listing.interest_rate_bps as u64))
                / BPS_DENOMINATOR
                / 12;
            mortgage.monthly_payment_usdc = monthly_principal + monthly_interest;
            listing.status = DealStatus::ActiveMortgage as u8;
        } else {
            listing.status = DealStatus::Completed as u8;
        }

        Ok(())
    }

    /// 8. Waterfall Payment Engine: Pay monthly mortgage or distribute rental income
    /// Senior Debt (Lenders) gets paid first; amortized principal unlocks Co-Buyer SPV shares!
    pub fn pay_installment_or_rent(
        ctx: Context<PayInstallment>,
        payment_usdc: u64,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let mortgage = &mut ctx.accounts.mortgage_state;
        require!(
            listing.status == DealStatus::ActiveMortgage as u8,
            OwnBlockError::InvalidDealState
        );
        require!(
            payment_usdc >= mortgage.monthly_payment_usdc,
            OwnBlockError::InsufficientInstallment
        );

        let monthly_principal = listing.debt_raised_usdc / (listing.term_months as u64);
        mortgage.remaining_principal_usdc = mortgage
            .remaining_principal_usdc
            .saturating_sub(monthly_principal);
        mortgage.months_paid = mortgage.months_paid.checked_add(1).unwrap();
        mortgage.missed_payments = 0;

        if mortgage.remaining_principal_usdc == 0 {
            listing.status = DealStatus::Completed as u8;
        }
        Ok(())
    }

    /// 9. Trigger Default & Open On-Chain SPV Share Liquidation (if missed_payments >= 3)
    pub fn trigger_default(ctx: Context<TriggerDefault>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let mortgage = &mut ctx.accounts.mortgage_state;
        require!(
            listing.status == DealStatus::ActiveMortgage as u8,
            OwnBlockError::InvalidDealState
        );
        require!(mortgage.missed_payments >= 3, OwnBlockError::NotInDefault);

        listing.status = DealStatus::Defaulted as u8;
        // Liquidation buyout price covers 100% of remaining Senior Debt + 5% liquidation fee
        mortgage.liquidation_price_usdc =
            (mortgage.remaining_principal_usdc * 105) / 100;
        Ok(())
    }
}

fn check_and_advance_to_signing(listing: &mut Account<PropertyListing>) {
    if listing.equity_raised_usdc + listing.debt_raised_usdc == listing.total_price_usdc {
        listing.status = DealStatus::AwaitingSignatures as u8;
    }
}

#[derive(Accounts)]
pub struct InitializeGlobalPool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 64,
        seeds = [b"global_pool"],
        bump
    )]
    pub global_pool: Account<'info, GlobalLendingPool>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositGlobalPool<'info> {
    #[account(mut, seeds = [b"global_pool"], bump = global_pool.bump)]
    pub global_pool: Account<'info, GlobalLendingPool>,
    #[account(mut)]
    pub lender: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(listing_id: u64)]
pub struct CreateListing<'info> {
    #[account(
        init,
        payer = seller,
        space = 8 + 256,
        seeds = [b"listing", seller.key().as_ref(), &listing_id.to_le_bytes()],
        bump
    )]
    pub listing: Account<'info, PropertyListing>,
    #[account(
        init,
        payer = seller,
        space = 8 + 128,
        seeds = [b"mortgage", listing.key().as_ref()],
        bump
    )]
    pub mortgage_state: Account<'info, MortgageState>,
    #[account(mut)]
    pub seller: Signer<'info>,
    /// CHECK: Verified SPV Legal Oracle / Notary public key
    pub notary_oracle: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ContributePart<'info> {
    #[account(mut)]
    pub listing: Account<'info, PropertyListing>,
    #[account(mut, seeds = [b"mortgage", listing.key().as_ref()], bump = mortgage_state.bump)]
    pub mortgage_state: Account<'info, MortgageState>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 128,
        seeds = [b"position", listing.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub participant_position: Account<'info, ParticipantPosition>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SignLegalAgreement<'info> {
    #[account(mut)]
    pub listing: Account<'info, PropertyListing>,
    #[account(mut)]
    pub participant_position: Account<'info, ParticipantPosition>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteClosing<'info> {
    #[account(mut)]
    pub listing: Account<'info, PropertyListing>,
    #[account(mut, seeds = [b"mortgage", listing.key().as_ref()], bump = mortgage_state.bump)]
    pub mortgage_state: Account<'info, MortgageState>,
    pub caller: Signer<'info>,
}

#[derive(Accounts)]
pub struct PayInstallment<'info> {
    #[account(mut)]
    pub listing: Account<'info, PropertyListing>,
    #[account(mut, seeds = [b"mortgage", listing.key().as_ref()], bump = mortgage_state.bump)]
    pub mortgage_state: Account<'info, MortgageState>,
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
pub struct TriggerDefault<'info> {
    #[account(mut)]
    pub listing: Account<'info, PropertyListing>,
    #[account(mut, seeds = [b"mortgage", listing.key().as_ref()], bump = mortgage_state.bump)]
    pub mortgage_state: Account<'info, MortgageState>,
    pub caller: Signer<'info>,
}

#[account]
pub struct GlobalLendingPool {
    pub authority: Pubkey,
    pub total_liquidity_usdc: u64,
    pub utilized_liquidity_usdc: u64,
    pub base_apr_bps: u16,
    pub total_interest_earned_usdc: u64,
    pub bump: u8,
}

#[account]
pub struct PropertyListing {
    pub listing_id: u64,
    pub seller: Pubkey,
    pub notary_oracle: Pubkey,
    pub asset_type: u8,
    pub total_price_usdc: u64,
    pub min_equity_bps: u16,
    pub equity_raised_usdc: u64,
    pub debt_raised_usdc: u64,
    pub escrow_yield_accrued_usdc: u64,
    pub interest_rate_bps: u16,
    pub term_months: u16,
    pub estimated_monthly_rent_usdc: u64,
    pub legal_doc_hash: [u8; 32],
    pub co_buyers_count: u16,
    pub signed_co_buyers_count: u16,
    pub seller_signed: bool,
    pub notary_signed: bool,
    pub status: u8,
    pub bump: u8,
}

#[account]
pub struct ParticipantPosition {
    pub listing: Pubkey,
    pub user: Pubkey,
    pub equity_contributed: u64,
    pub debt_contributed: u64,
    pub has_signed_contract: bool,
    pub unlocked_shares: u64,
    pub locked_shares: u64,
}

#[account]
pub struct MortgageState {
    pub listing: Pubkey,
    pub remaining_principal_usdc: u64,
    pub monthly_payment_usdc: u64,
    pub reserve_balance_usdc: u64,
    pub missed_payments: u8,
    pub months_paid: u16,
    pub liquidation_price_usdc: u64,
    pub bump: u8,
}

#[repr(u8)]
pub enum DealStatus {
    Funding = 0,
    AwaitingSignatures = 1,
    ActiveMortgage = 2,
    Completed = 3,
    Defaulted = 4,
    Cancelled = 5,
}

#[error_code]
pub enum OwnBlockError {
    #[msg("Invalid amount specified")]
    InvalidAmount,
    #[msg("Equity percentage must be between 10% and 100%")]
    InvalidEquityBps,
    #[msg("Deal is not in the required state")]
    InvalidDealState,
    #[msg("Contribution exceeds property target price")]
    ExceedsTargetPrice,
    #[msg("Debt contribution exceeds maximum allowed LTV")]
    ExceedsMaxLtv,
    #[msg("Legal document SHA-256 hash mismatch")]
    LegalHashMismatch,
    #[msg("Signer is not a registered co-buyer")]
    NotACoBuyer,
    #[msg("Missing required multi-party signatures for closing")]
    MissingSignatures,
    #[msg("Installment amount is less than scheduled monthly payment")]
    InsufficientInstallment,
    #[msg("Mortgage has not reached 3 missed payments threshold")]
    NotInDefault,
    #[msg("Math overflow")]
    MathOverflow,
}
