"use client";

import React from "react";
import Link from "next/link";

export default function OnePagerPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] py-10 px-4 sm:px-6 print:py-0 print:px-0 print:bg-white">
      {/* Top Action Bar (hidden when printing to PDF) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#0F172A] hover:bg-slate-50 transition"
          >
            ← Back to Marketplace
          </Link>
          <Link
            href="/deck"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition"
          >
            Open 7-Slide Pitch Deck →
          </Link>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-[#0B1120] text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
        >
          Export / Print One-Pager as PDF (⌘P)
        </button>
      </div>

      {/* One-Pager Sheet */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-lofty p-8 sm:p-10 print:shadow-none print:border-none print:p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0B1120] text-white flex items-center justify-center font-serif font-bold text-2xl">
              OB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F172A]">
                  OwnBlock Protocol
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider">
                  Solana RWA &amp; SME Equity
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Fractional Co-Ownership for Prime Real Estate &amp; Operating
                Businesses with 4-Party Legal SPV Escrow &amp; On-Chain Housd
                Credit
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 sm:text-right font-mono space-y-0.5">
            <div className="font-bold text-[#0F172A]">
              ownblock.vercel.app
            </div>
            <div>github.com/Benefact0r/ownblock</div>
            <div className="text-emerald-700 font-semibold">
              Colosseum Hackathon 2026
            </div>
          </div>
        </div>

        {/* Executive Summary Strip */}
        <div className="rounded-2xl bg-[#0B1120] text-white p-5 grid sm:grid-cols-4 gap-4">
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">
              Target Region
            </div>
            <div className="text-base font-bold text-white mt-0.5">
              Caucasus (GE, AM, AZ)
            </div>
            <div className="text-[11px] text-emerald-400">
              11.4% – 19.5% Net APY
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">
              Dual-Tranche Leverage
            </div>
            <div className="text-base font-bold text-white mt-0.5">
              30% Equity / 70% Debt
            </div>
            <div className="text-[11px] text-indigo-300">
              Housd Senior Credit Pool
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">
              Legal Protection
            </div>
            <div className="text-base font-bold text-white mt-0.5">
              SPV LLC + 4-Sig Gate
            </div>
            <div className="text-[11px] text-emerald-400">
              Public Registry (NAPR) Twin
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">
              Minimum Entry
            </div>
            <div className="text-base font-bold text-white mt-0.5">
              $100 USDC / Block
            </div>
            <div className="text-[11px] text-indigo-300">
              SPL Token-2022 Shares
            </div>
          </div>
        </div>

        {/* Two Columns: The Problem vs. The OwnBlock Solution */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-600">
              01 · The Problem
            </div>
            <h2 className="font-bold text-base text-[#0F172A]">
              High-Yield Real Assets Are Locked Behind 100% Cash Walls
            </h2>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Illiquid Capital Barrier:</strong> Prime apartments and
                profitable local SMEs (coffee chains, wineries, AI hubs) yield
                12–20% APY, but sellers demand 100% upfront cash at closing.
              </li>
              <li>
                <strong>Punitive Bank Loans:</strong> Regional banks in Georgia,
                Armenia, and Azerbaijan charge 13–15% APR with slow, rigid
                underwriting.
              </li>
              <li>
                <strong>Zero Trust in Informal Co-Buying:</strong> Pooling funds
                with co-buyers off-chain exposes participants to custody risk
                and unrecorded ownership claims.
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              02 · The OwnBlock Solution
            </div>
            <h2 className="font-bold text-base text-[#0F172A]">
              Co-Buy Real Estate &amp; Operating Businesses on Solana
            </h2>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Fractional Syndicate Pooling ($100+):</strong> Co-buyers
                pool USDC to acquire 1/10th to 1/2 of a luxury residence or a
                30%–50% equity stake in an operating business.
              </li>
              <li>
                <strong>Housd 30/70 On-Chain Financing:</strong> Once co-buyers
                fund 30%–40% down payment, the Housd Senior Credit Pool
                automatically finances the remaining 60%–70% at 8.5% fixed APR.
              </li>
              <li>
                <strong>4-Party Legal Escrow Gate:</strong> Seller receives zero
                funds until Co-Buyers, Seller, and the Public Registry Notary
                Oracle all sign the SHA-256 SPV LLC agreement on-chain.
              </li>
            </ul>
          </div>
        </div>

        {/* 4-Step Lifecycle Architecture */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-700">
            03 · End-to-End Protocol Lifecycle (Solana Anchor + SPV Legal Twin)
          </div>
          <div className="grid sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <div className="font-bold text-[#0F172A] mb-1">
                1. Pool 30% Equity
              </div>
              <p className="text-slate-600 leading-relaxed">
                Co-buyers deposit USDC (+5% safety reserve) into the non-custodial
                PDA Vault, earning 6.5% escrow APY while the syndicate fills.
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <div className="font-bold text-[#0F172A] mb-1">
                2. 70% Housd Match
              </div>
              <p className="text-slate-600 leading-relaxed">
                DeFi LPs in the Housd Senior Credit Pool fund the remaining 70%
                senior debt tranche, protected by a first-priority SPV lien.
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <div className="font-bold text-[#0F172A] mb-1">
                3. 4-Party SPV Closing
              </div>
              <p className="text-slate-600 leading-relaxed">
                Co-Buyers, Seller, and NAPR Notary sign `sign_legal_agreement`.
                `execute_closing` releases USDC to Seller &amp; mints 1M
                Token-2022 shares.
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <div className="font-bold text-[#0F172A] mb-1">
                4. Cashflow Waterfall
              </div>
              <p className="text-slate-600 leading-relaxed">
                Monthly rent &amp; business EBITDA pay Housd lenders first,
                progressively unlock co-buyer tokens, and stream net USDC profit.
              </p>
            </div>
          </div>
        </div>

        {/* Business Model & 6-Month Roadmap */}
        <div className="grid sm:grid-cols-2 gap-5 pt-2 border-t border-slate-200 text-xs">
          <div>
            <div className="font-bold uppercase tracking-wider text-slate-500 mb-2">
              04 · Revenue Model
            </div>
            <div className="space-y-1.5 text-slate-600">
              <div>
                • <strong>1.5% Origination &amp; SPV Closing Fee</strong> on
                tokenized Real Estate and Business Equity syndications.
              </div>
              <div>
                • <strong>1.0% Net Interest Spread</strong> on Housd Senior
                Credit Pool loans (`9.5% borrower rate` vs `8.5% LP yield`).
              </div>
              <div>
                • <strong>0.5% Secondary Marketplace Fee</strong> on instant P2P
                transfers of unlocked SPL Token-2022 SPV shares.
              </div>
            </div>
          </div>

          <div>
            <div className="font-bold uppercase tracking-wider text-slate-500 mb-2">
              05 · 6-Month Milestone Horizon
            </div>
            <div className="space-y-1.5 text-slate-600">
              <div>
                • <strong>Months 1–2:</strong> Anchor Mainnet audit + NAPR SPV
                LLC legal template standardization in Georgia.
              </div>
              <div>
                • <strong>Months 3–4:</strong> First $1.2M pilot closings (3
                Tbilisi/Batumi apartments + 2 operating F&amp;B / Winery deals).
              </div>
              <div>
                • <strong>Months 5–6:</strong> Expand to Yerevan &amp; Baku;
                scale Housd Senior Pool to $5M TVL across 25+ RWA/SME deals.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
