export type AssetType = "RealEstate" | "BusinessEquity";

export type AssetCategory =
  | "RealEstate"
  | "ResortVilla"
  | "CommercialTech"
  | "WineEstate"
  | "FnBChain"
  | "MedClinic";

export type DealStatus =
  | "Funding"
  | "AwaitingSignatures"
  | "ActiveMortgage"
  | "Completed"
  | "Defaulted";

export interface CoBuyerContribution {
  wallet: string;
  label: string;
  equityUsdc: number;
  reserveUsdc: number;
  shareBps: number;
  unlockedShares: number;
  lockedShares: number;
  signedContract: boolean;
}

export interface DebtContribution {
  wallet: string;
  label: string;
  amountUsdc: number;
  source: "Direct" | "GlobalPool";
}

export interface BusinessMetrics {
  equityOfferedPct: number;
  annualRevenueUsdc: number;
  ebitdaMarginPct: number;
  foundedYear: number;
  employeesCount: number;
  payoutFrequency: "Monthly" | "Quarterly";
}

export interface PropertyListingItem {
  id: string;
  listingIdNum: number;
  assetType: AssetType;
  title: string;
  subtitle: string;
  city: string;
  country: string;
  countryFlag: string;
  category: AssetCategory;
  categoryLabel: string;
  imageUrl: string;
  areaSqm: number;
  annualYieldPct: number;
  businessMetrics?: BusinessMetrics;
  pdaAddress: string;
  escrowVaultPda: string;
  mortgageStatePda: string;
  token2022Mint: string;
  sellerWallet: string;
  sellerLabel: string;
  notaryOracleWallet: string;
  totalPriceUsdc: number;
  minEquityBps: number;
  equityRaisedUsdc: number;
  debtRaisedUsdc: number;
  escrowYieldRateBps: number;
  escrowYieldAccruedUsdc: number;
  interestRateBps: number;
  termMonths: number;
  estimatedMonthlyRentUsdc: number;
  legalDocHash: string;
  spvEntityName: string;
  registryExtractId: string;
  sellerSigned: boolean;
  notarySigned: boolean;
  status: DealStatus;
  coBuyers: CoBuyerContribution[];
  lenders: DebtContribution[];
  mortgage: {
    remainingPrincipalUsdc: number;
    monthlyPaymentUsdc: number;
    monthlyPrincipalUsdc: number;
    monthlyInterestUsdc: number;
    reserveBalanceUsdc: number;
    monthsPaid: number;
    missedPayments: number;
    liquidationPriceUsdc: number;
    totalInterestPaidToLendersUsdc: number;
    totalNetRentPaidToBuyersUsdc: number;
  };
}

export interface DemoWallet {
  id: string;
  label: string;
  role: string;
  address: string;
  usdcBalance: number;
}

export interface PlatformUser {
  id: string;
  fullName: string;
  handle: string;
  email: string;
  phone: string;
  country: string;
  countryFlag: string;
  walletAddress: string;
  role:
    | "Co-Buyer / Investor"
    | "Business Founder / Seller"
    | "Real Estate Developer"
    | "Institutional Lender"
    | "Legal Oracle / Notary";
  kycStatus: "Verified" | "Pending Review" | "Enhanced KYB";
  kycTier: string;
  passportOrRegId: string;
  amlRiskScore: number;
  joinedDate: string;
  lastActive: string;
  verifiedBankIban: string;
  adminNotes: string;
}

export const DEMO_WALLETS: DemoWallet[] = [
  {
    id: "buyer1",
    label: "Luka.sol (Lead Co-Buyer)",
    role: "Real Estate & Business Co-Buyer",
    address: "9F4kOwnB1ockBuyer1x89Lp2Qv7Wz8x2A",
    usdcBalance: 95000,
  },
  {
    id: "buyer2",
    label: "Nino.sol (Co-Buyer #2)",
    role: "Fractional Investor",
    address: "3H7pOwnB1ockBuyer2m44Kr9Tc1Yz4m1Q",
    usdcBalance: 68000,
  },
  {
    id: "lender1",
    label: "CaucasusCapital.sol (Housd Pool)",
    role: "Housd Senior Debt Lender",
    address: "7K2vOwnB1ockLendr5p18Jm4Nx6Bz9z5R",
    usdcBalance: 450000,
  },
  {
    id: "seller1",
    label: "OrbiAxisDev.sol (Asset Seller)",
    role: "Property & Business Seller",
    address: "5M8dOwnB1ockSellr9k21Vb7Qp3Cx2w9L",
    usdcBalance: 25000,
  },
  {
    id: "notary1",
    label: "NAPRNotary.sol (Registry Oracle)",
    role: "Public Registry & SPV Notary",
    address: "1A9cOwnB1ockNotry3z77Ht5Wm8Dx6p3E",
    usdcBalance: 10000,
  },
];

