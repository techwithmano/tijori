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
  X,
  Share2,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Flame,
  CreditCard,
  ArrowRight,
  Copy,
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
  const [excuseText, setExcuseText] = useState("");
  const [submittingBreak, setSubmittingBreak] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [generatedUnlockUrl, setGeneratedUnlockUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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

  // 2. Stripe Checkout Deposit Flow
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

  // 3. Emergency Break Request with Keyholder Protocol (Human social accountability)
  const handleSubmitBreakRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vault) return;

    setSubmittingBreak(true);

    try {
      const unlockRes = await fetch(`/api/vault/${vault._id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST",
          reason: excuseText || "Impulse purchase request",
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
      setSubmittingBreak(false);
    }
  };

  // Reset vault to LOCKED
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
        setShowBreakModal(false);
        setGeneratedUnlockUrl(null);
        setExcuseText("");
      }
    } catch (err) {
      console.error("Lock error:", err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
        <p className="mt-4 text-xs font-mono text-slate-500">
          Loading Tijori Anti-Impulse Protocol...
        </p>
      </div>
    );
  }

  // If no vault created yet
  if (!vault) {
    return (
      <div className="max-w-xl mx-auto my-16 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5 shadow-xs">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            No Active Vault Found
          </h2>
          <p className="text-sm text-slate-600 mt-2 mb-8 leading-relaxed max-w-md mx-auto">
            You don&apos;t have an active savings vault yet. Create your first vault, set your target amount, and appoint your trusted Keyholder.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Your First Vault</span>
          </Link>
        </div>
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

  const keyholderUrl = vault.unlockToken
    ? `/unlock/${vault.unlockToken}`
    : `/unlock/${vault._id}`;

  const currentOrTotalProtected =
    (vault.totalProtected && vault.totalProtected > 0)
      ? vault.totalProtected
      : current;

  return (
    <div className="space-y-6 pb-12">
      {/* SUCCESS NOTIFICATION */}
      {stripeSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 shadow-card animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block">Stripe Test Deposit Confirmed!</span>
              <span>{stripeSuccessMsg}</span>
            </div>
          </div>
          <button
            onClick={() => setStripeSuccessMsg(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. IMPULSE SAVINGS STAT BADGE */}
      <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-3.5 sm:p-4 shadow-card flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span>🛡️ You&apos;ve protected</span>
              <span className="text-emerald-700 font-mono text-base sm:text-lg font-bold">
                {formatKWD(currentOrTotalProtected)} KWD
              </span>
              <span>from impulse spending.</span>
            </div>
            <p className="text-[11px] text-slate-600 font-mono">
              Behavioral friction layer actively shielding funds from spontaneous retail traps.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs font-mono font-medium shadow-xs">
          <span>Discipline Score: 98%</span>
        </div>
      </div>

      {/* 2. REFINED ACTION BAR */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-card">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900">
                Quick Vault Actions
              </span>
              <p className="text-[11px] text-slate-500 font-mono">
                Execute micro-pull or add instant card deposit
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Button: Simulate Micro-Pull */}
            <button
              id="simulate-pull-btn"
              onClick={() => handleSimulatePull()}
              disabled={pulling}
              className="tactile-btn flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {pulling ? (
                <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <Zap className="w-4 h-4 fill-slate-950" />
              )}
              <span>⚡ Micro-Pull (+{vault.pullAmount || 25} KWD)</span>
            </button>

            {/* Button: Stripe Deposit */}
            <button
              onClick={() => handleStripeCheckout(20)}
              disabled={isDepositingStripe}
              className="tactile-btn flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-50"
            >
              {isDepositingStripe ? (
                <div className="w-4 h-4 border-2 border-emerald-800/30 border-t-emerald-800 rounded-full animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 text-emerald-700" />
              )}
              <span>💳 Deposit (+20 KWD)</span>
            </button>

            {/* Link: Open Keyholder Screen */}
            <Link
              href={keyholderUrl}
              target="_blank"
              className="tactile-btn inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 hover:border-slate-300 transition-all shadow-xs"
            >
              <span>Keyholder Screen</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
            </Link>

            {/* Reset status if unlocked or pending */}
            {vault.status !== "LOCKED" && (
              <button
                onClick={handleResetLock}
                title="Reset vault back to LOCKED"
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all text-xs flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Relock</span>
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
          <div className="glass-panel rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/90 shadow-card hover:border-amber-400/40 transition-all duration-300 relative overflow-hidden">
            {/* Top Vault Info & Status Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {vault.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2 mt-1 font-mono text-xs text-slate-500">
                  <span>Cadence: {vault.cadence.toUpperCase()}</span>
                  <span>&bull;</span>
                  <span>Pull: {vault.pullAmount} KWD</span>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border shadow-xs ${
                  vault.status === "LOCKED"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : vault.status === "UNLOCK_PENDING"
                    ? "bg-rose-50 text-rose-800 border-rose-200 animate-pulse"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {vault.status === "LOCKED" ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>LOCKED 🔒</span>
                  </>
                ) : vault.status === "UNLOCK_PENDING" ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
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
              <div className="relative w-60 h-60 flex items-center justify-center shrink-0">
                <svg
                  className="w-full h-full -rotate-90 transform transition-all duration-700"
                  viewBox="0 0 220 220"
                  style={{
                    filter:
                      vault.status === "UNLOCK_PENDING"
                        ? "drop-shadow(0 4px 14px rgba(225, 29, 72, 0.25))"
                        : "drop-shadow(0 4px 14px rgba(217, 119, 6, 0.2))",
                  }}
                >
                  <defs>
                    <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="60%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>

                    <linearGradient id="dangerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FB7185" />
                      <stop offset="100%" stopColor="#E11D48" />
                    </linearGradient>
                  </defs>

                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    stroke="#E2E8F0"
                    strokeWidth="15"
                    fill="transparent"
                  />

                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    stroke={
                      vault.status === "UNLOCK_PENDING"
                        ? "url(#dangerGrad)"
                        : "url(#progressGrad)"
                    }
                    strokeWidth="15"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                {/* Inner Ring Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="relative group cursor-pointer mb-1">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-md ${
                        vault.status === "LOCKED"
                          ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/20"
                          : vault.status === "UNLOCK_PENDING"
                          ? "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-500/25 animate-bounce"
                          : "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-500/20"
                      }`}
                    >
                      {vault.status === "LOCKED" ? (
                        <Lock className="w-4 h-4 stroke-[2.5]" />
                      ) : vault.status === "UNLOCK_PENDING" ? (
                        <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <Unlock className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>
                  </div>

                  <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                    {percentFunded}%
                  </span>
                  <span className="text-[10px] font-mono uppercase text-slate-500 mt-0.5 tracking-wider font-semibold">
                    {vault.status === "LOCKED" ? "Vault Locked" : vault.status}
                  </span>
                  <div className="mt-1.5 text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shadow-xs">
                    {formatKWD(current)} KWD
                  </div>
                </div>
              </div>

              {/* Metrics Column */}
              <div className="space-y-4 w-full sm:w-auto">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
                  <div className="text-[11px] uppercase font-mono text-slate-500 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    <span>Target Balance</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {formatKWD(target)} KWD
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    {formatKWD(Math.max(0, target - current))} KWD remaining
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
                  <div className="text-[11px] uppercase font-mono text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Time Lock Target</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-800 mt-1 font-mono">
                    {new Date(vault.targetDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5 font-mono font-medium">
                    Locked against impulse spending
                  </div>
                </div>
              </div>
            </div>

            {/* Social Keyholder Banner */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>Keyholder: {vault.keyholder.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-medium">
                      {vault.keyholder.relationship}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
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
                  className="tactile-btn w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Request Early Break</span>
                </button>
              ) : vault.status === "UNLOCK_PENDING" ? (
                <Link
                  href={keyholderUrl}
                  target="_blank"
                  className="tactile-btn w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-600/20 hover:bg-rose-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Review Break Request ↗</span>
                </Link>
              ) : (
                <span className="text-xs font-bold text-emerald-700 font-mono">
                  Funds Unlocked ✅
                </span>
              )}
            </div>
          </div>

          {/* GCC ALLOWANCE PACING TIMELINE */}
          <div className="glass-panel rounded-3xl p-6 bg-white border border-slate-200/90 shadow-card hover:border-amber-400/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  GCC Day-{vault.allowanceDay} Allowance Micro-Pacing
                </h3>
              </div>
              <span className="text-[11px] font-mono text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 font-medium">
                Automated Friction
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Tijori syncs with your monthly allowance cycle (I&apos;ana / salary deposit). Micro-pulls automatically surge when liquidity is high, then taper off toward month-end to keep you liquid without overdraft pressure.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 shadow-xs">
                <div className="text-[10px] text-amber-800 uppercase font-semibold">Week 1 (Day 25-1)</div>
                <div className="text-sm font-bold text-slate-900 mt-1">Post-Salary 🚀</div>
                <div className="text-[11px] text-amber-700 mt-1 font-bold">+40 KWD Pull</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Week 2 (Day 2-8)</div>
                <div className="text-sm font-bold text-slate-900 mt-1">Steady Cadence ⚡</div>
                <div className="text-[11px] text-slate-600 mt-1 font-bold">+25 KWD Pull</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Week 3 (Day 9-16)</div>
                <div className="text-sm font-bold text-slate-900 mt-1">Mid-Month 🛡️</div>
                <div className="text-[11px] text-slate-600 mt-1 font-bold">+15 KWD Pull</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Week 4 (Day 17-24)</div>
                <div className="text-sm font-bold text-slate-900 mt-1">Pre-Salary 🌱</div>
                <div className="text-[11px] text-slate-600 mt-1 font-bold">+10 KWD Pull</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Ledger Sidebar & Activity Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-3xl p-6 bg-white border border-slate-200/90 shadow-card flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Savings Ledger</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {vault.transactions?.length || 0} Events
              </span>
            </div>

            {/* Transactions Feed */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
              {vault.transactions && vault.transactions.length > 0 ? (
                vault.transactions.map((tx, idx) => (
                  <div
                    key={tx._id || idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.type === "WITHDRAWAL"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : tx.type === "SIMULATED_PULL"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
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
                        <div className="font-semibold text-slate-900">
                          {tx.note ||
                            (tx.type === "SIMULATED_PULL"
                              ? "Micro-Pull Increment"
                              : tx.type === "SCHEDULED_PULL"
                              ? "Scheduled Recurring Pull"
                              : "Withdrawal")}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
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
                          tx.type === "WITHDRAWAL" ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {tx.type === "WITHDRAWAL" ? "-" : "+"}
                        {formatKWD(tx.amount)} KWD
                      </div>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No transactions recorded yet.
                </div>
              )}
            </div>

            {/* Quick Deposit Actions in Ledger */}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
              <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">
                Instant Micro-Deposits
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStripeCheckout(10)}
                  disabled={isDepositingStripe}
                  className="tactile-btn py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                  <span>+10 KWD</span>
                </button>
                <button
                  onClick={() => handleStripeCheckout(20)}
                  disabled={isDepositingStripe}
                  className="tactile-btn py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                  <span>+20 KWD</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. EMERGENCY BREAK MODAL (Social Friction & Single-Use Keyholder Token Link) */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-7 border border-rose-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowBreakModal(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Emergency Vault Break</h3>
                <p className="text-xs text-rose-600 font-medium">
                  Keyholder Protocol Intervention Required
                </p>
              </div>
            </div>

            {!requestSent ? (
              <form onSubmit={handleSubmitBreakRequest} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Breaking this vault will withdraw your <strong>{formatKWD(vault.currentBalance)} KWD</strong> savings. Because you agreed to social friction, your Keyholder (<strong>{vault.keyholder.name}</strong>) must review and approve your reason before funds unlock.
                </p>

                {/* DISCIPLINE TAX WARNING */}
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 shadow-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-950 mb-0.5">⚠️ Discipline Tax Warning:</span>
                    <span className="leading-snug block text-rose-800">
                      Early withdrawal incurs a 5% forfeit fee unless approved by your Keyholder.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    What is your reason for wanting to break the vault early?
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={excuseText}
                    onChange={(e) => setExcuseText(e.target.value)}
                    placeholder="e.g. Flash sale at 360 Mall, unplanned repair, urgent travel..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBreakModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    Keep Vault Locked 🛡️
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBreak}
                    className="tactile-btn flex-1 py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submittingBreak ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Generate Single-Use Link 🚨</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-600 font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>Single-Use Keyholder Token Generated!</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Status set to <strong>UNLOCK PENDING ⚠️</strong>. Send this single-use link to <strong>{vault.keyholder.name}</strong> to make their decision:
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-[11px] text-amber-800 break-all select-all shadow-xs flex-1">
                      {generatedUnlockUrl ||
                        (typeof window !== "undefined"
                          ? `${window.location.origin}/unlock/${vault.unlockToken || vault._id}`
                          : "")}
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          generatedUnlockUrl ||
                            `${window.location.origin}/unlock/${vault.unlockToken || vault._id}`
                        )
                      }
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors shrink-0"
                      title="Copy link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copiedLink && (
                    <span className="text-[10px] text-emerald-600 font-mono block">
                      ✓ Copied to clipboard
                    </span>
                  )}
                </div>

                {/* WHATSAPP SHARE BUTTON */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Bro, I'm trying to break my Tijori savings vault for "${vault.title}". My reason: "${excuseText}". Approve or block my withdrawal here: ${
                      generatedUnlockUrl ||
                      (typeof window !== "undefined"
                        ? `${window.location.origin}/unlock/${vault.unlockToken || vault._id}`
                        : "")
                    }`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tactile-btn w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/15 transition-all flex items-center justify-center gap-2"
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
                    className="tactile-btn flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs text-center border border-slate-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Open Token Link Directly ↗</span>
                  </Link>
                  <button
                    onClick={() => setShowBreakModal(false)}
                    className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold"
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
