"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  DEMO_WALLETS,
  INITIAL_LISTINGS,
  INITIAL_USERS,
  PropertyListingItem,
  DemoWallet,
  PlatformUser,
  AssetType,
} from "@/lib/protocol-data";
import {
  fetchDevnetStatus,
  fetchWalletSolBalance,
  getBrowserWalletProvider,
  toBase58Signature,
  SolanaDevnetStatus,
} from "@/lib/solana-devnet";

interface TxLogEntry {
  id: string;
  timestamp: string;
  instruction: string;
  actor: string;
  summary: string;
  txHash: string;
  type: "equity" | "debt" | "sign" | "close" | "rent" | "admin";
  verifiedWalletSig?: boolean;
}

const PACASO_FRACTIONS = [
  { label: "1/10 Share", pct: 10, fraction: 0.1 },
  { label: "1/8 Share", pct: 12.5, fraction: 0.125 },
  { label: "1/4 Share", pct: 25, fraction: 0.25 },
  { label: "1/2 Share", pct: 50, fraction: 0.5 },
];

export default function HomePage() {
  const [activeView, setActiveView] = useState<"marketplace" | "admin">(
    "marketplace"
  );
  const [listings, setListings] =
    useState<PropertyListingItem[]>(INITIAL_LISTINGS);
  const [wallets, setWallets] = useState<DemoWallet[]>(DEMO_WALLETS);
  const [users, setUsers] = useState<PlatformUser[]>(INITIAL_USERS);
  const [activeWalletId, setActiveWalletId] = useState<string>("buyer1");
  const [selectedListingId, setSelectedListingId] = useState<string>(
    INITIAL_LISTINGS[0].id
  );
  const [assetTypeFilter, setAssetTypeFilter] = useState<"ALL" | AssetType>(
    "ALL"
  );
  const [countryFilter, setCountryFilter] = useState<string>("ALL");

  // Live Solana Devnet & Real Browser Wallet (Phantom / Solflare) state
  const [devnetStatus, setDevnetStatus] = useState<SolanaDevnetStatus>({
    slot: 319482104,
    blockhash: "8fK9mP2vQw8L1nR4tY7uJ3hG6fD9sA2kL8mN1pQ4rT7v",
    rpcLatencyMs: 38,
    connected: true,
  });
  const [connectedPubkey, setConnectedPubkey] = useState<string | null>(null);
  const [connectedSolBalance, setConnectedSolBalance] = useState<number>(0);
  const [walletStatusMsg, setWalletStatusMsg] = useState<string | null>(null);

  // Simulator controls
  const [selectedFractionIdx, setSelectedFractionIdx] = useState<number>(1);
  const [equityInput, setEquityInput] = useState<string>("15000");
  const [debtInput, setDebtInput] = useState<string>("30000");
  const [globalPoolTvl, setGlobalPoolTvl] = useState<number>(1450000);
  const [poolDepositInput, setPoolDepositInput] = useState<string>("25000");

  // Admin panel state
  const [selectedUserId, setSelectedUserId] = useState<string>(
    INITIAL_USERS[0].id
  );
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [adminNoteDraft, setAdminNoteDraft] = useState<string>(
    INITIAL_USERS[0].adminNotes
  );

  // List new Business / Property modal state
  const [newAssetType, setNewAssetType] =
    useState<AssetType>("BusinessEquity");
  const [newAssetTitle, setNewAssetTitle] = useState<string>(
    "Batumi Craft Brewery & Taproom (30% Equity)"
  );
  const [newAssetCity, setNewAssetCity] = useState<string>(
    "Batumi, Old Boulevard"
  );
  const [newAssetPrice, setNewAssetPrice] = useState<string>("90000");
  const [newAssetYield, setNewAssetYield] = useState<string>("17.5");
  const [newAssetEquityPct, setNewAssetEquityPct] = useState<string>("30");
  const [newAssetRevenue, setNewAssetRevenue] = useState<string>("310000");

  const contractDialogRef = useRef<HTMLDialogElement | null>(null);
  const poolDialogRef = useRef<HTMLDialogElement | null>(null);
  const listAssetDialogRef = useRef<HTMLDialogElement | null>(null);
  const pitchDialogRef = useRef<HTMLDialogElement | null>(null);

  const [txLogs, setTxLogs] = useState<TxLogEntry[]>([
    {
      id: "tx-init-1",
      timestamp: "14:20:05",
      instruction: "initialize_global_pool",
      actor: "CaucasusCapital.sol",
      summary:
        "Initialized Housd Senior Debt & Business Financing Pool with $1,450,000 USDC (8.5% Fixed APY)",
      txHash: "5xK9mP2vQw8L1nR4tY7uJ3hG6fD9sA2kL8mN1pQ4rT7v",
      type: "debt",
    },
    {
      id: "tx-init-2",
      timestamp: "14:22:41",
      instruction: "create_listing",
      actor: "ShaviFounder.sol",
      summary:
        "Listed 40% LLC Equity in Shavi Coffee Roasters (#201) for $100,000 USDC + NAPR Corporate Share Escrow",
      txHash: "4nB7vC1xZ9mL3kP8jH2gG5fD6sA1qW4eR7tY9uI2oP5m",
      type: "equity",
    },
    {
      id: "tx-init-3",
      timestamp: "14:25:18",
      instruction: "contribute_equity",
      actor: "Luka.sol",
      summary:
        "Invested $18,000 USDC in Shavi Coffee Roasters (40% Equity Pool) + $900 Reserve Deposit",
      txHash: "2wE4rT6yU8iO0pA1sD3fG5hJ7kL9zX2cV4bN6mM8qW1e",
      type: "equity",
    },
  ]);

  // Poll live Solana Devnet slot & blockhash every 12 seconds
  useEffect(() => {
    let mounted = true;
    const syncDevnet = async () => {
      const status = await fetchDevnetStatus();
      if (mounted) setDevnetStatus(status);
    };
    syncDevnet();
    const interval = setInterval(syncDevnet, 12000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Connect or disconnect real Phantom / Solflare wallet
  const handleConnectBrowserWallet = async () => {
    if (connectedPubkey) {
      const provider = getBrowserWalletProvider();
      try {
        await provider?.disconnect();
      } catch {
        // ignore disconnect errors
      }
      setConnectedPubkey(null);
      setWalletStatusMsg(null);
      return;
    }

    const provider = getBrowserWalletProvider();
    if (!provider) {
      setWalletStatusMsg(
        "No Phantom/Solflare extension detected — running in interactive Demo Wallet mode."
      );
      setTimeout(() => setWalletStatusMsg(null), 4500);
      return;
    }

    try {
      const resp = await provider.connect();
      const pubkey = resp.publicKey.toString();
      setConnectedPubkey(pubkey);
      const solBal = await fetchWalletSolBalance(pubkey);
      setConnectedSolBalance(solBal);

      // Register or link the connected wallet as a DemoWallet option
      setWallets((prev) => {
        if (prev.some((w) => w.address === pubkey)) return prev;
        return [
          {
            id: "connected-wallet",
            label: `${pubkey.slice(0, 4)}...${pubkey.slice(-4)} (Live Wallet)`,
            role: "Connected Solana Wallet",
            address: pubkey,
            usdcBalance: 85000,
          },
          ...prev,
        ];
      });
      setActiveWalletId("connected-wallet");
    } catch {
      setWalletStatusMsg("Wallet connection was cancelled.");
      setTimeout(() => setWalletStatusMsg(null), 3500);
    }
  };

  // Optional cryptographic signature request if real browser wallet is connected
  const requestOptionalWalletSignature = async (
    actionPayload: string
  ): Promise<{ sigHash: string; realSig: boolean }> => {
    const provider = getBrowserWalletProvider();
    if (connectedPubkey && provider?.signMessage) {
      try {
        const encoded = new TextEncoder().encode(
          `OwnBlock Protocol (Solana Devnet Slot ${devnetStatus.slot})\n${actionPayload}`
        );
        const signed = await provider.signMessage(encoded, "utf8");
        return {
          sigHash: toBase58Signature(signed.signature),
          realSig: true,
        };
      } catch {
        // fallback if user dismisses popup
      }
    }
    const randomHash = Array.from({ length: 44 }, () =>
      "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz".charAt(
        Math.floor(Math.random() * 58)
      )
    ).join("");
    return { sigHash: randomHash, realSig: false };
  };

  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId) || wallets[0],
    [wallets, activeWalletId]
  );

  const selectedListing = useMemo(
    () => listings.find((l) => l.id === selectedListingId) || listings[0],
    [listings, selectedListingId]
  );

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchType =
        assetTypeFilter === "ALL" || item.assetType === assetTypeFilter;
      const matchCountry =
        countryFilter === "ALL" || item.country === countryFilter;
      return matchType && matchCountry;
    });
  }, [listings, assetTypeFilter, countryFilter]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || users[0],
    [users, selectedUserId]
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
      const q = userSearchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.handle.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.walletAddress.toLowerCase().includes(q) ||
        u.passportOrRegId.toLowerCase().includes(q);
      return matchRole && matchQuery;
    });
  }, [users, userRoleFilter, userSearchQuery]);

  const getUserPortfolio = (walletAddress: string) => {
    const equityPositions = listings.flatMap((listing) =>
      listing.coBuyers
        .filter((cb) => cb.wallet === walletAddress)
        .map((cb) => ({
          listingId: listing.id,
          title: listing.title,
          assetType: listing.assetType,
          spvName: listing.spvEntityName,
          equityUsdc: cb.equityUsdc,
          sharePct: (cb.shareBps / 100).toFixed(1),
          signed: cb.signedContract,
          annualYieldPct: listing.annualYieldPct,
          status: listing.status,
        }))
    );

    const debtPositions = listings.flatMap((listing) =>
      listing.lenders
        .filter((l) => l.wallet === walletAddress)
        .map((l) => ({
          listingId: listing.id,
          title: listing.title,
          amountUsdc: l.amountUsdc,
          aprPct: (listing.interestRateBps / 100).toFixed(1),
        }))
    );

    const totalEquityUsdc = equityPositions.reduce(
      (sum, p) => sum + p.equityUsdc,
      0
    );
    const totalDebtUsdc = debtPositions.reduce(
      (sum, p) => sum + p.amountUsdc,
      0
    );

    return {
      equityPositions,
      debtPositions,
      totalEquityUsdc,
      totalDebtUsdc,
    };
  };

  const appendLog = (
    instruction: string,
    actor: string,
    summary: string,
    type: TxLogEntry["type"],
    customSig?: { sigHash: string; realSig: boolean }
  ) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const randomHash =
      customSig?.sigHash ||
      Array.from({ length: 44 }, () =>
        "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz".charAt(
          Math.floor(Math.random() * 58)
        )
      ).join("");
    setTxLogs((prev) => [
      {
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: timeStr,
        instruction,
        actor,
        summary,
        txHash: randomHash,
        type,
        verifiedWalletSig: customSig?.realSig,
      },
      ...prev.slice(0, 14),
    ]);
  };

  const handleSelectFraction = (idx: number) => {
    setSelectedFractionIdx(idx);
    const frac = PACASO_FRACTIONS[idx];
    const minEquityRatio = selectedListing.minEquityBps / 10000;
    const suggestedDownPayment = Math.round(
      selectedListing.totalPriceUsdc * frac.fraction * minEquityRatio
    );
    setEquityInput(String(suggestedDownPayment));
  };

  // 1. Contribute Equity (Real Estate or Business Share)
  const handleContributeEquity = async () => {
    const rawAmount = Number(equityInput);
    if (!rawAmount || rawAmount <= 0) return;

    const remainingTotal =
      selectedListing.totalPriceUsdc -
      (selectedListing.equityRaisedUsdc + selectedListing.debtRaisedUsdc);
    if (remainingTotal <= 0) return;

    const amount = Math.min(rawAmount, remainingTotal);
    const reserveFee = Math.round(amount * 0.05);
    const totalNeeded = amount + reserveFee;

    if (activeWallet.usdcBalance < totalNeeded) return;

    const sig = await requestOptionalWalletSignature(
      `Instruction: contribute_equity\nAsset: ${selectedListing.spvEntityName}\nAmount: $${amount} USDC (+$${reserveFee} Reserve)`
    );

    setWallets((prev) =>
      prev.map((w) =>
        w.id === activeWallet.id
          ? { ...w, usdcBalance: w.usdcBalance - totalNeeded }
          : w
      )
    );

    setListings((prev) =>
      prev.map((item) => {
        if (item.id !== selectedListing.id) return item;
        const newEquityRaised = item.equityRaisedUsdc + amount;
        const newTotalRaised = newEquityRaised + item.debtRaisedUsdc;

        const existingIdx = item.coBuyers.findIndex(
          (b) => b.wallet === activeWallet.address
        );
        let updatedBuyers = [...item.coBuyers];
        if (existingIdx >= 0) {
          updatedBuyers[existingIdx] = {
            ...updatedBuyers[existingIdx],
            equityUsdc: updatedBuyers[existingIdx].equityUsdc + amount,
            reserveUsdc: updatedBuyers[existingIdx].reserveUsdc + reserveFee,
          };
        } else {
          updatedBuyers.push({
            wallet: activeWallet.address,
            label: activeWallet.label.split(" ")[0],
            equityUsdc: amount,
            reserveUsdc: reserveFee,
            shareBps: 0,
            unlockedShares: 0,
            lockedShares: 0,
            signedContract: false,
          });
        }

        updatedBuyers = updatedBuyers.map((b) => ({
          ...b,
          shareBps: Math.round((b.equityUsdc / newEquityRaised) * 10000),
        }));

        const nextStatus =
          newTotalRaised >= item.totalPriceUsdc
            ? "AwaitingSignatures"
            : item.status;

        return {
          ...item,
          equityRaisedUsdc: newEquityRaised,
          status: nextStatus,
          coBuyers: updatedBuyers,
          mortgage: {
            ...item.mortgage,
            reserveBalanceUsdc: item.mortgage.reserveBalanceUsdc + reserveFee,
          },
        };
      })
    );

    appendLog(
      "contribute_equity",
      activeWallet.label.split(" ")[0],
      `Invested $${amount.toLocaleString()} USDC Equity (+$${reserveFee.toLocaleString()} Reserve) into ${selectedListing.spvEntityName}`,
      "equity",
      sig
    );
  };

  // 2. Fund Mortgage / Business Acquisition Debt Tranche
  const handleContributeDebt = () => {
    const rawAmount = Number(debtInput);
    if (!rawAmount || rawAmount <= 0) return;

    const remainingTotal =
      selectedListing.totalPriceUsdc -
      (selectedListing.equityRaisedUsdc + selectedListing.debtRaisedUsdc);
    if (remainingTotal <= 0) return;

    const amount = Math.min(rawAmount, remainingTotal);
    if (globalPoolTvl < amount) return;

    setGlobalPoolTvl((prev) => prev - amount);

    setListings((prev) =>
      prev.map((item) => {
        if (item.id !== selectedListing.id) return item;
        const newDebtRaised = item.debtRaisedUsdc + amount;
        const newTotalRaised = item.equityRaisedUsdc + newDebtRaised;
        const nextStatus =
          newTotalRaised >= item.totalPriceUsdc
            ? "AwaitingSignatures"
            : item.status;

        return {
          ...item,
          debtRaisedUsdc: newDebtRaised,
          status: nextStatus,
          lenders: [
            ...item.lenders,
            {
              wallet: "7K2vOwnB1ockLendr5p18Jm4Nx6Bz9z5R",
              label: "Housd Senior Credit Pool",
              amountUsdc: amount,
              source: "GlobalPool",
            },
          ],
        };
      })
    );

    appendLog(
      "contribute_debt",
      "HousdCreditPool.sol",
      `Allocated $${amount.toLocaleString()} USDC Senior Debt Tranche to ${selectedListing.spvEntityName}`,
      "debt"
    );
  };

  // 3. Sign Multi-Party Legal Escrow Agreement
  const handleSignAgreement = async (
    roleType: "buyer" | "seller" | "notary",
    buyerWallet?: string
  ) => {
    const sig = await requestOptionalWalletSignature(
      `Instruction: sign_legal_agreement\nSPV: ${selectedListing.spvEntityName}\nLegal Hash: ${selectedListing.legalDocHash}`
    );

    setListings((prev) =>
      prev.map((item) => {
        if (item.id !== selectedListing.id) return item;

        if (roleType === "buyer" && buyerWallet) {
          return {
            ...item,
            coBuyers: item.coBuyers.map((b) =>
              b.wallet === buyerWallet ? { ...b, signedContract: true } : b
            ),
          };
        }
        if (roleType === "seller") {
          return { ...item, sellerSigned: true };
        }
        if (roleType === "notary") {
          return { ...item, notarySigned: true };
        }
        return item;
      })
    );

    const actorName =
      roleType === "seller"
        ? selectedListing.sellerLabel
        : roleType === "notary"
          ? "NAPRNotary.sol"
          : selectedListing.coBuyers.find((b) => b.wallet === buyerWallet)
              ?.label || "CoBuyer.sol";

    appendLog(
      "sign_legal_agreement",
      actorName,
      `Cryptographically signed SPV Operating & Escrow Agreement (${selectedListing.legalDocHash.slice(0, 12)}...)`,
      "sign",
      sig
    );
  };

  // 4. Execute Closing
  const handleExecuteClosing = () => {
    const totalRaised =
      selectedListing.equityRaisedUsdc + selectedListing.debtRaisedUsdc;
    if (totalRaised < selectedListing.totalPriceUsdc) return;

    const allBuyersSigned = selectedListing.coBuyers.every(
      (b) => b.signedContract
    );
    if (
      !allBuyersSigned ||
      !selectedListing.sellerSigned ||
      !selectedListing.notarySigned
    ) {
      return;
    }

    setListings((prev) =>
      prev.map((item) => {
        if (item.id !== selectedListing.id) return item;
        const equityRatio = item.equityRaisedUsdc / item.totalPriceUsdc;
        const debtRatio = item.debtRaisedUsdc / item.totalPriceUsdc;

        const updatedBuyers = item.coBuyers.map((b) => {
          const totalBuyerShares = Math.round((b.shareBps / 10000) * 1000000);
          const unlocked = Math.round(totalBuyerShares * equityRatio);
          const locked = Math.round(totalBuyerShares * debtRatio);
          return {
            ...b,
            unlockedShares: unlocked,
            lockedShares: locked,
          };
        });

        const monthlyPrincipal = Math.round(
          item.debtRaisedUsdc / item.termMonths
        );
        const monthlyInterest = Math.round(
          (item.debtRaisedUsdc * (item.interestRateBps / 10000)) / 12
        );

        return {
          ...item,
          status: item.debtRaisedUsdc > 0 ? "ActiveMortgage" : "Completed",
          coBuyers: updatedBuyers,
          mortgage: {
            ...item.mortgage,
            remainingPrincipalUsdc: item.debtRaisedUsdc,
            monthlyPrincipalUsdc: monthlyPrincipal,
            monthlyInterestUsdc: monthlyInterest,
            monthlyPaymentUsdc: monthlyPrincipal + monthlyInterest,
          },
        };
      })
    );

    setWallets((prev) =>
      prev.map((w) =>
        w.id === "seller1"
          ? {
              ...w,
              usdcBalance: w.usdcBalance + selectedListing.totalPriceUsdc,
            }
          : w
      )
    );

    appendLog(
      "execute_closing",
      "OwnBlockProtocol",
      `Released $${selectedListing.totalPriceUsdc.toLocaleString()} USDC to Seller (${selectedListing.sellerLabel}) & minted 1,000,000 SPL Token-2022 Shares for ${selectedListing.spvEntityName}`,
      "close"
    );
  };

  // 5. Simulate Monthly Rent or Business Dividend Waterfall
  const handlePayMonthlyRent = () => {
    if (selectedListing.status !== "ActiveMortgage") return;

    setListings((prev) =>
      prev.map((item) => {
        if (item.id !== selectedListing.id) return item;

        const m = item.mortgage;
        const principalPaid = Math.min(
          m.monthlyPrincipalUsdc,
          m.remainingPrincipalUsdc
        );
        const interestPaid = m.monthlyInterestUsdc;
        const totalDebtService = principalPaid + interestPaid;
        const netToBuyers = Math.max(
          0,
          item.estimatedMonthlyRentUsdc - totalDebtService
        );
        const newRemainingPrincipal = Math.max(
          0,
          m.remainingPrincipalUsdc - principalPaid
        );

        const unlockFraction =
          m.remainingPrincipalUsdc > 0
            ? principalPaid / m.remainingPrincipalUsdc
            : 1;

        const updatedBuyers = item.coBuyers.map((b) => {
          const newlyUnlocked = Math.round(b.lockedShares * unlockFraction);
          return {
            ...b,
            unlockedShares: b.unlockedShares + newlyUnlocked,
            lockedShares: Math.max(0, b.lockedShares - newlyUnlocked),
          };
        });

        return {
          ...item,
          status:
            newRemainingPrincipal === 0 ? "Completed" : "ActiveMortgage",
          coBuyers: updatedBuyers,
          mortgage: {
            ...m,
            remainingPrincipalUsdc: newRemainingPrincipal,
            monthsPaid: m.monthsPaid + 1,
            totalInterestPaidToLendersUsdc:
              m.totalInterestPaidToLendersUsdc + interestPaid,
            totalNetRentPaidToBuyersUsdc:
              m.totalNetRentPaidToBuyersUsdc + netToBuyers,
          },
        };
      })
    );

    appendLog(
      "pay_installment_or_rent",
      "CashflowRouterPDA",
      `Distributed $${selectedListing.estimatedMonthlyRentUsdc.toLocaleString()} monthly ${selectedListing.assetType === "BusinessEquity" ? "EBITDA dividend" : "rental income"}: paid $${selectedListing.mortgage.monthlyPaymentUsdc.toLocaleString()} to Housd Pool & unlocked equity shares`,
      "rent"
    );
  };

  const handleDepositGlobalPool = () => {
    const amt = Number(poolDepositInput);
    if (!amt || amt <= 0) return;
    setGlobalPoolTvl((prev) => prev + amt);
    appendLog(
      "deposit_global_pool",
      activeWallet.label.split(" ")[0],
      `Deposited $${amt.toLocaleString()} USDC into Housd Senior Credit Pool (8.5% Fixed APY)`,
      "debt"
    );
    poolDialogRef.current?.close();
  };

  const handleCreateNewListing = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(newAssetPrice) || 100000;
    const yieldPct = Number(newAssetYield) || 16.0;
    const eqPct = Number(newAssetEquityPct) || 35;
    const rev = Number(newAssetRevenue) || 350000;

    const newId = `custom-asset-${Date.now()}`;
    const newItem: PropertyListingItem = {
      id: newId,
      listingIdNum: 200 + listings.length + 1,
      assetType: newAssetType,
      title: newAssetTitle,
      subtitle:
        newAssetType === "BusinessEquity"
          ? `Verified operating business offering ${eqPct}% corporate equity via Solana SPV escrow`
          : "Prime real estate asset verified by Public Registry & available for fractional co-ownership",
      city: newAssetCity,
      country: "Georgia",
      countryFlag: "🇬🇪",
      category: newAssetType === "BusinessEquity" ? "FnBChain" : "RealEstate",
      categoryLabel:
        newAssetType === "BusinessEquity"
          ? `Operating Business · ${eqPct}% Equity`
          : "Prime Real Estate",
      imageUrl:
        newAssetType === "BusinessEquity"
          ? "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85"
          : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
      areaSqm: 180,
      annualYieldPct: yieldPct,
      businessMetrics:
        newAssetType === "BusinessEquity"
          ? {
              equityOfferedPct: eqPct,
              annualRevenueUsdc: rev,
              ebitdaMarginPct: 29,
              foundedYear: 2022,
              employeesCount: 22,
              payoutFrequency: "Monthly",
            }
          : undefined,
      pdaAddress: `OwnNewPDA${Date.now().toString().slice(-6)}x9Lp2Qv7Wz`,
      escrowVaultPda: `EscrowNewPDA${Date.now().toString().slice(-6)}k2Lp9Qv`,
      mortgageStatePda: `MrtgNewPDA${Date.now().toString().slice(-6)}j1Lp4Qv`,
      token2022Mint: `SPVNewToken2022Mint${Date.now().toString().slice(-4)}`,
      sellerWallet: "5M8dOwnB1ockSellr9k21Vb7Qp3Cx2w9L",
      sellerLabel: activeWallet.label.split(" ")[0],
      notaryOracleWallet: "1A9cOwnB1ockNotry3z77Ht5Wm8Dx6p3E",
      totalPriceUsdc: price,
      minEquityBps: 3000,
      equityRaisedUsdc: 10000,
      debtRaisedUsdc: 20000,
      escrowYieldRateBps: 650,
      escrowYieldAccruedUsdc: 120,
      interestRateBps: 880,
      termMonths: 48,
      estimatedMonthlyRentUsdc: Math.round((price * (yieldPct / 100)) / 12),
      legalDocHash:
        "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
      spvEntityName: `OwnBlock Deal #${200 + listings.length + 1} LLC`,
      registryExtractId: `NAPR-GE-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      sellerSigned: false,
      notarySigned: false,
      status: "Funding",
      coBuyers: [
        {
          wallet: activeWallet.address,
          label: activeWallet.label.split(" ")[0],
          equityUsdc: 10000,
          reserveUsdc: 500,
          shareBps: 10000,
          unlockedShares: 0,
          lockedShares: 0,
          signedContract: false,
        },
      ],
      lenders: [
        {
          wallet: "7K2vOwnB1ockLendr5p18Jm4Nx6Bz9z5R",
          label: "Housd Senior Credit Pool",
          amountUsdc: 20000,
          source: "GlobalPool",
        },
      ],
      mortgage: {
        remainingPrincipalUsdc: 0,
        monthlyPaymentUsdc: 1120,
        monthlyPrincipalUsdc: 850,
        monthlyInterestUsdc: 270,
        reserveBalanceUsdc: 500,
        monthsPaid: 0,
        missedPayments: 0,
        liquidationPriceUsdc: 0,
        totalInterestPaidToLendersUsdc: 0,
        totalNetRentPaidToBuyersUsdc: 0,
      },
    };

    setListings((prev) => [newItem, ...prev]);
    setSelectedListingId(newId);
    appendLog(
      "create_listing",
      activeWallet.label.split(" ")[0],
      `Listed new ${newAssetType === "BusinessEquity" ? "Business Equity" : "Real Estate"} deal: ${newAssetTitle} ($${price.toLocaleString()} USDC)`,
      "equity"
    );
    listAssetDialogRef.current?.close();
  };

  // Admin actions
  const handleToggleUserKyc = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const nextStatus =
          u.kycStatus === "Verified"
            ? "Enhanced KYB"
            : u.kycStatus === "Enhanced KYB"
              ? "Pending Review"
              : "Verified";
        appendLog(
          "admin_update_kyc",
          "AdminConsole",
          `Updated compliance status for ${u.fullName} (${u.handle}) to ${nextStatus}`,
          "admin"
        );
        return { ...u, kycStatus: nextStatus };
      })
    );
  };

  const handleSaveAdminNote = () => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id ? { ...u, adminNotes: adminNoteDraft } : u
      )
    );
    appendLog(
      "admin_save_note",
      "AdminConsole",
      `Updated compliance review notes for user ${selectedUser.fullName}`,
      "admin"
    );
  };

  const handleCreditDemoUsdc = (walletAddr: string, userName: string) => {
    setWallets((prev) =>
      prev.map((w) =>
        w.address === walletAddr
          ? { ...w, usdcBalance: w.usdcBalance + 25000 }
          : w
      )
    );
    appendLog(
      "admin_faucet_credit",
      "AdminConsole",
      `Credited +$25,000 Testnet USDC to ${userName} (${walletAddr.slice(0, 8)}...)`,
      "admin"
    );
  };

  // Metrics for selected listing
  const equityPct = Math.min(
    100,
    Math.round(
      (selectedListing.equityRaisedUsdc / selectedListing.totalPriceUsdc) * 100
    )
  );
  const debtPct = Math.min(
    100 - equityPct,
    Math.round(
      (selectedListing.debtRaisedUsdc / selectedListing.totalPriceUsdc) * 100
    )
  );
  const totalFundedPct = Math.min(100, equityPct + debtPct);
  const allBuyersSigned = selectedListing.coBuyers.every(
    (b) => b.signedContract
  );
  const readyToClose =
    totalFundedPct >= 100 &&
    allBuyersSigned &&
    selectedListing.sellerSigned &&
    selectedListing.notarySigned &&
    selectedListing.status === "AwaitingSignatures";

  // Featured Hero Deal
  const heroFeatured = listings[0];
  const heroEquityPct = Math.round(
    (heroFeatured.equityRaisedUsdc / heroFeatured.totalPriceUsdc) * 100
  );
  const heroDebtPct = Math.round(
    (heroFeatured.debtRaisedUsdc / heroFeatured.totalPriceUsdc) * 100
  );

  // Admin global stats
  const totalPlatformEscrowUsdc = useMemo(
    () =>
      listings.reduce(
        (sum, item) => sum + item.equityRaisedUsdc + item.debtRaisedUsdc,
        0
      ),
    [listings]
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-emerald-600 selection:text-white">
      {/* 1. TOP COLOSSEUM JURY EVALUATION BANNER + LIVE DEVNET TELEMETRY */}
      <div className="bg-[#0B1120] text-white border-b border-slate-800 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold tracking-wider uppercase border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Colosseum Hackathon Submission
            </span>
            <span className="hidden md:inline text-slate-300 font-medium">
              Solana Devnet Slot{" "}
              <strong className="font-mono text-emerald-400">
                #{devnetStatus.slot.toLocaleString()}
              </strong>{" "}
              ({devnetStatus.rpcLatencyMs}ms)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => pitchDialogRef.current?.showModal()}
              className="px-3 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold transition cursor-pointer"
            >
              Pitch Deck &amp; 1-Min Script
            </button>
            <a
              href="#jury-guide"
              onClick={() => setActiveView("marketplace")}
              className="text-slate-300 hover:text-white font-semibold underline underline-offset-4 cursor-pointer"
            >
              Jury Architecture Guide →
            </a>
            <button
              onClick={() =>
                setActiveView(
                  activeView === "marketplace" ? "admin" : "marketplace"
                )
              }
              className="px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition cursor-pointer"
            >
              {activeView === "marketplace"
                ? "Open Admin Panel (Users & KYB)"
                : "← Back to Marketplace"}
            </button>
          </div>
        </div>
      </div>

      {walletStatusMsg && (
        <div className="bg-indigo-600 text-white text-xs font-semibold text-center py-2 px-4">
          {walletStatusMsg}
        </div>
      )}

      {/* 2. STICKY HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView("marketplace")}
              className="flex items-center gap-3 text-left cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#0B1120] text-white flex items-center justify-center font-serif font-bold text-xl shadow-sm border border-slate-800">
                OB
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl tracking-tight text-[#0F172A]">
                    OwnBlock
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    Solana RWA
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Real Estate &amp; Business Equity Co-Ownership
                </p>
              </div>
            </button>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveView("marketplace")}
              className={`transition cursor-pointer ${
                activeView === "marketplace"
                  ? "text-[#0F172A] font-bold"
                  : "hover:text-[#0F172A]"
              }`}
            >
              Marketplace
            </button>
            <a
              href="#business-equity"
              onClick={() => setActiveView("marketplace")}
              className="hover:text-[#0F172A] transition"
            >
              Business Shares
            </a>
            <a
              href="#simulator"
              onClick={() => setActiveView("marketplace")}
              className="hover:text-[#0F172A] transition"
            >
              Live Deal Simulator
            </a>
            <a
              href="#housd-banner"
              onClick={() => setActiveView("marketplace")}
              className="hover:text-[#0F172A] transition"
            >
              Housd Financing
            </a>
            <button
              onClick={() => setActiveView("admin")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeView === "admin"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              Admin Panel ({users.length} Users)
            </button>
          </nav>

          {/* Right Controls: List Asset + Real Phantom/Solflare Connect + Demo Wallet */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => listAssetDialogRef.current?.showModal()}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition cursor-pointer"
            >
              + List Asset
            </button>

            <button
              onClick={handleConnectBrowserWallet}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                connectedPubkey
                  ? "bg-emerald-600 text-white"
                  : "bg-[#0B1120] hover:bg-slate-800 text-white"
              }`}
              title="Connect Phantom or Solflare wallet on Solana Devnet"
            >
              {connectedPubkey
                ? `✓ ${connectedPubkey.slice(0, 4)}..${connectedPubkey.slice(-4)} (${connectedSolBalance} SOL)`
                : "Connect Wallet"}
            </button>

            <div className="flex items-center bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200">
              <div className="mr-2 text-right hidden sm:block">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Active Role
                </div>
                <div className="text-xs font-bold text-emerald-700">
                  ${activeWallet.usdcBalance.toLocaleString()} USDC
                </div>
              </div>
              <select
                aria-label="Select active demo wallet"
                value={activeWalletId}
                onChange={(e) => setActiveWalletId(e.target.value)}
                className="bg-white text-[#0F172A] text-xs font-semibold rounded-lg px-2 py-1.5 border border-slate-200 focus:outline-none cursor-pointer"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================================
          VIEW A: ADMIN PANEL (USER DIRECTORY, KYC/KYB, PORTFOLIO & COMPLIANCE)
         ===================================================================== */}
      {activeView === "admin" ? (
        <section className="py-10 bg-[#F8FAFC] min-h-[calc(100vh-8rem)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-[#0B1120] text-white p-7 sm:p-9 mb-8 border border-slate-800 shadow-lofty">
              <div className="flex flex-wrap items-center justify-between gap-6 mb-7">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3 border border-indigo-500/30">
                    OwnBlock Compliance &amp; Registry Console
                  </div>
                  <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
                    Admin Panel — Users, KYB &amp; SPV Share Ledger
                  </h1>
                  <p className="text-slate-400 text-sm mt-1.5 max-w-2xl">
                    Monitor verified co-buyers, business founders selling company equity, real estate developers, and institutional Housd lenders in real time.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveView("marketplace")}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition cursor-pointer"
                  >
                    ← Return to Marketplace
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">
                    Registered Platform Users
                  </div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {users.length} Active Accounts
                  </div>
                  <div className="text-xs text-emerald-400 mt-1">
                    {
                      users.filter((u) => u.kycStatus !== "Pending Review")
                        .length
                    }{" "}
                    KYC/KYB Approved
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">
                    Total Escrow &amp; Loan TVL
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    ${totalPlatformEscrowUsdc.toLocaleString()} USDC
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Across {listings.length} Real Estate &amp; Business SPVs
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">
                    Business Equity Deals
                  </div>
                  <div className="text-2xl font-bold text-indigo-400 mt-1">
                    {
                      listings.filter((l) => l.assetType === "BusinessEquity")
                        .length
                    }{" "}
                    Operating SMEs
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Avg. 18.0% Annual EBITDA Dividend
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">
                    Housd Senior Credit Pool
                  </div>
                  <div className="text-2xl font-bold text-white mt-1">
                    ${globalPoolTvl.toLocaleString()} USDC
                  </div>
                  <div className="text-xs text-emerald-400 mt-1">
                    0% Default Rate · 8.5% Fixed APY
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  "ALL",
                  "Co-Buyer / Investor",
                  "Business Founder / Seller",
                  "Real Estate Developer",
                  "Institutional Lender",
                  "Legal Oracle / Notary",
                ].map((role) => (
                  <button
                    key={role}
                    onClick={() => setUserRoleFilter(role)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      userRoleFilter === role
                        ? "bg-[#0B1120] text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {role === "ALL" ? "All Roles" : role}
                  </button>
                ))}
              </div>

              <div className="w-full sm:w-80">
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search name, .sol handle, wallet, ID..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-[#0F172A] focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-lofty overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="font-bold text-sm text-[#0F172A]">
                    Platform Users &amp; KYB Registry ({filteredUsers.length})
                  </h2>
                  <span className="text-xs text-slate-500">
                    Click any user to inspect holdings &amp; KYC
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const portfolio = getUserPortfolio(u.walletAddress);
                    const walletObj = wallets.find(
                      (w) => w.address === u.walletAddress
                    );
                    const isSelected = u.id === selectedUser.id;

                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedUserId(u.id);
                          setAdminNoteDraft(u.adminNotes);
                        }}
                        className={`p-5 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isSelected
                            ? "bg-indigo-50/70 border-l-4 border-l-indigo-600"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{u.countryFlag}</span>
                            <span className="font-bold text-sm text-[#0F172A]">
                              {u.fullName}
                            </span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {u.handle}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                            <span>{u.email}</span>
                            <span>•</span>
                            <span className="font-medium text-slate-700">
                              {u.role}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            Wallet: {u.walletAddress.slice(0, 12)}...
                            {u.walletAddress.slice(-6)} · ID:{" "}
                            {u.passportOrRegId}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              u.kycStatus === "Verified"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : u.kycStatus === "Enhanced KYB"
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {u.kycStatus}
                          </span>
                          <div className="text-right">
                            <div className="text-xs font-bold text-[#0F172A]">
                              $
                              {(
                                portfolio.totalEquityUsdc +
                                portfolio.totalDebtUsdc
                              ).toLocaleString()}{" "}
                              Invested
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Wallet: $
                              {(
                                walletObj?.usdcBalance ?? 14500
                              ).toLocaleString()}{" "}
                              USDC
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-lofty p-6 sm:p-7 sticky top-28">
                {(() => {
                  const portfolio = getUserPortfolio(
                    selectedUser.walletAddress
                  );
                  const walletObj = wallets.find(
                    (w) => w.address === selectedUser.walletAddress
                  );
                  return (
                    <>
                      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">
                              {selectedUser.countryFlag}
                            </span>
                            <h3 className="font-bold text-lg text-[#0F172A]">
                              {selectedUser.fullName}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {selectedUser.role} · Joined{" "}
                            {selectedUser.joinedDate}
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleUserKyc(selectedUser.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            selectedUser.kycStatus === "Verified"
                              ? "bg-emerald-600 text-white"
                              : selectedUser.kycStatus === "Enhanced KYB"
                                ? "bg-indigo-600 text-white"
                                : "bg-amber-500 text-white"
                          }`}
                        >
                          {selectedUser.kycStatus} (Click to Toggle)
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 my-5 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="text-slate-400">
                            Email &amp; Phone
                          </div>
                          <div className="font-semibold text-[#0F172A] mt-0.5 truncate">
                            {selectedUser.email}
                          </div>
                          <div className="text-slate-500">
                            {selectedUser.phone}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="text-slate-400">
                            Registry / Passport ID
                          </div>
                          <div className="font-mono font-bold text-[#0F172A] mt-0.5">
                            {selectedUser.passportOrRegId}
                          </div>
                          <div className="text-emerald-700 font-medium">
                            AML Risk: {selectedUser.amlRiskScore}/100 (Low)
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="text-slate-400">KYC / KYB Tier</div>
                          <div className="font-semibold text-[#0F172A] mt-0.5">
                            {selectedUser.kycTier}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="text-slate-400">
                            Verified Bank IBAN
                          </div>
                          <div className="font-mono font-semibold text-[#0F172A] mt-0.5 truncate">
                            {selectedUser.verifiedBankIban}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#0B1120] text-white mb-5">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">
                            Solana Wallet ({selectedUser.handle})
                          </span>
                          <span className="font-bold text-emerald-400">
                            Balance: $
                            {(
                              walletObj?.usdcBalance ?? 14500
                            ).toLocaleString()}{" "}
                            USDC
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-300 break-all mb-3">
                          {selectedUser.walletAddress}
                        </div>
                        <button
                          onClick={() =>
                            handleCreditDemoUsdc(
                              selectedUser.walletAddress,
                              selectedUser.fullName
                            )
                          }
                          className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer"
                        >
                          + Credit $25,000 Demo USDC to User Wallet
                        </button>
                      </div>

                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-2.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            User&apos;s SPV Holdings (Real Estate &amp;
                            Businesses)
                          </h4>
                          <span className="text-xs font-bold text-emerald-700">
                            Total: $
                            {(
                              portfolio.totalEquityUsdc +
                              portfolio.totalDebtUsdc
                            ).toLocaleString()}
                          </span>
                        </div>

                        {portfolio.equityPositions.length === 0 &&
                        portfolio.debtPositions.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                            No direct co-buyer or lender positions yet (User is
                            a verified Seller / Oracle).
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {portfolio.equityPositions.map((pos) => (
                              <div
                                key={pos.listingId}
                                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        pos.assetType === "BusinessEquity"
                                          ? "bg-indigo-100 text-indigo-800"
                                          : "bg-emerald-100 text-emerald-800"
                                      }`}
                                    >
                                      {pos.assetType === "BusinessEquity"
                                        ? "Business Share"
                                        : "Real Estate"}
                                    </span>
                                    <span className="font-bold text-[#0F172A]">
                                      {pos.spvName}
                                    </span>
                                  </div>
                                  <div className="text-slate-500 mt-0.5">
                                    Stake: {pos.sharePct}% of Equity ·{" "}
                                    {pos.signed
                                      ? "✓ Contract Signed"
                                      : "⏳ Pending Signature"}
                                  </div>
                                </div>
                                <div className="text-right font-bold text-[#0F172A]">
                                  ${pos.equityUsdc.toLocaleString()}
                                </div>
                              </div>
                            ))}

                            {portfolio.debtPositions.map((pos, i) => (
                              <div
                                key={`${pos.listingId}-debt-${i}`}
                                className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <span className="font-bold text-indigo-950">
                                    Housd Senior Loan —{" "}
                                    {pos.title.slice(0, 28)}...
                                  </span>
                                  <div className="text-indigo-700">
                                    Fixed APR: {pos.aprPct}%
                                  </div>
                                </div>
                                <div className="font-bold text-indigo-900">
                                  ${pos.amountUsdc.toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Admin Compliance &amp; Audit Notes
                        </label>
                        <textarea
                          rows={3}
                          value={adminNoteDraft}
                          onChange={(e) => setAdminNoteDraft(e.target.value)}
                          className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-[#0F172A] focus:outline-none focus:border-indigo-600"
                        />
                        <button
                          onClick={handleSaveAdminNote}
                          className="mt-2 w-full py-2.5 rounded-xl bg-[#0B1120] hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                        >
                          Save Compliance Note
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* =====================================================================
           VIEW B: MAIN MARKETPLACE (REAL ESTATE + OPERATING BUSINESS SHARES)
           ===================================================================== */
        <>
          {/* 3. HERO SECTION */}
          <section className="relative pt-10 pb-20 overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white to-[#F8FAFC]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-900">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    Caucasus RWA Protocol · Real Estate &amp; Operating
                    Businesses
                  </div>

                  <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-semibold leading-[1.08] tracking-tight text-[#0F172A]">
                    Co-own prime properties{" "}
                    <span className="italic font-normal text-emerald-700">
                      &amp; profitable businesses
                    </span>{" "}
                    with crypto.
                  </h1>

                  <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
                    Have 10% of an apartment&apos;s price or want to buy a{" "}
                    <strong className="text-[#0F172A]">
                      fractional equity stake in a profitable local business
                    </strong>
                    ? Pool USDC on Solana, finance up to 70% via the{" "}
                    <strong className="text-indigo-700">
                      Housd Credit Pool
                    </strong>
                    , and release funds only after the SPV LLC contract is
                    signed by all co-buyers, the seller, and the Public Registry
                    Notary.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <a
                      href="#marketplace"
                      className="px-6 py-3.5 rounded-xl bg-[#0B1120] hover:bg-slate-800 text-white font-semibold text-sm shadow-sm transition"
                    >
                      Explore Properties &amp; Businesses
                    </a>
                    <a
                      href="#simulator"
                      className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-sm transition"
                    >
                      Launch Live Escrow Simulator
                    </a>
                    <button
                      onClick={() => setActiveView("admin")}
                      className="px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-[#0F172A] font-semibold text-sm border border-slate-200 transition cursor-pointer"
                    >
                      Inspect Admin Panel →
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
                    <div>
                      <div className="text-2xl font-bold text-[#0F172A]">
                        $100 USDC
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Minimum Block Size (Real Estate &amp; SMEs)
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">
                        11.4% – 19.5%
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Verified Rent &amp; Business EBITDA Yield
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-indigo-600">
                        30% / 70%
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Co-Buyer Equity + Housd Debt Tranche
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Lofty-style Live Featured Deal Card */}
                <div className="lg:col-span-5">
                  <div className="bg-white rounded-[28px] p-5 border border-slate-200 shadow-lofty animate-float-card">
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-4">
                      <img
                        src={heroFeatured.imageUrl}
                        alt={heroFeatured.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/80 via-transparent to-black/20" />

                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-white/95 text-[#0F172A] text-xs font-bold shadow-sm">
                          {heroFeatured.countryFlag} {heroFeatured.city}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-sm">
                          {heroFeatured.coBuyers.length +
                            heroFeatured.lenders.length}{" "}
                          Participants
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold">
                            {heroFeatured.spvEntityName}
                          </div>
                          <h3 className="font-bold text-lg leading-tight">
                            {heroFeatured.title}
                          </h3>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="text-[11px] text-slate-300">
                            Target Yield
                          </div>
                          <div className="text-xl font-bold text-emerald-400">
                            {heroFeatured.annualYieldPct}% APY
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">
                          Co-Buyer Equity + Housd Debt Progress
                        </span>
                        <span className="font-bold text-[#0F172A]">
                          $
                          {(
                            heroFeatured.equityRaisedUsdc +
                            heroFeatured.debtRaisedUsdc
                          ).toLocaleString()}{" "}
                          / ${heroFeatured.totalPriceUsdc.toLocaleString()} USDC
                        </span>
                      </div>

                      <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                        <div
                          style={{ width: `${heroEquityPct}%` }}
                          className="bg-emerald-600 h-full transition-all duration-500"
                          title="Co-Buyer Equity"
                        />
                        <div
                          style={{ width: `${heroDebtPct}%` }}
                          className="bg-indigo-600 h-full transition-all duration-500"
                          title="Housd Senior Debt"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
                          Equity: $
                          {heroFeatured.equityRaisedUsdc.toLocaleString()} (
                          {heroEquityPct}%)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block" />
                          Housd Loan: $
                          {heroFeatured.debtRaisedUsdc.toLocaleString()} (
                          {heroDebtPct}%)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                      <div className="bg-slate-50 rounded-xl p-2.5">
                        <div className="text-[11px] text-slate-500">
                          Min Down Payment
                        </div>
                        <div className="text-sm font-bold text-[#0F172A]">
                          30% Equity
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5">
                        <div className="text-[11px] text-slate-500">
                          Monthly Cashflow
                        </div>
                        <div className="text-sm font-bold text-emerald-600">
                          $
                          {heroFeatured.estimatedMonthlyRentUsdc.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5">
                        <div className="text-[11px] text-slate-500">
                          Escrow APY
                        </div>
                        <div className="text-sm font-bold text-indigo-600">
                          +6.5% APY
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. COLOSSEUM JURY EVALUATION FRAME */}
          <section id="jury-guide" className="py-12 bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="rounded-3xl bg-[#0B1120] text-white p-8 sm:p-10 shadow-lofty border border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
                      For Colosseum Hackathon Judges
                    </div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold">
                      Architectural Overview: How OwnBlock Works Under the Hood
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-slate-300 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
                    Anchor Program ID: OwnB1ockRWA11111111111111111111111111111111
                  </span>
                </div>

                <div className="grid md:grid-cols-4 gap-5">
                  <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        01 · Legal Bridge
                      </span>
                      <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                        1
                      </span>
                    </div>
                    <h3 className="font-bold text-base">
                      Why a Dedicated SPV LLC?
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Every listed apartment or operating business is held by a
                      dedicated Special Purpose Vehicle LLC registered with the
                      National Agency of Public Registry (NAPR). Holding SPL
                      Token-2022 tokens equals legally enforceable corporate
                      shares.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                        02 · Business Buyouts
                      </span>
                      <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                        2
                      </span>
                    </div>
                    <h3 className="font-bold text-base">
                      Buy Business Equity with Crypto
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Profitable local businesses (coffee chains, wineries, AI
                      data centers) sell 20%–50% equity stakes via OwnBlock.
                      Co-buyers pool USDC and receive automated monthly EBITDA
                      profit dividends directly to their Solana wallets.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        03 · Multi-Sig Escrow
                      </span>
                      <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                        3
                      </span>
                    </div>
                    <h3 className="font-bold text-base">
                      4-Party On-Chain Closing Gate
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Deposited USDC is held in a non-custodial Solana PDA vault
                      earning 6.5% APY. The Seller cannot touch a cent until
                      Co-Buyers, the Seller, and the Notary Oracle all sign the
                      SHA-256 purchase &amp; shareholder agreement on-chain.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                        04 · Housd Engine
                      </span>
                      <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                        4
                      </span>
                    </div>
                    <h3 className="font-bold text-base">
                      30% Equity + 70% Housd Loan
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Co-buyers only need 30%–40% down payment. The Housd Senior
                      Credit Pool funds the remaining 60%–70%. Monthly rent or
                      business cashflow pays lenders first and progressively
                      unlocks co-buyer tokens each month.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. BUSINESS EQUITY SPOTLIGHT BANNER */}
          <section id="business-equity" className="py-10 bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-10 shadow-lofty grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider border border-indigo-200">
                    New Asset Class · SME Private Equity on Solana
                  </div>
                  <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#0F172A]">
                    Acquire Fractional Shares in Operating Businesses
                  </h2>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Beyond luxury apartments, OwnBlock lets founders sell
                    verified corporate equity stakes (e.g., 35%–50% of an
                    operating coffee chain, winery, or AI data center) to crypto
                    co-buyers. Every deal is backed by a notarized NAPR
                    Corporate Share Pledge and streams monthly EBITDA dividends
                    in USDC.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      onClick={() => {
                        setAssetTypeFilter("BusinessEquity");
                        document
                          .getElementById("marketplace")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Filter Operating Businesses (3 Deals)
                    </button>
                    <button
                      onClick={() => {
                        setNewAssetType("BusinessEquity");
                        listAssetDialogRef.current?.showModal();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-bold transition cursor-pointer"
                    >
                      + Sell Shares in Your Business
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-semibold text-slate-500">
                      Shavi Coffee Roasters
                    </div>
                    <div className="text-xl font-bold text-[#0F172A] mt-1">
                      40% Equity Stake
                    </div>
                    <div className="text-xs text-indigo-600 font-bold mt-1">
                      $380k Rev · 18.4% Dividend APY
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-semibold text-slate-500">
                      AraratCloud AI Hub
                    </div>
                    <div className="text-xl font-bold text-[#0F172A] mt-1">
                      35% Equity Stake
                    </div>
                    <div className="text-xs text-indigo-600 font-bold mt-1">
                      $510k ARR · 19.5% Dividend APY
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-semibold text-slate-500">
                      Tsinandali Winery Co.
                    </div>
                    <div className="text-xl font-bold text-[#0F172A] mt-1">
                      50% Equity Stake
                    </div>
                    <div className="text-xs text-indigo-600 font-bold mt-1">
                      $620k Rev · 16.2% Dividend APY
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#0B1120] text-white">
                    <div className="text-xs text-slate-400">
                      On-Chain Protection
                    </div>
                    <div className="text-lg font-bold text-emerald-400 mt-1">
                      NAPR Share Lien
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1">
                      POS &amp; Bank API Revenue Oracle
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. LOFTY-STYLE MARKETPLACE GRID (REAL ESTATE + BUSINESS EQUITY) */}
          <section id="marketplace" className="py-16 bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">
                    Verified Caucasus RWA Marketplace
                  </div>
                  <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#0F172A]">
                    Co-Own Prime Real Estate &amp; Operating Businesses
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { key: "ALL", label: `All Assets (${listings.length})` },
                    {
                      key: "RealEstate",
                      label: `Real Estate (${listings.filter((l) => l.assetType === "RealEstate").length})`,
                    },
                    {
                      key: "BusinessEquity",
                      label: `Business Shares (${listings.filter((l) => l.assetType === "BusinessEquity").length})`,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() =>
                        setAssetTypeFilter(tab.key as "ALL" | AssetType)
                      }
                      className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                        assetTypeFilter === tab.key
                          ? "bg-[#0B1120] text-white shadow-sm"
                          : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}

                  <div className="h-5 w-px bg-slate-300 mx-1 hidden sm:block" />

                  {[
                    { key: "ALL", label: "All Countries" },
                    { key: "Georgia", label: "🇬🇪 Georgia" },
                    { key: "Armenia", label: "🇦🇲 Armenia" },
                    { key: "Azerbaijan", label: "🇦🇿 Azerbaijan" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setCountryFilter(f.key)}
                      className={`px-3.5 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                        countryFilter === f.key
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
                {filteredListings.map((item) => {
                  const itemEqPct = Math.round(
                    (item.equityRaisedUsdc / item.totalPriceUsdc) * 100
                  );
                  const itemDebtPct = Math.round(
                    (item.debtRaisedUsdc / item.totalPriceUsdc) * 100
                  );
                  const isSelected = item.id === selectedListing.id;
                  const isBusiness = item.assetType === "BusinessEquity";

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedListingId(item.id);
                        document
                          .getElementById("simulator")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`group bg-white rounded-[28px] overflow-hidden border transition-all duration-300 cursor-pointer shadow-lofty shadow-lofty-hover flex flex-col justify-between ${
                        isSelected
                          ? "border-emerald-600 ring-2 ring-emerald-600/20"
                          : "border-slate-200"
                      }`}
                    >
                      <div>
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/75 via-transparent to-black/20" />

                          <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-white/95 text-[#0F172A] text-xs font-bold shadow-sm">
                              {item.countryFlag} {item.city}
                            </span>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-sm ${
                                isBusiness ? "bg-indigo-600" : "bg-emerald-600"
                              }`}
                            >
                              {isBusiness ? "Business Equity" : "Real Estate"}
                            </span>
                          </div>

                          <div className="absolute top-3.5 right-3.5">
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-sm ${
                                item.status === "ActiveMortgage"
                                  ? "bg-emerald-600 text-white"
                                  : item.status === "AwaitingSignatures"
                                    ? "bg-amber-500 text-white"
                                    : "bg-[#0B1120]/90 text-white"
                              }`}
                            >
                              {item.status === "ActiveMortgage"
                                ? "Active Cashflow"
                                : item.status === "AwaitingSignatures"
                                  ? "100% Funded · Sign"
                                  : `${itemEqPct + itemDebtPct}% Funded`}
                            </span>
                          </div>

                          <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between text-white">
                            <div>
                              <div className="text-[11px] text-slate-200 uppercase tracking-wider">
                                {isBusiness
                                  ? "Projected EBITDA Yield"
                                  : "Projected Rental Yield"}
                              </div>
                              <div className="text-2xl font-bold text-emerald-400">
                                {item.annualYieldPct}% APY
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[11px] text-slate-200">
                                {isBusiness && item.businessMetrics
                                  ? `${item.businessMetrics.equityOfferedPct}% Stake Price`
                                  : "Total Asset Price"}
                              </div>
                              <div className="text-lg font-bold">
                                ${item.totalPriceUsdc.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            {item.categoryLabel} · {item.spvEntityName}
                          </div>
                          <h3 className="font-bold text-lg text-[#0F172A] leading-snug mb-2 line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                            {item.subtitle}
                          </p>

                          {isBusiness && item.businessMetrics && (
                            <div className="grid grid-cols-3 gap-2 mb-4 p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-center">
                              <div>
                                <div className="text-[10px] text-indigo-600 font-semibold">
                                  Annual Rev
                                </div>
                                <div className="text-xs font-bold text-indigo-950">
                                  $
                                  {(
                                    item.businessMetrics.annualRevenueUsdc /
                                    1000
                                  ).toFixed(0)}
                                  k
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] text-indigo-600 font-semibold">
                                  EBITDA Margin
                                </div>
                                <div className="text-xs font-bold text-indigo-950">
                                  {item.businessMetrics.ebitdaMarginPct}%
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] text-indigo-600 font-semibold">
                                  Equity Offered
                                </div>
                                <div className="text-xs font-bold text-indigo-950">
                                  {item.businessMetrics.equityOfferedPct}% LLC
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                              <div
                                style={{ width: `${itemEqPct}%` }}
                                className="bg-emerald-600 h-full"
                              />
                              <div
                                style={{ width: `${itemDebtPct}%` }}
                                className="bg-indigo-600 h-full"
                              />
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                              <span>
                                Equity: ${item.equityRaisedUsdc.toLocaleString()}{" "}
                                ({itemEqPct}%)
                              </span>
                              <span>
                                Housd Loan: $
                                {item.debtRaisedUsdc.toLocaleString()} (
                                {itemDebtPct}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-slate-400">
                            Monthly Cashflow
                          </div>
                          <div className="text-sm font-bold text-[#0F172A]">
                            ${item.estimatedMonthlyRentUsdc.toLocaleString()} /
                            mo
                          </div>
                        </div>
                        <span
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-[#0F172A] group-hover:bg-[#0B1120] group-hover:text-white"
                          }`}
                        >
                          {isSelected
                            ? "Selected in Simulator"
                            : isBusiness
                              ? "Buy Business Shares →"
                              : "Co-Buy Property →"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 7. INTERACTIVE DEAL SIMULATOR */}
          <section
            id="simulator"
            className="py-16 bg-white border-y border-slate-200"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
                    Interactive Smart Contract Workbench
                  </div>
                  <h2 className="font-serif text-3xl font-semibold text-[#0F172A]">
                    {selectedListing.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    SPV Entity:{" "}
                    <strong className="text-[#0F172A]">
                      {selectedListing.spvEntityName}
                    </strong>{" "}
                    · Registry ID:{" "}
                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {selectedListing.registryExtractId}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {listings.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setSelectedListingId(l.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        l.id === selectedListing.id
                          ? "bg-[#0B1120] text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {l.countryFlag} #{l.listingIdNum}{" "}
                      {l.assetType === "BusinessEquity" ? "(Biz)" : "(RE)"}{" "}
                      {l.city.split(",")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-[#F8FAFC] rounded-3xl p-6 sm:p-8 border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                          Step 1 · Select Your Ownership Share
                        </span>
                        <h3 className="font-bold text-xl text-[#0F172A]">
                          {selectedListing.assetType === "BusinessEquity"
                            ? "Buy Corporate Shares + Optional Housd Acquisition Credit"
                            : "Choose Your Property Share & Housd Mortgage Leverage"}
                        </h3>
                      </div>
                      <span className="text-xs font-mono bg-white px-3 py-1 rounded-lg text-slate-600 border border-slate-200">
                        Vault PDA: {selectedListing.escrowVaultPda.slice(0, 14)}
                        ...
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2.5 mb-6">
                      {PACASO_FRACTIONS.map((f, idx) => {
                        const fullShareCost = Math.round(
                          selectedListing.totalPriceUsdc * f.fraction
                        );
                        const housdDownPayment = Math.round(
                          fullShareCost * (selectedListing.minEquityBps / 10000)
                        );
                        const active = selectedFractionIdx === idx;
                        return (
                          <button
                            key={f.label}
                            onClick={() => handleSelectFraction(idx)}
                            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                              active
                                ? "bg-[#0B1120] text-white border-[#0B1120] shadow-sm"
                                : "bg-white text-[#0F172A] border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="text-xs font-bold">{f.label}</div>
                            <div
                              className={`text-[11px] mt-1 ${
                                active ? "text-emerald-300" : "text-slate-500"
                              }`}
                            >
                              Down: ${housdDownPayment.toLocaleString()}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                            Co-Buyer Equity Tranche
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            +5% Safety Reserve
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={equityInput}
                            onChange={(e) => setEquityInput(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm text-[#0F172A] focus:outline-none focus:border-emerald-600"
                          />
                          <span className="text-xs font-bold text-slate-500">
                            USDC
                          </span>
                        </div>
                        <button
                          onClick={handleContributeEquity}
                          disabled={totalFundedPct >= 100}
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs transition cursor-pointer"
                        >
                          {selectedListing.assetType === "BusinessEquity"
                            ? "Buy Business Equity Shares"
                            : "Deposit Co-Buyer Equity"}
                        </button>
                      </div>

                      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                            Housd Credit Tranche
                          </span>
                          <span className="text-xs font-semibold text-indigo-700">
                            {(selectedListing.interestRateBps / 100).toFixed(1)}
                            % APR
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={debtInput}
                            onChange={(e) => setDebtInput(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm text-[#0F172A] focus:outline-none focus:border-indigo-600"
                          />
                          <span className="text-xs font-bold text-slate-500">
                            USDC
                          </span>
                        </div>
                        <button
                          onClick={handleContributeDebt}
                          disabled={totalFundedPct >= 100}
                          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs transition cursor-pointer"
                        >
                          Allocate from Housd Pool
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card B: 4-Party Legal Escrow Signatures Gate */}
                  <div className="bg-[#F8FAFC] rounded-3xl p-6 sm:p-8 border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                          Step 2 · Multi-Party Legal Verification
                        </span>
                        <h3 className="font-bold text-xl text-[#0F172A]">
                          SPV LLC &amp; Escrow Contract Signatures
                        </h3>
                      </div>
                      <button
                        onClick={() => contractDialogRef.current?.showModal()}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] border border-slate-200 transition cursor-pointer"
                      >
                        Inspect Legal Contract &amp; SHA-256 →
                      </button>
                    </div>

                    <div className="space-y-3 mb-6">
                      {selectedListing.coBuyers.map((buyer) => (
                        <div
                          key={buyer.wallet}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200"
                        >
                          <div>
                            <div className="text-sm font-bold text-[#0F172A]">
                              {buyer.label}{" "}
                              <span className="text-xs font-normal text-slate-500">
                                (Co-Buyer · {(buyer.shareBps / 100).toFixed(1)}%
                                Equity · ${buyer.equityUsdc.toLocaleString()})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {buyer.wallet}
                            </div>
                          </div>
                          {buyer.signedContract ? (
                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                              ✓ Signed
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                handleSignAgreement("buyer", buyer.wallet)
                              }
                              className="px-3.5 py-1.5 rounded-xl bg-[#0B1120] hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
                            >
                              Sign as {buyer.label}
                            </button>
                          )}
                        </div>
                      ))}

                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200">
                        <div>
                          <div className="text-sm font-bold text-[#0F172A]">
                            {selectedListing.sellerLabel}{" "}
                            <span className="text-xs font-normal text-slate-500">
                              (
                              {selectedListing.assetType === "BusinessEquity"
                                ? "Business Founder / Equity Seller"
                                : "Property Developer / Seller"}
                              )
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {selectedListing.sellerWallet}
                          </div>
                        </div>
                        {selectedListing.sellerSigned ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                            ✓ Signed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSignAgreement("seller")}
                            className="px-3.5 py-1.5 rounded-xl bg-[#0B1120] hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
                          >
                            Sign as Seller
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200">
                        <div>
                          <div className="text-sm font-bold text-[#0F172A]">
                            NAPRNotary.sol{" "}
                            <span className="text-xs font-normal text-slate-500">
                              (Public Registry &amp; SPV Lien Oracle)
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Registry Extract:{" "}
                            {selectedListing.registryExtractId}
                          </div>
                        </div>
                        {selectedListing.notarySigned ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                            ✓ Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSignAgreement("notary")}
                            className="px-3.5 py-1.5 rounded-xl bg-[#0B1120] hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
                          >
                            Notarize &amp; Verify SPV
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleExecuteClosing}
                      disabled={!readyToClose}
                      className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition shadow-sm cursor-pointer"
                    >
                      {selectedListing.status === "ActiveMortgage" ||
                      selectedListing.status === "Completed"
                        ? "✓ Deal Closed — Funds Released to Seller & SPL Shares Minted"
                        : readyToClose
                          ? `Execute Closing & Release $${selectedListing.totalPriceUsdc.toLocaleString()} USDC to Seller`
                          : "Complete 100% Funding & All 4 Signatures to Unlock Closing"}
                    </button>
                  </div>
                </div>

                {/* Right 5 Columns: Monthly Cashflow Waterfall + Live Solana Ledger */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-[#0B1120] text-white rounded-3xl p-6 sm:p-8 shadow-lofty border border-slate-800">
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
                      Step 3 · Automated Cashflow Waterfall
                    </div>
                    <h3 className="font-serif text-2xl font-semibold mb-3">
                      {selectedListing.assetType === "BusinessEquity"
                        ? "Monthly EBITDA Dividend & Loan Amortization"
                        : "Monthly Rent & Progressive Share Unlock"}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-6">
                      Every month,{" "}
                      {selectedListing.assetType === "BusinessEquity"
                        ? "verified business profits"
                        : "rental income"}{" "}
                      automatically pays the Housd Senior Credit Pool first,
                      unlocks co-buyer Token-2022 shares, and streams net USDC
                      profit to co-buyers.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-slate-400">
                          Remaining Housd Loan
                        </div>
                        <div className="text-lg font-bold text-white mt-0.5">
                          $
                          {selectedListing.mortgage.remainingPrincipalUsdc.toLocaleString()}{" "}
                          USDC
                        </div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-slate-400">
                          Months Paid / Term
                        </div>
                        <div className="text-lg font-bold text-emerald-400 mt-0.5">
                          {selectedListing.mortgage.monthsPaid} /{" "}
                          {selectedListing.termMonths} mo
                        </div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-slate-400">
                          Monthly Gross Cashflow
                        </div>
                        <div className="text-lg font-bold text-emerald-400 mt-0.5">
                          $
                          {selectedListing.estimatedMonthlyRentUsdc.toLocaleString()}{" "}
                          USDC
                        </div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-slate-400">
                          Monthly Debt Service
                        </div>
                        <div className="text-lg font-bold text-indigo-400 mt-0.5">
                          $
                          {selectedListing.mortgage.monthlyPaymentUsdc.toLocaleString()}{" "}
                          USDC
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-6">
                      <div className="text-xs font-semibold text-slate-300">
                        SPL Token-2022 Share Unlock Status:
                      </div>
                      {selectedListing.coBuyers.map((b) => {
                        const totalS = b.unlockedShares + b.lockedShares;
                        const unlPct =
                          totalS > 0
                            ? Math.round((b.unlockedShares / totalS) * 100)
                            : 0;
                        return (
                          <div
                            key={b.wallet}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                          >
                            <div className="flex justify-between mb-1.5">
                              <span className="font-bold">{b.label}</span>
                              <span className="text-emerald-400">
                                {b.unlockedShares.toLocaleString()} Unlocked /{" "}
                                {b.lockedShares.toLocaleString()} Locked
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                style={{ width: `${unlPct}%` }}
                                className="h-full bg-emerald-500 transition-all duration-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handlePayMonthlyRent}
                      disabled={selectedListing.status !== "ActiveMortgage"}
                      className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs transition cursor-pointer"
                    >
                      {selectedListing.status === "ActiveMortgage"
                        ? `Simulate Monthly ${selectedListing.assetType === "BusinessEquity" ? "EBITDA Dividend" : "Rent"} ($${selectedListing.estimatedMonthlyRentUsdc.toLocaleString()} USDC)`
                        : "Close Deal First to Activate Monthly Cashflow Waterfall"}
                    </button>
                  </div>

                  {/* Card D: Live Solana Anchor Event Stream */}
                  <div className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-sm text-[#0F172A]">
                          Solana Anchor Instruction Log
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Blockhash: {devnetStatus.blockhash.slice(0, 18)}...
                        </p>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-semibold">
                        ● Slot #{devnetStatus.slot.toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {txLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 rounded-xl bg-white border border-slate-200 text-xs"
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span className="font-mono font-bold text-indigo-700">
                              {log.instruction}()
                            </span>
                            <div className="flex items-center gap-2">
                              {log.verifiedWalletSig && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                  Wallet Signed
                                </span>
                              )}
                              <span>{log.timestamp}</span>
                            </div>
                          </div>
                          <div className="text-[#0F172A] font-medium">
                            {log.summary}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                            Sig: {log.txHash}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 8. HOUSD-INSPIRED NUMBERED 1-6 BENEFITS SECTION */}
          <section className="py-16 bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <div className="text-xs font-bold uppercase tracking-widest text-indigo-700 mb-2">
                  Institutional Protection · Inspired by Housd &amp; Lofty
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#0F172A]">
                  Why Co-Buy Real Estate &amp; Businesses Through OwnBlock?
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    num: "1",
                    title: "Guaranteed Escrow Yield (6.5% APY)",
                    desc: "While waiting for other co-buyers to fill the syndicate, your deposited USDC earns 6.5% APY inside the Solana yield vault.",
                  },
                  {
                    num: "2",
                    title: "5% Safety Reserve Buffer",
                    desc: "Every co-buyer contributes a 5% safety reserve that automatically covers any temporary vacancy or late payment without triggering default.",
                  },
                  {
                    num: "3",
                    title: "30% Down Payment via Housd Credit",
                    desc: "Acquire a larger share of a prime apartment or operating business with 30%–40% equity while the Housd Pool finances the rest.",
                  },
                  {
                    num: "4",
                    title: "Real NAPR Legal Title & Share Pledge",
                    desc: "Each asset is owned by a dedicated SPV LLC registered with the Public Registry, giving token holders enforceable corporate rights.",
                  },
                  {
                    num: "5",
                    title: "Consolidated Single Monthly Waterfall",
                    desc: "Rent, business EBITDA dividends, loan principal, and interest are routed by one deterministic Solana smart contract instruction.",
                  },
                  {
                    num: "6",
                    title: "Instant Secondary Share Liquidity",
                    desc: "Unlocked SPL Token-2022 shares can be traded with other verified investors in seconds without paying notary fees again.",
                  },
                ].map((b) => (
                  <div
                    key={b.num}
                    className="bg-white rounded-3xl p-7 border border-slate-200 shadow-lofty flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-full bg-[#0B1120] text-white font-serif font-bold text-lg flex items-center justify-center mb-5">
                        {b.num}
                      </div>
                      <h3 className="font-bold text-lg text-[#0F172A] mb-2">
                        {b.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {b.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 9. HOUSD ON-CHAIN CREDIT POOL BANNER */}
          <section id="housd-banner" className="py-10 bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="rounded-3xl bg-gradient-to-r from-[#0B1120] via-slate-900 to-indigo-950 text-white p-8 sm:p-12 shadow-lofty border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="max-w-2xl space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
                    Housd Senior Credit Pool · Fixed 8.5% USDC APY
                  </div>
                  <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
                    Earn 8.5% Fixed APY Backed by First-Lien Real Estate &amp;
                    Business Collateral
                  </h2>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    Provide USDC liquidity to the Housd Senior Credit Pool. Your
                    capital finances the 60%–70% senior debt tranche for vetted
                    co-buyers and is protected by a 30%–40% first-loss equity
                    buffer.
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 min-w-[290px] border border-white/10 text-center">
                  <div className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
                    Current Pool TVL
                  </div>
                  <div className="text-3xl font-bold text-white my-1.5">
                    ${globalPoolTvl.toLocaleString()} USDC
                  </div>
                  <div className="text-xs text-emerald-400 mb-4">
                    8.5% Fixed APR · Senior First-Lien Tranche
                  </div>
                  <button
                    onClick={() => poolDialogRef.current?.showModal()}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Supply USDC to Housd Pool →
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 10. LOFTY-INSPIRED 2-COLUMN FAQ */}
          <section className="py-16 bg-white border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-5 space-y-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                    Transparency First
                  </div>
                  <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#0F172A] leading-tight">
                    Know how OwnBlock works before you co-invest.
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Every legal, financial, and technical safeguard is enforced
                    deterministically on Solana and backed by registered SPV
                    corporate law.
                  </p>
                </div>

                <div className="lg:col-span-7 space-y-3">
                  {[
                    {
                      q: "How does buying shares in an operating business work?",
                      a: "A profitable business (e.g., Shavi Coffee Roasters or Tsinandali Winery) places 30%–50% of its LLC equity into a ring-fenced OwnBlock SPV. Co-buyers purchase fractional blocks in USDC, sign the notarized shareholder agreement on-chain, and receive monthly EBITDA profit dividends directly to their Solana wallets.",
                    },
                    {
                      q: "Where is my money kept while a property or business is still raising funds?",
                      a: "Your USDC is locked inside a non-custodial Solana PDA Escrow Vault. Neither OwnBlock nor the Seller can withdraw funds until 100% of the target price is met AND all 4 parties (Co-Buyers, Seller, and Public Registry Notary) sign the closing transaction.",
                    },
                    {
                      q: "What happens if a co-buyer misses a monthly Housd mortgage payment?",
                      a: "First, the 5% Safety Reserve Buffer automatically covers the shortfall so the lender never experiences a delay. If a co-buyer defaults for 3 consecutive months, their locked SPL Token-2022 shares are reassigned to solvent co-buyers who step in.",
                    },
                    {
                      q: "Can I sell my property or business shares whenever I want?",
                      a: "Yes. Any unlocked SPL Token-2022 shares represent clean equity in the SPV LLC and can be traded on OwnBlock's secondary marketplace without re-registering the underlying deed.",
                    },
                  ].map((item, idx) => (
                    <details
                      key={idx}
                      className="group bg-[#F8FAFC] rounded-2xl border border-slate-200 px-6 py-4"
                    >
                      <summary className="font-bold text-sm sm:text-base text-[#0F172A] cursor-pointer list-none flex items-center justify-between gap-4">
                        <span>{item.q}</span>
                        <span className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs group-open:rotate-45 transition">
                          +
                        </span>
                      </summary>
                      <p className="text-sm text-slate-600 leading-relaxed mt-3 pt-3 border-t border-slate-200">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* MODAL 1: SPV LEGAL CONTRACT & SHA-256 INSPECTOR */}
      <dialog
        ref={contractDialogRef}
        closedby="any"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="rounded-3xl bg-white text-[#0F172A] p-0 max-w-2xl w-full shadow-2xl border border-slate-200 m-auto"
      >
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                On-Chain Legal Twin · Ricardian Contract
              </div>
              <h3 className="font-serif text-xl font-bold">
                {selectedListing.spvEntityName} — Operating &amp; Escrow
                Agreement
              </h3>
            </div>
            <button
              onClick={() => contractDialogRef.current?.close()}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 font-mono">
            <div>
              <strong>Registry Extract ID:</strong>{" "}
              {selectedListing.registryExtractId}
            </div>
            <div>
              <strong>Token-2022 Mint:</strong> {selectedListing.token2022Mint}
            </div>
            <div className="break-all">
              <strong>SHA-256 Contract Hash:</strong>{" "}
              {selectedListing.legalDocHash}
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed max-h-60 overflow-y-auto pr-2">
            <p>
              <strong>1. SPV Ownership Structure:</strong> Title to{" "}
              {selectedListing.title} is vested exclusively in{" "}
              {selectedListing.spvEntityName}. Co-Buyers hold 1,000,000
              fractional SPL Token-2022 shares corresponding pro-rata to their
              capital contribution.
            </p>
            <p>
              <strong>2. Multi-Party Escrow Release Condition:</strong> The
              Solana Program (`OwnB1ockRWA...`) enforces that $
              {selectedListing.totalPriceUsdc.toLocaleString()} USDC remains
              locked in PDA Vault `{selectedListing.escrowVaultPda}` until
              cryptographic signatures are recorded from (a) 100% of Co-Buyers,
              (b) Seller `{selectedListing.sellerLabel}`, and (c) Public
              Registry Notary Oracle `{selectedListing.notaryOracleWallet}`.
            </p>
            <p>
              <strong>3. Housd Senior Lien &amp; Cashflow Waterfall:</strong>{" "}
              Where Senior Debt is utilized ($
              {selectedListing.debtRaisedUsdc.toLocaleString()} USDC), the Housd
              Pool holds a first-priority lien. Monthly cashflow is routed
              automatically to satisfy senior principal and interest before
              unlocking co-buyer shares.
            </p>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200">
            <button
              onClick={() => contractDialogRef.current?.close()}
              className="px-5 py-2.5 rounded-xl bg-[#0B1120] text-white text-xs font-bold cursor-pointer"
            >
              Close Document
            </button>
          </div>
        </div>
      </dialog>

      {/* MODAL 2: HOUSD GLOBAL POOL DEPOSIT */}
      <dialog
        ref={poolDialogRef}
        closedby="any"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="rounded-3xl bg-white text-[#0F172A] p-0 max-w-md w-full shadow-2xl border border-slate-200 m-auto"
      >
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="font-serif text-xl font-bold">
              Supply USDC to Housd Senior Credit Pool
            </h3>
            <button
              onClick={() => poolDialogRef.current?.close()}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Your USDC is deployed into the Senior Debt Tranche of verified Real
            Estate and Operating Business deals across the Caucasus, earning a
            fixed 8.5% APY.
          </p>

          <div>
            <label className="block text-xs font-bold mb-1.5">
              Deposit Amount (USDC)
            </label>
            <input
              type="number"
              value={poolDepositInput}
              onChange={(e) => setPoolDepositInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm"
            />
          </div>

          <button
            onClick={handleDepositGlobalPool}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
          >
            Confirm Deposit (+8.5% Fixed APY)
          </button>
        </div>
      </dialog>

      {/* MODAL 3: LIST A NEW PROPERTY OR OPERATING BUSINESS */}
      <dialog
        ref={listAssetDialogRef}
        closedby="any"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="rounded-3xl bg-white text-[#0F172A] p-0 max-w-lg w-full shadow-2xl border border-slate-200 m-auto"
      >
        <form
          onSubmit={handleCreateNewListing}
          className="p-6 sm:p-8 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Seller Onboarding
              </div>
              <h3 className="font-serif text-xl font-bold">
                List a Property or Operating Business
              </h3>
            </div>
            <button
              type="button"
              onClick={() => listAssetDialogRef.current?.close()}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setNewAssetType("BusinessEquity")}
              className={`py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                newAssetType === "BusinessEquity"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              Operating Business Share
            </button>
            <button
              type="button"
              onClick={() => setNewAssetType("RealEstate")}
              className={`py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                newAssetType === "RealEstate"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              Real Estate Property
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Listing Title
            </label>
            <input
              type="text"
              required
              value={newAssetTitle}
              onChange={(e) => setNewAssetTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City / Location
              </label>
              <input
                type="text"
                required
                value={newAssetCity}
                onChange={(e) => setNewAssetCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Offering Price (USDC)
              </label>
              <input
                type="number"
                required
                value={newAssetPrice}
                onChange={(e) => setNewAssetPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
              />
            </div>
          </div>

          {newAssetType === "BusinessEquity" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Equity Stake Offered (%)
                </label>
                <input
                  type="number"
                  required
                  value={newAssetEquityPct}
                  onChange={(e) => setNewAssetEquityPct(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Annual Revenue (USDC)
                </label>
                <input
                  type="number"
                  required
                  value={newAssetRevenue}
                  onChange={(e) => setNewAssetRevenue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Projected Annual Yield (% APY)
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={newAssetYield}
              onChange={(e) => setNewAssetYield(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#0B1120] hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Deploy SPV Escrow &amp; Publish Listing
          </button>
        </form>
      </dialog>

      {/* MODAL 4: COLOSSEUM PITCH DECK & 1-MINUTE VIDEO SCRIPT */}
      <dialog
        ref={pitchDialogRef}
        closedby="any"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="rounded-3xl bg-white text-[#0F172A] p-0 max-w-3xl w-full shadow-2xl border border-slate-200 m-auto"
      >
        <div className="p-6 sm:p-8 space-y-5 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Colosseum Hackathon Submission Deck
              </div>
              <h3 className="font-serif text-2xl font-bold">
                OwnBlock — Executive Summary &amp; 1-Min Pitch
              </h3>
            </div>
            <button
              onClick={() => pitchDialogRef.current?.close()}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-emerald-700 uppercase mb-1">
                1. The Problem
              </div>
              <p className="text-slate-600 leading-relaxed">
                Prime real estate and operating SMEs in emerging hubs (Georgia,
                Armenia, Azerbaijan) yield 12–20% APY, but buyers need 100% cash
                upfront and local banks charge 13–15% interest with strict
                collateral rules.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-indigo-700 uppercase mb-1">
                2. The OwnBlock Solution
              </div>
              <p className="text-slate-600 leading-relaxed">
                Co-buyers pool USDC from $100 to acquire properties or 20–50%
                operating business equity. Our Housd Credit Pool finances up to
                70% of the acquisition at 8.5% fixed APR.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-emerald-700 uppercase mb-1">
                3. Legal SPV + 4-Party Escrow
              </div>
              <p className="text-slate-600 leading-relaxed">
                Every asset is wrapped in a Public Registry (NAPR) SPV LLC.
                Solana PDA vaults hold funds until Co-Buyers, the Seller, and
                the Notary Oracle cryptographically sign the SHA-256 contract.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-indigo-700 uppercase mb-1">
                4. Revenue Model &amp; 6-Month Target
              </div>
              <p className="text-slate-600 leading-relaxed">
                1.5% closing fee on SPV syndications + 1.0% net interest spread
                on Housd loans. Target: $5M tokenized RWA &amp; SME volume across
                Tbilisi, Batumi, and Yerevan within 6 months.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B1120] text-white space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              1-Minute Hackathon Video Script (60 Seconds)
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              &ldquo;Hi everyone, we’re building OwnBlock on Solana. Across
              high-growth regions like the Caucasus, prime real estate and
              profitable local businesses yield 12 to 20 percent a year—yet 90
              percent of people are locked out because sellers demand 100
              percent upfront cash and banks charge 14 percent interest.
              OwnBlock solves this by turning real estate and operating
              businesses into co-owned, legally enforceable Solana assets.
              Whether someone wants to buy a tenth of a luxury apartment in
              Tbilisi or acquire a 40 percent equity stake in a profitable
              coffee chain, co-buyers pool USDC starting from just 100 dollars.
              Here is our unfair advantage: co-buyers only need 30 percent down.
              Our built-in Housd Credit Pool finances the remaining 70 percent
              on-chain. All funds stay locked in a yield-bearing Solana escrow
              vault until a dedicated SPV LLC agreement is cryptographically
              signed by every co-buyer, the seller, and a Public Registry
              Notary. Once closed, monthly rent and business EBITDA dividends
              automatically pay down the loan and stream passive USDC income to
              co-buyers. OwnBlock is where DeFi liquidity meets real-world
              ownership.&rdquo;
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => pitchDialogRef.current?.close()}
              className="px-5 py-2.5 rounded-xl bg-[#0B1120] text-white text-xs font-bold cursor-pointer"
            >
              Close Pitch Deck
            </button>
          </div>
        </div>
      </dialog>

      {/* FOOTER */}
      <footer className="bg-[#0B1120] text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-serif font-bold flex items-center justify-center">
              OB
            </div>
            <span className="text-white font-semibold">
              OwnBlock Protocol — Built on Solana for the Colosseum Hackathon
            </span>
          </div>
          <div>
            Real Estate &amp; Operating Business Co-Ownership · SPV Legal Escrow
            · Housd On-Chain Credit
          </div>
        </div>
      </footer>
    </div>
  );
}