export const INITIAL_USERS: PlatformUser[] = [
  {
    id: "usr-001",
    fullName: "Luka Gvenetadze",
    handle: "Luka.sol",
    email: "luka@ownblock.io",
    phone: "+995 599 14 20 88",
    country: "Georgia (Tbilisi)",
    countryFlag: "🇬🇪",
    walletAddress: "9F4kOwnB1ockBuyer1x89Lp2Qv7Wz8x2A",
    role: "Co-Buyer / Investor",
    kycStatus: "Verified",
    kycTier: "Tier 3 — Biometrics + NAPR E-Sign",
    passportOrRegId: "GE-ID-01024089112",
    amlRiskScore: 4,
    joinedDate: "2026-08-14",
    lastActive: "2 mins ago",
    verifiedBankIban: "GE29TB7710000491820001",
    adminNotes:
      "Lead syndicate initiator across 4 properties and 2 operating business buyouts. Approved for Housd 30/70 leverage.",
  },
  {
    id: "usr-002",
    fullName: "Nino Kipiani",
    handle: "Nino.sol",
    email: "nino.kipiani@tbcwealth.ge",
    phone: "+995 577 82 19 04",
    country: "Georgia (Batumi)",
    countryFlag: "🇬🇪",
    walletAddress: "3H7pOwnB1ockBuyer2m44Kr9Tc1Yz4m1Q",
    role: "Co-Buyer / Investor",
    kycStatus: "Verified",
    kycTier: "Tier 3 — Biometrics + NAPR E-Sign",
    passportOrRegId: "GE-ID-61004029811",
    amlRiskScore: 7,
    joinedDate: "2026-08-29",
    lastActive: "14 mins ago",
    verifiedBankIban: "GE84BG0000000559102844",
    adminNotes:
      "Active fractional co-buyer in Batumi Riviera Sky Suite and Yerevan AI Tech Hub. Pending signature on Deal #102.",
  },
  {
    id: "usr-003",
    fullName: "Caucasus Capital Credit Fund LP",
    handle: "CaucasusCapital.sol",
    email: "treasury@caucasuscapital.com",
    phone: "+44 20 7946 0192",
    country: "United Kingdom / Georgia",
    countryFlag: "🇬🇧",
    walletAddress: "7K2vOwnB1ockLendr5p18Jm4Nx6Bz9z5R",
    role: "Institutional Lender",
    kycStatus: "Enhanced KYB",
    kycTier: "Institutional — Audited Fund KYB",
    passportOrRegId: "UK-OC441928-LP",
    amlRiskScore: 2,
    joinedDate: "2026-07-10",
    lastActive: "1 hour ago",
    verifiedBankIban: "GB33BUKB20201555555555",
    adminNotes:
      "Primary liquidity provider for the Housd Senior Debt Pool ($1.45M USDC committed at 8.5% fixed APR).",
  },
  {
    id: "usr-004",
    fullName: "Orbi & Axis Development Group LLC",
    handle: "OrbiAxisDev.sol",
    email: "closings@orbiaxis-dev.ge",
    phone: "+995 32 240 00 90",
    country: "Georgia (Tbilisi)",
    countryFlag: "🇬🇪",
    walletAddress: "5M8dOwnB1ockSellr9k21Vb7Qp3Cx2w9L",
    role: "Real Estate Developer",
    kycStatus: "Enhanced KYB",
    kycTier: "Corporate Seller — NAPR Verified Title",
    passportOrRegId: "NAPR-CORP-404928172",
    amlRiskScore: 5,
    joinedDate: "2026-08-01",
    lastActive: "38 mins ago",
    verifiedBankIban: "GE11BG0000000101928374",
    adminNotes:
      "Verified property developer and commercial seller. All listed units have clean encumbrance certificates.",
  },
  {
    id: "usr-005",
    fullName: "Giorgi Beridze (Shavi Coffee Roasters LLC)",
    handle: "ShaviFounder.sol",
    email: "giorgi@shaviroasters.ge",
    phone: "+995 591 44 10 22",
    country: "Georgia (Tbilisi)",
    countryFlag: "🇬🇪",
    walletAddress: "4B8mOwnB1ockBiz99x2Lp7Qv1Wz3k8R4T",
    role: "Business Founder / Seller",
    kycStatus: "Enhanced KYB",
    kycTier: "SME Equity Seller — Audited Financials",
    passportOrRegId: "NAPR-SME-405198231",
    amlRiskScore: 6,
    joinedDate: "2026-09-18",
    lastActive: "5 mins ago",
    verifiedBankIban: "GE66TB7729100991827311",
    adminNotes:
      "Selling 40% equity in Shavi Roasters (5 locations in Tbilisi). POS revenue oracle connected via TBC Open Banking API.",
  },
  {
    id: "usr-006",
    fullName: "Armen Hakobyan (AraratCloud AI CJSC)",
    handle: "AraratCloud.sol",
    email: "armen@araratcloud.am",
    phone: "+374 91 55 21 80",
    country: "Armenia (Yerevan)",
    countryFlag: "🇦🇲",
    walletAddress: "6D2pOwnB1ockArm88k4Lp1Qv9Wz5m2N7Y",
    role: "Business Founder / Seller",
    kycStatus: "Pending Review",
    kycTier: "SME Equity Seller — Final Audit Review",
    passportOrRegId: "AM-REG-28910442",
    amlRiskScore: 11,
    joinedDate: "2026-10-02",
    lastActive: "3 hours ago",
    verifiedBankIban: "AM18005000009182736451",
    adminNotes:
      "Offering 35% equity in Yerevan GPU Cluster & SaaS studio. Waiting on final Q3 tax audit sign-off.",
  },
  {
    id: "usr-007",
    fullName: "NAPR Legal Oracle & Notary Chamber #14",
    handle: "NAPRNotary.sol",
    email: "notary14@napr-oracle.ge",
    phone: "+995 32 225 15 27",
    country: "Georgia (Tbilisi)",
    countryFlag: "🇬🇪",
    walletAddress: "1A9cOwnB1ockNotry3z77Ht5Wm8Dx6p3E",
    role: "Legal Oracle / Notary",
    kycStatus: "Verified",
    kycTier: "Authorized State Registry Validator",
    passportOrRegId: "GE-NOTARY-LIC-0014",
    amlRiskScore: 1,
    joinedDate: "2026-07-01",
    lastActive: "Online",
    verifiedBankIban: "GE05NB0000000999111222",
    adminNotes:
      "Official co-signing notary oracle verifying SPV LLC formation and lien registration before escrow release.",
  },
];

