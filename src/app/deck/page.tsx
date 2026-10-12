"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface SlideItem {
  num: string;
  tag: string;
  title: string;
  subtitle: string;
  metrics: { label: string; value: string; note: string }[];
  bullets: { heading: string; body: string }[];
  footerNote: string;
}

const SLIDES: SlideItem[] = [
  {
    num: "01 / 07",
    tag: "Colosseum Solana Hackathon · RWA & DeFi Track",
    title: "OwnBlock: Co-Own Prime Real Estate & Operating Businesses on Solana",
    subtitle:
      "Combining Pacaso's fractional co-ownership, Lofty's instant liquidity, and Housd's 30/70 on-chain acquisition financing — enforced by SPV corporate law.",
    metrics: [
      {
        label: "Minimum Ticket",
        value: "$100 USDC",
        note: "Fractional SPL Token-2022 Shares",
      },
      {
        label: "Annual Cashflow Yield",
        value: "11.4% – 19.5%",
        note: "Rent & Business EBITDA Dividends",
      },
      {
        label: "Housd Leverage",
        value: "30% / 70%",
        note: "Co-Buyer Equity + Senior Loan",
      },
    ],
    bullets: [
      {
        heading: "Real Estate + Operating Businesses",
        body: "Co-buy luxury residences in Tbilisi, Batumi, Gudauri & Baku OR acquire 30%–50% equity stakes in profitable local businesses (coffee chains, wineries, AI hubs).",
      },
      {
        heading: "4-Party Non-Custodial Escrow",
        body: "Zero counterparty risk: funds remain locked in a Solana PDA vault earning 6.5% APY until Co-Buyers, Seller, and the Public Registry Notary sign on-chain.",
      },
    ],
    footerNote: "Live Demo: https://ownblock.vercel.app · GitHub: github.com/Benefact0r/ownblock",
  },
  {
    num: "02 / 07",
    tag: "The Market Pain",
    title: "Why 90% of Investors Are Locked Out of High-Yield Real Assets",
    subtitle:
      "Emerging growth hubs like the Caucasus offer 12–20% real yields, but antiquated capital markets block everyday buyers and founders.",
    metrics: [
      {
        label: "Seller Requirement",
        value: "100% Upfront",
        note: "Full cash demanded at closing",
      },
      {
        label: "Local Bank Mortgages",
        value: "13.5% – 15% APR",
        note: "High rates & slow bureaucracy",
      },
      {
        label: "Informal Syndicates",
        value: "0% Escrow Safety",
        note: "Custody & title disputes",
      },
    ],
    bullets: [
      {
        heading: "Buyers Have Partial Capital ($5k–$30k), Not $150k",
        body: "Thousands of retail and crypto investors want to own a fraction of an apartment or local business, but have no trustless way to pool capital and co-sign title.",
      },
      {
        heading: "Profitable SMEs Cannot Sell Partial Equity Easily",
        body: "Founders of cash-flowing businesses (e.g., a 5-branch coffee roastery or winery) want to sell 30–40% equity for expansion without taking predatory bank debt.",
      },
    ],
    footerNote: "Problem: High-yield assets exist, but fractional trust + leverage infrastructure is missing.",
  },
  {
    num: "03 / 07",
    tag: "The OwnBlock Solution",
    title: "Two Asset Classes, One Unified Solana Co-Ownership Protocol",
    subtitle:
      "OwnBlock turns both physical real estate and cash-flowing SMEs into standardized, legally ring-fenced Solana SPV syndicates.",
    metrics: [
      {
        label: "Prime Real Estate",
        value: "11.4% – 14.2% APY",
        note: "Vake, Batumi Riviera, Gudauri, Baku",
      },
      {
        label: "Operating Business Shares",
        value: "16.2% – 19.5% APY",
        note: "Coffee Chains, Wineries, AI Clusters",
      },
      {
        label: "Escrow Waiting Yield",
        value: "+6.5% APY",
        note: "Accrued while syndicate fills",
      },
    ],
    bullets: [
      {
        heading: "1. Fractional Real Estate Co-Buying",
        body: "Select 1/10, 1/8, 1/4, or 1/2 shares of vetted apartments and resort villas with diplomatic or hotel-managed leases.",
      },
      {
        heading: "2. Fractional Business Equity Buyouts",
        body: "Buy corporate shares in verified operating companies with live POS/Open-Banking revenue tracking and monthly USDC EBITDA dividend payouts.",
      },
    ],
    footerNote: "Both asset classes use the exact same Solana Anchor escrow & SPV legal pipeline.",
  },
  {
    num: "04 / 07",
    tag: "Unfair Advantage · The Housd Engine",
    title: "30% Co-Buyer Equity + 70% On-Chain Housd Credit Pool",
    subtitle:
      "Co-buyers don't need to wait months to raise 100% of the price. Once co-buyers pool 30%–40% down payment, the Housd Senior Credit Pool finances the rest.",
    metrics: [
      {
        label: "Co-Buyer Down Payment",
        value: "30% – 40%",
        note: "First-loss equity tranche",
      },
      {
        label: "Housd Senior Debt",
        value: "60% – 70%",
        note: "8.5% Fixed USDC APY for LPs",
      },
      {
        label: "Default Protection",
        value: "5% Reserve Buffer",
        note: "Auto-covers missed payments",
      },
    ],
    bullets: [
      {
        heading: "Progressive Token-2022 Equity Unlock",
        body: "At closing, 30% of SPL shares are immediately unlocked and 70% are locked as loan collateral. Every monthly rent/EBITDA payment unlocks more shares.",
      },
      {
        heading: "Institutional-Grade Senior Safety for DeFi LPs",
        body: "DeFi liquidity providers earn 8.5% fixed USDC APY backed by first-lien real estate & corporate collateral plus a 30% equity cushion.",
      },
    ],
    footerNote: "Solves the #1 RWA bottleneck: slow syndicate fundraising.",
  },
  {
    num: "05 / 07",
    tag: "Legal & Smart Contract Architecture",
    title: "SPV LLC Legal Twin + 4-Party On-Chain Escrow Gate",
    subtitle:
      "Every listing is paired with a dedicated Special Purpose Vehicle LLC registered with the National Agency of Public Registry (NAPR).",
    metrics: [
      {
        label: "Smart Contract",
        value: "9 Instructions",
        note: "Solana Anchor (Rust)",
      },
      {
        label: "Closing Requirement",
        value: "4 Signatures",
        note: "Co-Buyers + Seller + Notary Oracle",
      },
      {
        label: "Share Standard",
        value: "1,000,000 SPL",
        note: "Token-2022 per SPV LLC",
      },
    ],
    bullets: [
      {
        heading: "Ricardian SHA-256 Contract Binding",
        body: "The SPV Operating Agreement & NAPR Extract ID are hashed on-chain (`legal_doc_hash`). `execute_closing` reverts unless all 4 parties sign.",
      },
      {
        heading: "Automated Cashflow Waterfall (`pay_installment_or_rent`)",
        body: "A single Solana instruction routes monthly rent or business EBITDA to pay Housd senior principal + interest first, then distributes net USDC to co-buyers.",
      },
    ],
    footerNote: "Code: programs/ownblock/src/lib.rs · 4 PDAs (GlobalPool, Listing, Position, MortgageState).",
  },
  {
    num: "06 / 07",
    tag: "Live Product & Compliance",
    title: "What We Built: Marketplace, Escrow Simulator & Admin KYB Console",
    subtitle:
      "A complete full-stack application live at ownblock.vercel.app with real Solana Devnet RPC telemetry and Phantom/Solflare wallet signing.",
    metrics: [
      {
        label: "Live Deals",
        value: "6 Caucasus Assets",
        note: "3 Real Estate + 3 Operating SMEs",
      },
      {
        label: "Admin Console",
        value: "7 Verified Profiles",
        note: "KYC/KYB, AML Score & Live Holdings",
      },
      {
        label: "Wallet Modes",
        value: "Live + Demo",
        note: "Phantom/Solflare + 5 Demo Personas",
      },
    ],
    bullets: [
      {
        heading: "Interactive Deal Simulator for Judges",
        body: "Judges can select 1/10 to 1/2 shares, fund equity & Housd debt, co-sign the 4-party SPV contract, execute closing, and trigger monthly cashflow waterfalls.",
      },
      {
        heading: "Built-In Admin & Compliance Dashboard",
        body: "Real-time back-office panel inspecting user Passport/NAPR IDs, bank IBANs, AML scores, and live on-chain SPV equity & loan positions.",
      },
    ],
    footerNote: "Test live right now at https://ownblock.vercel.app",
  },
  {
    num: "07 / 07",
    tag: "Business Model & 6-Month Horizon",
    title: "Revenue Model & 6-Month Execution Roadmap",
    subtitle:
      "Clear monetization across syndication closings, Housd credit spread, and secondary share trading — targeting $5M TVL within 6 months.",
    metrics: [
      {
        label: "Origination Fee",
        value: "1.5% at Closing",
        note: "On funded Real Estate & SME SPVs",
      },
      {
        label: "Housd Net Spread",
        value: "1.0% NIM",
        note: "Between borrower APR & LP APY",
      },
      {
        label: "6-Month Target",
        value: "$5.0M TVL",
        note: "Across 25+ Caucasus RWA & SME deals",
      },
    ],
    bullets: [
      {
        heading: "Months 1–3: Legal SPV Standardization & First $1.2M Pilot",
        body: "Complete Anchor audit, finalize NAPR instant SPV LLC registration pipeline in Tbilisi & Batumi, and close first 3 residential + 2 SME equity deals.",
      },
      {
        heading: "Months 4–6: Regional Expansion & Secondary Orderbook",
        body: "Expand operating business buyouts to Yerevan & Baku, onboard institutional USDC lenders to the Housd Pool, and launch instant P2P Token-2022 trading.",
      },
    ],
    footerNote: "OwnBlock — Where Solana DeFi Liquidity Meets Real-World Property & Business Ownership.",
  },
];

