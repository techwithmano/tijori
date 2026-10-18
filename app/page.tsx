"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Zap,
  ExternalLink,
  Lock,
  Unlock,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Coins,
  Calendar,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  X,
  Share2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  Flame,
  CreditCard,
} from "lucide-react";
import { formatKWD } from "@/lib/utils";

interface Transaction {
  _id?: string;
  amount: number;
  type: "SCHEDULED_PULL" | "SIMULATED_PULL" | "WITHDRAWAL";
  status: string;
  createdAt: string;
  note?: string;
}

interface Vault {
  _id: string;
  title: string;
  targetAmount: number;
  currentBalance: number;
  cadence: string;
  pullAmount: number;
  allowanceDay: number;
  status: "LOCKED" | "UNLOCK_PENDING" | "UNLOCKED";
  keyholder: {
    name: string;
    phone: string;
    relationship: string;
  };
  transactions: Transaction[];
  targetDate: string;
  breakExcuse?: string;
  realityCheck?: string;
  unlockToken?: string | null;
  unlockReason?: string | null;
  totalProtected?: number;
  createdAt: string;
}

export default function DashboardPage() {
  const [vault, setVault] = useState<Vault | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);

  // Stripe deposit state
  const [isDepositingStripe, setIsDepositingStripe] = useState(false);
  const [stripeSuccessMsg, setStripeSuccessMsg] = useState<string | null>(null);

  // Break modal states
  const [excuseText, setExcuseText] = useState(
    "There's a limited drop sneaker sale at 360 Mall and it ends tonight..."
  );
  const [generatingRoast, setGeneratingRoast] = useState(false);
  const [aiRoast, setAiRoast] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [generatedUnlockUrl, setGeneratedUnlockUrl] = useState<string | null>(null);

  // Load vault data
  const loadVault = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vault");
      const data = await res.json();
      if (data.success && data.vault) {
        setVault(data.vault);
      }
    } catch (err) {
      console.error("Failed to load vault:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVault();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("modal") === "true") {
        setShowBreakModal(true);
      }
      if (params.get("deposit") === "success") {
        const amt = params.get("amount") || "20";
        setStripeSuccessMsg(`🎉 Stripe deposit of +${amt} KWD confirmed! Added to vault.`);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.3 },
          colors: ["#10B981", "#F59E0B", "#FBBF24", "#FFFFFF"],
        });
      }
    }
  }, []);

  // 1. Simulate Micro-Pull Handler
  const handleSimulatePull = async (amountToAdd?: number) => {
    if (!vault) return;
    setPulling(true);

    try {
      const amt = amountToAdd || vault.pullAmount || 25;
      const res = await fetch(`/api/vault/${vault._id}/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });

      const data = await res.json();
      if (data.success && data.vault) {
        setVault(data.vault);

        // Burst celebratory confetti
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.25 },
          colors: ["#F59E0B", "#10B981", "#FBBF24", "#FFFFFF"],
        });
      }
    } catch (err) {
      console.error("Micro-pull error:", err);
    } finally {
      setPulling(false);
    }
  };

  // 2. Stripe Checkout Deposit Flow (Test Mode)
  const handleStripeCheckout = async (amount: number = 20) => {
    if (!vault) return;
    setIsDepositingStripe(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaultId: vault._id, amount }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to initialize Stripe checkout");
      }
    } catch (err: any) {
      alert(err.message || "Failed to start checkout");
    } finally {
      setIsDepositingStripe(false);
    }
  };

  // 3. Emergency Break Request with Gemini AI Reality Check & Token Generation
  const handleSubmitBreakRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vault) return;

    setGeneratingRoast(true);
    setAiRoast(null);

    try {
      // Step A: Call Gemini AI reality check
      const aiRes = await fetch("/api/ai/reality-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          excuse: excuseText,
          goal: vault.title,
          currentBalance: vault.currentBalance,
          targetAmount: vault.targetAmount,
          keyholderName: vault.keyholder.name,
        }),
      });

      const aiData = await aiRes.json();
      const roast =
        aiData.realityCheck ||
        `Tijori Alert: Spending your ${vault.title} funds on "${excuseText}" is an impulse trap. ${vault.keyholder.name} will certainly not approve this.`;
      setAiRoast(roast);

      // Step B: Submit Break Request to Vault (generates single-use token)
      const unlockRes = await fetch(`/api/vault/${vault._id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST",
          reason: excuseText,
          excuse: excuseText,
          realityCheck: roast,
        }),
      });

      const unlockData = await unlockRes.json();
      if (unlockData.success && unlockData.vault) {
        setVault(unlockData.vault);
        setGeneratedUnlockUrl(unlockData.unlockUrl);
        setRequestSent(true);
      }
    } catch (err) {
      console.error("Emergency break request error:", err);
    } finally {
      setGeneratingRoast(false);
    }
  };

  // Quick reset vault to LOCKED for testing
  const handleResetLock = async () => {
    if (!vault) return;
    try {
      const res = await fetch(`/api/vault/${vault._id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "LOCK" }),
      });
      const data = await res.json();
      if (data.success && data.vault) {
        setVault(data.vault);
        setRequestSent(false);
        setAiRoast(null);
        setShowBreakModal(false);
        setGeneratedUnlockUrl(null);
      }
    } catch (err) {
      console.error("Lock error:", err);
    }
  };

  if (loading || !vault) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="mt-4 text-xs font-mono text-slate-400">
          Loading Tijori Anti-Impulse Protocol...
        </p>
      </div>
    );
  }

  // Calculations for Progress Ring
  const current = vault.currentBalance || 0;
  const target = vault.targetAmount || 500;
  const percentFunded = Math.min(100, Math.round((current / target) * 100));

  // Circular progress SVG values (radius 90, circumference ~ 565.48)
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentFunded / 100) * circumference;

  // Active Keyholder decision link: single-use token route if active, otherwise generic
  const keyholderUrl = vault.unlockToken
    ? `/unlock/${vault.unlockToken}`
    : `/unlock/${vault._id}`;

  const currentOrTotalProtected =
    (vault.totalProtected && vault.totalProtected > 0)
      ? vault.totalProtected
      : current;

  return (
    <div className="space-y-6">
      {/* SUCCESS NOTIFICATION (e.g. from Stripe Checkout return) */}
      {stripeSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Stripe Test Deposit Confirmed!</span>
              <span>{stripeSuccessMsg}</span>
            </div>
          </div>
          <button
            onClick={() => setStripeSuccessMsg(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. PROMINENT IMPULSE SAVINGS STAT BADGE */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500/20 via-slate-900 to-emerald-500/10 border border-emerald-500/40 p-3.5 sm:p-4 shadow-lg shadow-emerald-500/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-extrabold text-white tracking-tight flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span>🛡️ You&apos;ve protected</span>
              <span className="text-emerald-400 font-mono text-base sm:text-lg">
                {formatKWD(currentOrTotalProtected)} KWD
              </span>
              <span>from impulse spending.</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Behavioral friction layer actively shielding funds from spontaneous retail traps.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
          <span>Discipline Score: 98%</span>
        </div>
      </div>

      {/* 2. JUDGES DEMO BAR AT TOP (High Visibility Banner) */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-emerald-500/15 border-2 border-amber-500/40 p-4 shadow-xl shadow-amber-500/5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-400 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  Judges & Demo Sandbox
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Live GCC Anti-Impulse Prototype
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Simulate recurring micro-pulls, run Stripe Checkout test deposits, or trigger the Keyholder Protocol.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Button: Simulate Micro-Pull */}
            <button
              id="simulate-pull-btn"
              onClick={() => handleSimulatePull()}
              disabled={pulling}
              className="tactile-btn flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all disabled:opacity-50"
            >
              {pulling ? (
                <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <Zap className="w-4 h-4 fill-slate-950" />
              )}
              <span>⚡ Micro-Pull (+{vault.pullAmount || 25} KWD)</span>
            </button>

            {/* Button: Stripe Checkout Deposit Flow */}
            <button
              onClick={() => handleStripeCheckout(20)}
              disabled={isDepositingStripe}
              className="tactile-btn flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isDepositingStripe ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 text-white" />
              )}
              <span>💳 Deposit (+20 KWD Stripe)</span>
            </button>

            {/* Link: Open Keyholder Screen */}
            <Link
              href={keyholderUrl}
              target="_blank"
              className="tactile-btn flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 hover:border-slate-600 transition-all shadow-sm"
            >
              <span>Keyholder Screen</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            </Link>

            {/* Reset status if unlocked or pending */}
            {vault.status !== "LOCKED" && (
              <button
                onClick={handleResetLock}
                title="Reset vault back to LOCKED"
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Relock</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hero Vault Card & GCC Pacing (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* HERO VAULT CARD */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden shadow-2xl">
            {/* Top Vault Info & Status Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {vault.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2 mt-1 font-mono text-xs text-slate-400">
                  <span>Cadence: {vault.cadence.toUpperCase()}</span>
                  <span>&bull;</span>
                  <span>Pull: {vault.pullAmount} KWD</span>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border shadow-sm ${
                  vault.status === "LOCKED"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : vault.status === "UNLOCK_PENDING"
                    ? "bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/40"
                }`}
              >
                {vault.status === "LOCKED" ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>LOCKED 🔒</span>
                  </>
                ) : vault.status === "UNLOCK_PENDING" ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>UNLOCK PENDING ⚠️</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>UNLOCKED 🔓</span>
                  </>
                )}
              </div>
            </div>

            {/* Central Progress Ring */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
              <div className="relative w-56 h-56 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 220 220">
                  {/* Background Circle */}
                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    stroke="#1E293B"
                    strokeWidth="16"
                    fill="transparent"
                  />
                  {/* Animated Progress Circle */}
                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    stroke={
                      vault.status === "UNLOCK_PENDING"
                        ? "#F43F5E"
                        : vault.status === "UNLOCKED"
                        ? "#34D399"
                        : "#F59E0B"
                    }
                    strokeWidth="16"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                {/* Inner Ring Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                    {percentFunded}%
                  </span>
                  <span className="text-[11px] font-mono uppercase text-slate-400 mt-0.5">
                    Funded
                  </span>
                  <div className="mt-2 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    {formatKWD(current)} KWD
                  </div>
                </div>
              </div>

              {/* Metrics Column */}
              <div className="space-y-4 w-full sm:w-auto">
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] uppercase font-mono text-slate-400 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Target Balance</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {formatKWD(target)} KWD
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    {formatKWD(Math.max(0, target - current))} KWD remaining
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] uppercase font-mono text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Time Lock Target</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-200 mt-1 font-mono">
                    {new Date(vault.targetDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-0.5 font-mono">
                    Locked against impulse spending
                  </div>
                </div>
              </div>
            </div>

            {/* Social Keyholder Banner */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>Keyholder: {vault.keyholder.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-normal">
                      {vault.keyholder.relationship}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {vault.keyholder.phone} &bull; Must approve early withdrawal via single-use link
                  </div>
                </div>
              </div>

              {/* Action to trigger break or view link */}
              {vault.status === "LOCKED" ? (
                <button
                  id="request-break-btn"
                  data-testid="request-break-btn"
                  onClick={() => setShowBreakModal(true)}
                  className="tactile-btn w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Request Early Break</span>
                </button>
              ) : vault.status === "UNLOCK_PENDING" ? (
                <Link
                  href={keyholderUrl}
                  target="_blank"
                  className="tactile-btn w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 hover:bg-rose-400 transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Review Break Request ↗</span>
                </Link>
              ) : (
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  Funds Unlocked ✅
                </span>
              )}
            </div>
          </div>

          {/* GCC ALLOWANCE PACING TIMELINE */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  GCC Day-{vault.allowanceDay} Allowance Micro-Pacing
                </h3>
              </div>
              <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Automated Friction
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Tijori syncs with your monthly allowance cycle (I&apos;ana / salary deposit). Micro-pulls automatically surge when you are flush with liquidity, then taper off during the final days before your next deposit to prevent overdraft anxiety.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30">
                <div className="text-[10px] text-amber-400 uppercase">Week 1 (Day 25-1)</div>
                <div className="text-sm font-bold text-white mt-1">Post-Salary 🚀</div>
                <div className="text-[11px] text-amber-400 mt-1 font-bold">+40 KWD Pull</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Week 2 (Day 2-8)</div>
                <div className="text-sm font-bold text-white mt-1">Steady Cadence ⚡</div>
                <div className="text-[11px] text-slate-300 mt-1 font-bold">+25 KWD Pull</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Week 3 (Day 9-16)</div>
                <div className="text-sm font-bold text-white mt-1">Mid-Month 🛡️</div>
                <div className="text-[11px] text-slate-300 mt-1 font-bold">+15 KWD Pull</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Week 4 (Day 17-24)</div>
                <div className="text-sm font-bold text-white mt-1">Pre-Salary 🌱</div>
                <div className="text-[11px] text-slate-300 mt-1 font-bold">+10 KWD Pull</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Ledger Sidebar & Activity Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Savings Ledger</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {vault.transactions?.length || 0} Events
              </span>
            </div>

            {/* Transactions Feed */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
              {vault.transactions && vault.transactions.length > 0 ? (
                vault.transactions.map((tx, idx) => (
                  <div
                    key={tx._id || idx}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.type === "WITHDRAWAL"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            : tx.type === "SIMULATED_PULL"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {tx.type === "WITHDRAWAL" ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : tx.type === "SIMULATED_PULL" ? (
                          <Zap className="w-4 h-4" />
                        ) : (
                          <Coins className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">
                          {tx.note ||
                            (tx.type === "SIMULATED_PULL"
                              ? "Micro-Pull Increment"
                              : tx.type === "SCHEDULED_PULL"
                              ? "Scheduled Recurring Pull"
                              : "Withdrawal")}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div
                        className={`font-bold ${
                          tx.type === "WITHDRAWAL" ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {tx.type === "WITHDRAWAL" ? "-" : "+"}
                        {formatKWD(tx.amount)} KWD
                      </div>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No transactions recorded yet.
                </div>
              )}
            </div>

            {/* Quick Deposit Actions in Ledger */}
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-mono text-slate-400 uppercase">
                Instant Micro-Deposits
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStripeCheckout(10)}
                  disabled={isDepositingStripe}
                  className="tactile-btn py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>+10 KWD Stripe</span>
                </button>
                <button
                  onClick={() => handleStripeCheckout(20)}
                  disabled={isDepositingStripe}
                  className="tactile-btn py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>+20 KWD Stripe</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. EMERGENCY BREAK MODAL (Social Friction, WhatsApp Share, Discipline Tax & Gemini AI Roast) */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="max-w-lg w-full glass-panel-danger rounded-3xl p-6 sm:p-7 border border-rose-500/40 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowBreakModal(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Emergency Vault Break</h3>
                <p className="text-xs text-rose-300">
                  Keyholder Protocol Intervention Required
                </p>
              </div>
            </div>

            {!requestSent ? (
              <form onSubmit={handleSubmitBreakRequest} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Breaking this vault will withdraw your <strong>{formatKWD(vault.currentBalance)} KWD</strong> savings. Because you agreed to social friction, your Keyholder (<strong>{vault.keyholder.name}</strong>) must review and approve your reason before funds unlock.
                </p>

                {/* DISCIPLINE TAX WARNING */}
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 shadow-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-100 mb-0.5">⚠️ Discipline Tax Warning:</span>
                    <span className="leading-snug block">
                      Early withdrawal incurs a 5% forfeit fee unless approved by your Keyholder.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1.5">
                    What is your reason for wanting to break the vault early?
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={excuseText}
                    onChange={(e) => setExcuseText(e.target.value)}
                    placeholder="e.g. Flash sale at Al-Hamra, unexpected chalet split..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Gemini 2.5 Flash will test the validity of this reason before generating the token link.</span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBreakModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                  >
                    Keep Vault Locked 🛡️
                  </button>
                  <button
                    type="submit"
                    disabled={generatingRoast}
                    className="tactile-btn flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generatingRoast ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Generate Single-Use Link 🚨</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Tijori AI Reality Check:</span>
                  </div>
                  <p className="text-xs text-amber-200/90 italic leading-relaxed">
                    &ldquo;{aiRoast}&rdquo;
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>Single-Use Keyholder Token Generated!</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Status set to <strong>UNLOCK PENDING ⚠️</strong>. Send this single-use link to <strong>{vault.keyholder.name}</strong> to make their decision:
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300 break-all select-all">
                    {generatedUnlockUrl ||
                      (typeof window !== "undefined"
                        ? `${window.location.origin}/unlock/${vault.unlockToken || vault._id}`
                        : "")}
                  </div>
                </div>

                {/* WHATSAPP SHARE BUTTON */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Bro, I'm trying to break my Tijori savings vault for ${vault.title}. My excuse: ${excuseText}. Approve or block me here: ${
                      generatedUnlockUrl ||
                      (typeof window !== "undefined"
                        ? `${window.location.origin}/unlock/${vault.unlockToken || vault._id}`
                        : "")
                    }`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tactile-btn w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/15 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4 text-slate-950" />
                  <span>Share via WhatsApp 💬</span>
                </a>

                <div className="flex items-center gap-3">
                  <Link
                    href={
                      vault.unlockToken
                        ? `/unlock/${vault.unlockToken}`
                        : `/unlock/${vault._id}`
                    }
                    target="_blank"
                    className="tactile-btn flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center border border-slate-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Open Token Link Directly ↗</span>
                  </Link>
                  <button
                    onClick={() => setShowBreakModal(false)}
                    className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