export const INITIAL_LISTINGS: PropertyListingItem[] = [
  {
    id: "tbilisi-vake-penthouse",
    listingIdNum: 101,
    assetType: "RealEstate",
    title: "Vake Panoramic Residence — Chavchavadze Ave #37",
    subtitle:
      "Luxury 3-bedroom terrace residence with a 5-year diplomatic embassy lease agreement",
    city: "Tbilisi, Vake",
    country: "Georgia",
    countryFlag: "🇬🇪",
    category: "RealEstate",
    categoryLabel: "Prime Residential",
    imageUrl:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85",
    areaSqm: 128,
    annualYieldPct: 11.4,
    pdaAddress: "Own1stVakePDA88x9Lp2Qv7Wz4k1M9R2a",
    escrowVaultPda: "EscrowVakePDA77k2Lp9Qv3Wz1m8N4T5b",
    mortgageStatePda: "MrtgVakePDA66j1Lp4Qv8Wz9c2B7Y3x",
    token2022Mint: "SPVVakeToken2022Mint55h9Lp1Qv6Wz",
    sellerWallet: "5M8dOwnB1ockSellr9k21Vb7Qp3Cx2w9L",
    sellerLabel: "OrbiAxisDev.sol",
    notaryOracleWallet: "1A9cOwnB1ockNotry3z77Ht5Wm8Dx6p3E",
    totalPriceUsdc: 120000,
    minEquityBps: 3000,
    equityRaisedUsdc: 24000,
    debtRaisedUsdc: 54000,
    escrowYieldRateBps: 650,
    escrowYieldAccruedUsdc: 485,
    interestRateBps: 850,
    termMonths: 60,
    estimatedMonthlyRentUsdc: 1850,
    legalDocHash:
      "0x8f4e2b91c7d30a6e51f49c82b71d6e3f9a0c4b2d8e1f7a3c5b9d2e4f6a8c1b3d",
    spvEntityName: "OwnBlock Vake Residence #101 LLC",
    registryExtractId: "NAPR-GE-01.14.04.037.018",
    sellerSigned: false,
    notarySigned: false,
    status: "Funding",
    coBuyers: [
      {
        wallet: "9F4kOwnB1ockBuyer1x89Lp2Qv7Wz8x2A",
        label: "Luka.sol",
        equityUsdc: 15000,
        reserveUsdc: 750,
        shareBps: 6250,
        unlockedShares: 0,
        lockedShares: 0,
        signedContract: false,
      },
      {
        wallet: "3H7pOwnB1ockBuyer2m44Kr9Tc1Yz4m1Q",
        label: "Nino.sol",
        equityUsdc: 9000,
        reserveUsdc: 450,
        shareBps: 3750,
        unlockedShares: 0,
        lockedShares: 0,
        signedContract: false,
      },
    ],
    lenders: [
      {
        wallet: "7K2vOwnB1ockLendr5p18Jm4Nx6Bz9z5R",
        label: "Housd Caucasus Pool",
        amountUsdc: 54000,
        source: "GlobalPool",
      },
    ],
    mortgage: {
      remainingPrincipalUsdc: 0,
      monthlyPaymentUsdc: 1510,
      monthlyPrincipalUsdc: 1120,
      monthlyInterestUsdc: 390,
      reserveBalanceUsdc: 1200,
      monthsPaid: 0,
      missedPayments: 0,
      liquidationPriceUsdc: 0,
      totalInterestPaidToLendersUsdc: 0,
      totalNetRentPaidToBuyersUsdc: 0,
    },
  },
  {
    id: "tbilisi-specialty-coffee-chain",
    listingIdNum: 201,
    assetType: "BusinessEquity",
    title: "Shavi Coffee Roasters — 5-Branch Cafe Chain (40% Equity)",
    subtitle:
      "Profitable specialty coffee roastery & 5 prime Tbilisi cafes raising expansion capital via SPV shares",
    city: "Tbilisi, Vera & Vake",
    country: "Georgia",
    countryFlag: "🇬🇪",
    category: "FnBChain",
    categoryLabel: "Operating Business · F&B",
    imageUrl:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=85",
    areaSqm: 420,
    annualYieldPct: 18.4,
    businessMetrics: {
      equityOfferedPct: 40,
      annualRevenueUsdc: 380000,
      ebitdaMarginPct: 28,
      foundedYear: 2021,
      employeesCount: 34,
      payoutFrequency: "Monthly",
    },
    pdaAddress: "OwnBizShaviPDA77x9Lp2Qv7Wz4k1M9R",
    escrowVaultPda: "EscrowShaviPDA66k2Lp9Qv3Wz1m8N4T",
    mortgageStatePda: "MrtgShaviPDA55j1Lp4Qv8Wz9c2B7Y3",
    token2022Mint: "SPVShaviToken2022Mint44h9Lp1Qv6",
    sellerWallet: "5M8dOwnB1ockSellr9k21Vb7Qp3Cx2w9L",
    sellerLabel: "ShaviFounder.sol",
    notaryOracleWallet: "1A9cOwnB1ockNotry3z77Ht5Wm8Dx6p3E",
    totalPriceUsdc: 100000,
    minEquityBps: 4000,
    equityRaisedUsdc: 28000,
    debtRaisedUsdc: 45000,
    escrowYieldRateBps: 650,
    escrowYieldAccruedUsdc: 410,
    interestRateBps: 920,
    termMonths: 36,
    estimatedMonthlyRentUsdc: 2950,
    legalDocHash:
      "0x2a4f9c81e6b30d7a52c19f84b60e3d9c7a1f4b8e2d6c0a9f3e7b1d5c8a4e2f6b",
    spvEntityName: "OwnBlock Shavi Roasters Equity #201 LLC",
    registryExtractId: "NAPR-BIZ-405198231-40PCT",
    sellerSigned: false,
    notarySigned: false,
    status: "Funding",
    coBuyers: [
      {
        wallet: "9F4kOwnB1ockBuyer1x89Lp2Qv7Wz8x2A",
        label: "Luka.sol",
        equityUsdc: 18000,
        reserveUsdc: 900,
        shareBps: 6428,
        unlockedShares: 0,
        lockedShares: 0,
        signedContract: false,
      },
      {
        wallet: "3H7pOwnB1ockBuyer2m44Kr9Tc1Yz4m1Q",
        label: "Nino.sol",
        equityUsdc: 10000,
        reserveUsdc: 500,
        shareBps: 3572,
        unlockedShares: 0,
        lockedShares: 0,
        signedContract: false,
      },
    ],
    lenders: [
      {
        wallet: "7K2vOwnB1ockLendr5p18Jm4Nx6Bz9z5R",
        label: "Housd SME Credit Pool",
        amountUsdc: 45000,
        source: "GlobalPool",
      },
    ],
    mortgage: {
      remainingPrincipalUsdc: 0,
      monthlyPaymentUsdc: 1610,
      monthlyPrincipalUsdc: 1250,
      monthlyInterestUsdc: 360,
      reserveBalanceUsdc: 1400,
      monthsPaid: 0,
      missedPayments: 0,
      liquidationPriceUsdc: 0,
      totalInterestPaidToLendersUsdc: 0,
      totalNetRentPaidToBuyersUsdc: 0,
    },
  },
  {
    id: "batumi-riviera-sky-suite",
    listingIdNum: 102,
    assetType: "RealEstate",
    title: "Batumi Riviera Sky Suite — First Coastline",
    subtitle:
      "100% funded (40% Co-Buyers + 60% Housd Mortgage) — Ready for 4-party legal closing",
    city: "Batumi, Boulevard",
    country: "Georgia",
    countryFlag: "🇬🇪",
    category: "ResortVilla",
    categoryLabel: "Seafront Aparthotel",
    imageUrl:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85",
    areaSqm: 78,
    annualYieldPct: 13.8,
    pdaAddress: "Own2ndBatumiPDA44x2Lp8Qv1Wz9k3M7Q",
    escrowVaultPda: "EscrowBatumiPDA33k9Lp2Qv6Wz8m1N2R",
    mortgageStatePda: "MrtgBatumiPDA22j8Lp1Qv4Wz7c9B5Y1z",
    token2022Mint: "SPVBatumiToken2022Mint11h7Lp3Qv",
    sellerWallet: "5M8dOwnB1ockSellr9k21Vb7Qp3Cx2w9L",
    sellerLabel: "OrbiAxisDev.sol",
    notaryOracleWallet: "1A9cOwnB1ockNotry3z77Ht5Wm8Dx6p3E",
    totalPriceUsdc: 80000,
    minEquityBps: 3500,
    equityRaisedUsdc: 32000,
    debtRaisedUsdc: 48000,
    escrowYieldRateBps: 650,
    escrowYieldAccruedUsdc: 610,
    interestRateBps: 880,
    termMonths: 48,
    estimatedMonthlyRentUsdc: 1580,
    legalDocHash:
      "0x3c9a7f14e8b20d5c62a18f40e9d7b3c5a1f8e2d4b6c0a9e3f7d1b5c8a2e4f6d0",
    spvEntityName: "OwnBlock Batumi Sky #102 LLC",
    registryExtractId: "NAPR-GE-05.24.08.012.019",
    sellerSigned: true,
    notarySigned: true,
    status: "AwaitingSignatures",
    coBuyers: [
      {
        wallet: "9F4kOwnB1ockBuyer1x89Lp2Qv7Wz8x2A",
        label: "Luka.sol",
        equityUsdc: 20000,
        reserveUsdc: 1000,
        shareBps: 6250,
        unlockedShares: 0,
        lockedShares: 0,
        signedContract: true,
      },
      {
        wallet: "3H7pOwnB1ockBuyer2m44Kr9Tc1Yz4m1Q",
        label: "Nino.sol",
        equityUsdc: 12000,
        reserveUsdc: 600,
        shareBps: 3750,
        unlockedShares: 0,
        lockedShares: 0,
        signedContract: false,
      },
    ],
    lenders: [
      {
        wallet: "7K2vOwnB1ockLendr5p18Jm4Nx6Bz9z5R",
        label: "CaucasusCapital.sol",
        amountUsdc: 48000,
        source: "Direct",
      },
    ],
    mortgage: {
      remainingPrincipalUsdc: 48000,
      monthlyPaymentUsdc: 1352,
      monthlyPrincipalUsdc: 1000,
      monthlyInterestUsdc: 352,
      reserveBalanceUsdc: 1600,
      monthsPaid: 0,
      missedPayments: 0,
      liquidationPriceUsdc: 0,
      totalInterestPaidToLendersUsdc: 0,
      totalNetRentPaidToBuyersUsdc: 0,
    },
  },
  {
    id: "yerevan-cascade-tech-hub",
    listingIdNum: 202,
    assetType: "BusinessEquity",
    title: "AraratCloud AI GPU Cluster & SaaS Hub (35% Equity)",
    subtitle:
      "Operating B2B AI inference cluster & enterprise engineering hub in central Yerevan distributing monthly EBITDA",
    city: "Yerevan, Kentron",
    country: "Armenia",
    countryFlag: "🇦🇲",
    category: "CommercialTech",
    categoryLabel: "Operating Business · AI & Cloud",
    imageUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85",
    areaSqm: 210,
    annualYieldPct: 19.5,
    businessMetrics: {
      equityOfferedPct: 35,
      annualRevenueUsdc: 510000,
      ebitdaMarginPct: 36,
      foundedYear: 2022,
      employeesCount: 28,
      payoutFrequency: "Monthly",
    },
    pdaAddress: "Own5thYerevanPDA66x9Lp2Qv7Wz4k1M",
    escrowVaultPda: "EscrowYerevanPDA55k2Lp9Qv3Wz1m8N",
    mortgageStatePda: "MrtgYerevanPDA44j1Lp4Qv8Wz9c2B7Y",
    token2022Mint: "SPVYerevanToken2022Mint33h9Lp1Qv",
    sellerWallet: "5M8dOwnB1ockSellr9k21Vb7Qp3Cx2w9L",
    sellerLabel: "AraratCloud.sol",
    notaryOracleWallet: "1A9cOwnB1ockNotry3z77Ht5Wm8Dx6p3E",
    totalPriceUsdc: 140000,
    minEquityBps: 3000,
    equityRaisedUsdc: 28000,
    debtRaisedUsdc: 70000,
    escrowYieldRateBps: 650,
    escrowYieldAccruedUsdc: 510,
    interestRateBps: 900,
    termMonths: 60,
    estimatedMonthlyRentUsdc: 3150,
    legalDocHash:
      "0x7b2c9d3e0f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c",
    spvEntityName: "OwnBlock Yerevan AI Hub #202 LLC",
    registryExtractId: "CAD-AM-01-2026-8841",
    sellerSigned: false,
    notarySigned: false,
    status: "Funding",
    coBuyers: [
      {
        wallet: "3H7pOwnB1ockBuyer2m44Kr9Tc1Yz4m1Q",
        label: "Nino.sol",
        equityUsdc: 28000,
        reserveUsdc: 1400,
        shareBps: 10000,
        unlockedShares: 0,
        lockedShares: 0,
        signedContract: false,
      },
    ],
    lenders: [
      {
        wallet: "7K2vOwnB1ockLendr5p18Jm4Nx6Bz9z5R",
        label: "Housd Caucasus Pool",
        amountUsdc: 70000,
        source: "GlobalPool",
      },
    ],
    mortgage: {
      remainingPrincipalUsdc: 0,
      monthlyPaymentUsdc: 1690,
      monthlyPrincipalUsdc: 1165,
      monthlyInterestUsdc: 525,
      reserveBalanceUsdc: 1400,
      monthsPaid: 0,
      missedPayments: 0,
      liquidationPriceUsdc: 0,
      totalInterestPaidToLendersUsdc: 0,
      totalNetRentPaidToBuyersUsdc: 0,
    },
  },
  {
    id: "gudauri-alpine-chalet",
    listingIdNum: 103,
    assetType: "RealEstate",
    title: "New Gudauri Ski-In Alpine Chalet & Spa",
    subtitle:
      "Active property! Monthly ski-resort rent automatically pays down the Housd mortgage and streams net profit",
    city: "Gudauri, Kazbegi",
    country: "Georgia",
    countryFlag: "🇬🇪",
    category: "ResortVilla",
    categoryLabel: "Alpine Ski Villa",
    imageUrl:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=85",
    areaSqm: 165,
    annualYieldPct: 14.2,
    pdaAddress: "Own3rdGudauriPDA99x1Lp4Qv7Wz2k8M5R",
    escrowVaultPda: "EscrowGudauriPDA88k4Lp1Qv9Wz3m7N6T",
    mortgageStatePda: "MrtgGudauriPDA77j3Lp6Qv2Wz5c1B8Y",
    token2022Mint: "SPVGudauriToken2022Mint66h2Lp8Qv",
    sellerWallet: "5M8dOwnB1ockSellr9k21Vb7Qp3Cx2w9L",
    sellerLabel: "OrbiAxisDev.sol",
    notaryOracleWallet: "1A9cOwnB1ockNotry3z77Ht5Wm8Dx6p3E",
    totalPriceUsdc: 150000,
    minEquityBps: 4000,
    equityRaisedUsdc: 60000,
    debtRaisedUsdc: 90000,
    escrowYieldRateBps: 650,
    escrowYieldAccruedUsdc: 890,
    interestRateBps: 900,
    termMonths: 36,
    estimatedMonthlyRentUsdc: 3900,
    legalDocHash:
      "0x91d4e7a2c8f50b3e49c17a82d6f0b5e3c9a2d8f4b1e7c3a5d9f2b4e6a8c0d2f4",
    spvEntityName: "OwnBlock Gudauri Chalet #103 LLC",
    registryExtractId: "NAPR-GE-72.09.11.004.002",
    sellerSigned: true,
    notarySigned: true,
    status: "ActiveMortgage",
    coBuyers: [
      {
        wallet: "9F4kOwnB1ockBuyer1x89Lp2Qv7Wz8x2A",
        label: "Luka.sol",
        equityUsdc: 30000,
        reserveUsdc: 2000,
        shareBps: 5000,
        unlockedShares: 280000,
        lockedShares: 220000,
        signedContract: true,
      },
      {
        wallet: "3H7pOwnB1ockBuyer2m44Kr9Tc1Yz4m1Q",
        label: "Nino.sol",
        equityUsdc: 30000,
        reserveUsdc: 2000,
        shareBps: 5000,
        unlockedShares: 280000,
        lockedShares: 220000,
        signedContract: true,
      },
    ],
    lenders: [
      {
        wallet: "7K2vOwnB1ockLendr5p18Jm4Nx6Bz9z5R",
        label: "Housd Caucasus Pool",
        amountUsdc: 90000,
        source: "GlobalPool",
      },
    ],
    mortgage: {
      remainingPrincipalUsdc: 65000,
      monthlyPaymentUsdc: 3175,
      monthlyPrincipalUsdc: 2500,
      monthlyInterestUsdc: 675,
      reserveBalanceUsdc: 4000,
      monthsPaid: 10,
      missedPayments: 0,
      liquidationPriceUsdc: 0,
      totalInterestPaidToLendersUsdc: 6750,
      totalNetRentPaidToBuyersUsdc: 7250,
    },
  },
  {
    id: "kakheti-wine-chateau",
    listingIdNum: 203,
    assetType: "BusinessEquity",
    title: "Tsinandali Qvevri Winery & EU Export Co. (50% Equity)",
    subtitle:
      "Operating Kakheti winery & 12-suite hospitality business exporting 85,000 bottles/yr to EU & Japan",
    city: "Telavi, Tsinandali",
    country: "Georgia",
    countryFlag: "🇬🇪",
    category: "WineEstate",
    categoryLabel: "Operating Business · Winery",
    imageUrl:
      "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=85",
    areaSqm: 450,
    annualYieldPct: 16.2,
    businessMetrics: {
      equityOfferedPct: 50,
      annualRevenueUsdc: 620000,
      ebitdaMarginPct: 31,
      foundedYear: 2018,
      employeesCount: 42,
      payoutFrequency: "Monthly",
    },
    pdaAddress: "Own4thKakhetiPDA55x9Lp2Qv7Wz4k1M",
    escrowVaultPda: "EscrowKakhetiPDA44k2Lp9Qv3Wz1m8N",
    mortgageStatePda: "MrtgKakhetiPDA33j1Lp4Qv8Wz9c2B7Y",
    token2022Mint: "SPVKakhetiToken2022Mint22h9Lp1Qv",
    sellerWallet: "5M8dOwnB1ockSellr9k21Vb7Qp3Cx2w9L",
    sellerLabel: "OrbiAxisDev.sol",
    notaryOracleWallet: "1A9cOwnB1ockNotry3z77Ht5Wm8Dx6p3E",
    totalPriceUsdc: 180000,
    minEquityBps: 3000,
    equityRaisedUsdc: 45000,
    debtRaisedUsdc: 65000,
    escrowYieldRateBps: 650,
    escrowYieldAccruedUsdc: 740,
    interestRateBps: 850,
    termMonths: 60,
    estimatedMonthlyRentUsdc: 3450,
    legalDocHash:
      "0x6a1b8c2d9e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
    spvEntityName: "OwnBlock Tsinandali Winery #203 LLC",
    registryExtractId: "NAPR-GE-45.12.01.088.001",
    sellerSigned: false,
    notarySigned: false,
    status: "Funding",
    coBuyers: [
      {
        wallet: "9F4kOwnB1ockBuyer1x89Lp2Qv7Wz8x2A",
        label: "Luka.sol",
        equityUsdc: 45000,
        reserveUsdc: 2250,
        shareBps: 10000,
        unlockedShares: 0,
        lockedShares: 0,
        signedContract: false,
      },
    ],
    lenders: [
      {
        wallet: "7K2vOwnB1ockLendr5p18Jm4Nx6Bz9z5R",
        label: "Housd Caucasus Pool",
        amountUsdc: 65000,
        source: "GlobalPool",
      },
    ],
    mortgage: {
      remainingPrincipalUsdc: 0,
      monthlyPaymentUsdc: 1840,
      monthlyPrincipalUsdc: 1380,
      monthlyInterestUsdc: 460,
      reserveBalanceUsdc: 2250,
      monthsPaid: 0,
      missedPayments: 0,
      liquidationPriceUsdc: 0,
      totalInterestPaidToLendersUsdc: 0,
      totalNetRentPaidToBuyersUsdc: 0,
    },
  },
  {
    id: "baku-seabreeze-marina-villa",
    listingIdNum: 104,
    assetType: "RealEstate",
    title: "Baku Sea Breeze Caspian Resort Residence",
    subtitle:
      "Caspian Sea resort apartment with private marina access and 24/7 hotel management",
    city: "Baku, Nardaran",
    country: "Azerbaijan",
    countryFlag: "🇦🇿",
    category: "ResortVilla",
    categoryLabel: "Coastal Resort",
    imageUrl:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=85",
    areaSqm: 115,
    annualYieldPct: 11.9,
    pdaAddress: "Own6thBakuPDA77x9Lp2Qv7Wz4k1M9R2",
    escrowVaultPda: "EscrowBakuPDA66k2Lp9Qv3Wz1m8N4T5",
    mortgageStatePda: "MrtgBakuPDA55j1Lp4Qv8Wz9c2B7Y3x",
    token2022Mint: "SPVBakuToken2022Mint44h9Lp1Qv6Wz",
    sellerWallet: "5M8dOwnB1ockSellr9k21Vb7Qp3Cx2w9L",
    sellerLabel: "OrbiAxisDev.sol",
    notaryOracleWallet: "1A9cOwnB1ockNotry3z77Ht5Wm8Dx6p3E",
    totalPriceUsdc: 110000,
    minEquityBps: 3000,
    equityRaisedUsdc: 22000,
    debtRaisedUsdc: 44000,
    escrowYieldRateBps: 650,
    escrowYieldAccruedUsdc: 390,
    interestRateBps: 870,
    termMonths: 60,
    estimatedMonthlyRentUsdc: 1750,
    legalDocHash:
      "0x5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c",
    spvEntityName: "OwnBlock Baku SeaBreeze #104 LLC",
    registryExtractId: "AZ-REG-2026-99104",
    sellerSigned: false,
    notarySigned: false,
    status: "Funding",
    coBuyers: [
      {
        wallet: "9F4kOwnB1ockBuyer1x89Lp2Qv7Wz8x2A",
        label: "Luka.sol",
        equityUsdc: 22000,
        reserveUsdc: 1100,
        shareBps: 10000,
        unlockedShares: 0,
        lockedShares: 0,
        signedContract: false,
      },
    ],
    lenders: [
      {
        wallet: "7K2vOwnB1ockLendr5p18Jm4Nx6Bz9z5R",
        label: "Housd Caucasus Pool",
        amountUsdc: 44000,
        source: "GlobalPool",
      },
    ],
    mortgage: {
      remainingPrincipalUsdc: 0,
      monthlyPaymentUsdc: 1295,
      monthlyPrincipalUsdc: 975,
      monthlyInterestUsdc: 320,
      reserveBalanceUsdc: 1100,
      monthsPaid: 0,
      missedPayments: 0,
      liquidationPriceUsdc: 0,
      totalInterestPaidToLendersUsdc: 0,
      totalNetRentPaidToBuyersUsdc: 0,
    },
  },
];