export default function DeckPage() {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const slide = SLIDES[currentIdx];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentIdx((prev) => Math.min(SLIDES.length - 1, prev + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentIdx((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition"
          >
            ← Back to Live App
          </Link>
          <Link
            href="/one-pager"
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-bold text-emerald-300 transition"
          >
            View Printable One-Pager →
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {SLIDES.map((s, idx) => (
            <button
              key={s.num}
              onClick={() => setCurrentIdx(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                idx === currentIdx
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Active Slide Canvas */}
      <div className="max-w-6xl w-full mx-auto my-auto py-8">
        <div className="rounded-[32px] bg-gradient-to-br from-slate-900 via-[#0F172A] to-indigo-950/60 border border-slate-800 p-8 sm:p-14 shadow-2xl min-h-[540px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-6">
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                {slide.tag}
              </span>
              <span className="font-mono text-sm font-bold text-slate-400">
                Slide {slide.num}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl font-semibold leading-[1.12] tracking-tight text-white max-w-4xl mb-4">
              {slide.title}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed mb-8">
              {slide.subtitle}
            </p>

            {/* 3 Metric Cards */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {slide.metrics.map((m) => (
                <div
                  key={m.label}
                  className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800"
                >
                  <div className="text-xs text-slate-400 uppercase tracking-wider">
                    {m.label}
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">
                    {m.value}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{m.note}</div>
                </div>
              ))}
            </div>

            {/* 2 Core Bullets */}
            <div className="grid sm:grid-cols-2 gap-5">
              {slide.bullets.map((b) => (
                <div
                  key={b.heading}
                  className="p-5 rounded-2xl bg-white/5 border border-white/10"
                >
                  <h3 className="font-bold text-base text-white mb-1.5">
                    {b.heading}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {b.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <span>{slide.footerNote}</span>
            <span className="font-mono text-slate-500">
              Use ← / → arrow keys or buttons below to navigate
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Slide Controls */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-xs font-bold cursor-pointer"
        >
          ← Previous Slide
        </button>

        <div className="text-xs text-slate-400 font-medium">
          OwnBlock Colosseum Pitch Deck · Slide {currentIdx + 1} of{" "}
          {SLIDES.length}
        </div>

        <button
          onClick={() =>
            setCurrentIdx((prev) => Math.min(SLIDES.length - 1, prev + 1))
          }
          disabled={currentIdx === SLIDES.length - 1}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
        >
          Next Slide →
        </button>
      </div>
    </div>
  );
}
