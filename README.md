# OwnBlock — Real Estate & Operating Business Co-Ownership Protocol on Solana

> **Colosseum Solana Hackathon Submission**
> Fractional Co-Buying for Prime Real Estate & Profitable Operating Businesses with Multi-Party SPV Legal Escrow and Housd On-Chain Credit Pool (`30% Equity / 70% Senior Debt`).

---

## 1. Problem

Across high-growth regional markets like the **Caucasus (Georgia, Armenia, Azerbaijan)**, prime real estate and profitable small-to-medium businesses (coffee chains, boutique wineries, AI data centers, medical clinics) generate **11.4%–19.5% annual cashflow yields**. Yet retail and crypto-native investors are locked out because:
1. **100% Upfront Capital Barrier:** Property developers and business founders require full cash settlement at closing.
2. **Punitive Local Bank Mortgages:** Regional commercial and residential loans charge **13%–15% APR** with rigid bureaucracy.
3. **Counterparty & Legal Custody Risk:** Informal co-buying syndicates lack automated escrow protection and enforceable corporate share registries.

---

## 2. The OwnBlock Solution

**OwnBlock** combines **Pacaso's** fractional co-ownership UX, **Lofty.ai's** instant token marketplace, and **Housd's** on-chain acquisition financing into a single non-custodial Solana protocol:

- **Two High-Yield Asset Classes:**
  1. **Prime Real Estate:** Luxury residences, seafront aparthotels, and ski chalets (`11.4%–14.2% APY`).
  2. **Operating Business Equity (SME Buyouts):** Verified founders sell `30%–50%` corporate LLC equity stakes in profitable businesses (`16.2%–19.5% EBITDA Dividend APY`).
- **Housd Dual-Tranche Acquisition Engine (`30% Equity + 70% Senior Loan`):**
  Co-buyers only need to pool **30%–40% down payment** in USDC. The **Housd Senior Credit Pool** (`8.5% fixed APR`) finances the remaining **60%–70%** secured by a first-priority SPV lien.
- **4-Party Non-Custodial Legal Escrow Gate:**
  Deposited USDC earns **6.5% APY** in a Solana PDA vault while raising funds. Funds cannot be released to the seller until cryptographic signatures are recorded on-chain from:
  1. **100% of Co-Buyers**
  2. **The Property / Business Seller**
  3. **The Public Registry Notary Oracle (`NAPR` / `CAD`)** confirming SPV LLC formation and share/title registration.
- **Deterministic Monthly Cashflow Waterfall:**
  Monthly rent or business EBITDA dividends are routed through `pay_installment_or_rent` — paying the Housd Senior Pool first, progressively unlocking co-buyers' locked SPL Token-2022 shares, and streaming net USDC profit to co-buyers.
- **Built-in Admin & KYB Compliance Console:**
  Full real-time back-office panel to inspect verified co-buyers, business founders, passport/registry IDs, AML risk scores, live SPV holdings, and compliance notes.

---

## 3. Repository Structure

```text
ownblock/
├── Anchor.toml                        # Solana Anchor configuration
├── programs/ownblock/src/lib.rs       # Solana Anchor Smart Contract (9 instructions + 4 PDAs)
├── src/
│   ├── app/
│   │   ├── page.tsx                   # Marketplace, Live Escrow Simulator, Admin Panel & Pitch Deck
│   │   ├── globals.css                # Institutional Slate / Obsidian / Emerald / Indigo design system
│   │   └── layout.tsx                 # Root application layout
│   └── lib/
│       ├── protocol-data.ts           # Real Estate & Business Equity listings + KYB User Registry
│       └── solana-devnet.ts           # Live Solana Devnet JSON-RPC + Phantom/Solflare Wallet signing
```

---

## 4. Solana Anchor Smart Contract Architecture (`programs/ownblock/src/lib.rs`)

### Program Derived Accounts (PDAs)
- `GlobalLendingPool`: Manages the Housd Senior Credit Pool TVL, utilization, and fixed APR parameters.
- `PropertyListing`: Stores asset metadata (`asset_type`: Real Estate vs. Business Equity), target price, equity/debt raised, `legal_doc_hash` (`SHA-256`), and 4-party signature flags.
- `ParticipantPosition`: Tracks each co-buyer's equity contribution, safety reserve buffer (`5%`), unlocked SPL Token-2022 shares, and locked collateral shares.
- `MortgageState`: Tracks remaining principal, monthly amortization schedule, missed payments, and default shield reserve.

### Core Instructions
1. `initialize_global_pool` — Initializes the Housd Senior Credit Pool.
2. `deposit_global_pool` — LPs supply USDC to earn fixed senior yield.
3. `create_listing` — Registers a new Real Estate or Business Equity SPV offering.
4. `contribute_equity` — Co-buyer deposits USDC equity + 5% safety reserve.
5. `contribute_debt` — Allocates senior debt from the Housd Pool once minimum equity threshold (`30%`) is met.
6. `sign_legal_agreement` — Records cryptographic signatures from Co-Buyers, Seller, and Notary Oracle against the `SHA-256` SPV contract hash.
7. `execute_closing` — Verifies 100% funding + all 4 signatures, transfers USDC to Seller, and mints `1,000,000` SPL Token-2022 SPV shares.
8. `pay_installment_or_rent` — Routes monthly rent or business EBITDA dividends to senior lenders first and progressively unlocks co-buyer shares.
9. `trigger_default` — Enforces reserve buffer protection and step-in collateral liquidation after 3 missed payments.

---

## 5. Running Locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3005` (or `http://localhost:3000`) to test:
- **Marketplace:** Filter between **Real Estate** and **Operating Business Shares**.
- **Connect Wallet / Demo Role Switcher:** Connect Phantom/Solflare on Solana Devnet or switch between 5 pre-funded demo personas (`Luka.sol`, `Nino.sol`, `CaucasusCapital.sol`, `OrbiAxisDev.sol`, `NAPRNotary.sol`).
- **Live Deal Simulator:** Fund equity & Housd debt, sign the 4-party SPV agreement, execute closing, and simulate monthly cashflow waterfalls.
- **Admin Panel:** Click **Open Admin Panel (Users & KYB)** in the top bar to inspect user KYC/KYB profiles, live SPV holdings, and compliance controls.
