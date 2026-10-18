"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  ArrowLeft,
  Sparkles,
  Shield,
  Calendar,
  Coins,
  User,
  Phone,
  HeartHandshake,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { PacingItem } from "@/app/api/ai/pacing/route";

export default function CreateVaultPage() {
  const router = useRouter();

  const [title, setTitle] = useState("Trip to Japan 🇯🇵");
  const [targetAmount, setTargetAmount] = useState(500);
  const [pullAmount, setPullAmount] = useState(25);
  const [cadence, setCadence] = useState<"daily" | "weekly" | "biweekly" | "monthly">("weekly");
  const [allowanceDay, setAllowanceDay] = useState(25);
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split("T")[0];
  });

  const [keyholderName, setKeyholderName] = useState("Fahad Al-Mutawa");
  const [keyholderPhone, setKeyholderPhone] = useState("+965 9988 7766");
  const [keyholderRelationship, setKeyholderRelationship] = useState("Best Friend / Diwaniya Bro");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pacingSchedule, setPacingSchedule] = useState<PacingItem[] | null>(null);
  const [loadingPacing, setLoadingPacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPacingPreview = async () => {
    try {
      setLoadingPacing(true);
      const res = await fetch("/api/ai/pacing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAmount,
          currentBalance: 0,
          pullAmount,
          allowanceDay,
          cadence,
        }),
      });
      const data = await res.json();
      if (data.success && data.schedule) {
        setPacingSchedule(data.schedule);
      }
    } catch (err: any) {
      console.error("Failed to fetch pacing preview", err);
    } finally {
      setLoadingPacing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          targetAmount: Number(targetAmount),
          pullAmount: Number(pullAmount),
          cadence,
          allowanceDay: Number(allowanceDay),
          targetDate,
          keyholder: {
            name: keyholderName,
            phone: keyholderPhone,
            relationship: keyholderRelationship,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/");
      } else {
        setError(data.error || "Failed to create vault");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const GOAL_PRESETS = [
    { label: "🇯🇵 Japan Summer Trip", title: "Japan Summer Trip 🇯🇵", target: 600, pull: 30, cadence: "weekly" as const },
    { label: "💻 M3 Max Studio", title: "M3 Max Studio 💻", target: 850, pull: 45, cadence: "weekly" as const },
    { label: "👟 Sneaker Grail Vault", title: "Sneaker Grail Vault 👟", target: 120, pull: 15, cadence: "weekly" as const },
    { label: "🏎️ Car Downpayment", title: "Car Downpayment 🏎️", target: 1200, pull: 75, cadence: "weekly" as const },
  ];

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Create New Micro-Savings Vault
            </h1>
            <p className="text-xs text-slate-400">
              Set your target, calibrate allowance pacing, and designate your Keyholder guardian.
            </p>
          </div>
        </div>
      </div>

      {/* QUICK-PICK GOAL CHIPS */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick-Pick Goal Chips</span>
          </label>
          <span className="text-[10px] text-slate-400 font-mono">1-Click Auto-Fill</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {GOAL_PRESETS.map((preset) => {
            const isSelected = title === preset.title && targetAmount === preset.target;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setTitle(preset.title);
                  setTargetAmount(preset.target);
                  setPullAmount(preset.pull);
                  setCadence(preset.cadence);
                }}
                className={`tactile-btn p-3 rounded-xl border text-left text-xs transition-all ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/15 ring-1 ring-amber-500/50"
                    : "bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="font-semibold truncate text-[11px] sm:text-xs">{preset.label}</div>
                <div className="text-[11px] font-mono text-amber-400/90 mt-1 font-bold">
                  {preset.target} KWD
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Goal Details */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-slate-800 pb-3">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>1. Savings Target & Micro-Pull</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Goal Name / Dream Purchase
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Trip to Japan 🇯🇵, New MacBook M3"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Total Target Goal (KWD)
              </label>
              <input
                type="number"
                min="10"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Micro-Pull Amount (KWD)
              </label>
              <input
                type="number"
                min="1"
                required
                value={pullAmount}
                onChange={(e) => setPullAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Pull Cadence
              </label>
              <select
                value={cadence}
                onChange={(e: any) => setCadence(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="daily">Daily Micro-Drip</option>
                <option value="weekly">Weekly Automated</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="monthly">Monthly Allocation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Monthly Allowance / Salary Day
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={allowanceDay}
                  onChange={(e) => setAllowanceDay(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-mono">
                  th of month
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Lock Expiry Date
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        {/* VISUAL AI PACING GRAPH WIDGET */}
        <div className="glass-panel-gold rounded-2xl p-5 border border-amber-500/35 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">
                AI Allowance Pacing Engine
              </span>
            </div>
            <button
              type="button"
              onClick={fetchPacingPreview}
              disabled={loadingPacing}
              className="tactile-btn text-xs px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            >
              {loadingPacing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-amber-300/30 border-t-amber-300 rounded-full animate-spin" />
                  <span>Analyzing Cycle...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate AI Pacing Preview ✨</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Tijori analyzes your day-{allowanceDay} allowance inflow and automatically ramps up micro-pulls when cashflow peaks, tapering down during lean days to protect your monthly budget.
          </p>

          {/* SLEEK ANIMATED SVG MINI-BAR CHART */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 mb-4">
            <div className="text-[11px] font-mono uppercase text-slate-400 mb-2 flex items-center justify-between">
              <span>Dynamic 4-Week Cashflow Pacing</span>
              <span className="text-emerald-400">Day {allowanceDay} Synchronized</span>
            </div>

            <div className="w-full h-44 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 380 140">
                <defs>
                  {/* Emerald Gradient for Week 1 Surge */}
                  <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  {/* Amber Gradient for Weeks 2 & 3 Steady */}
                  <linearGradient id="amberGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                  {/* Slate Gradient for Week 4 Lean Days */}
                  <linearGradient id="slateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#64748B" />
                    <stop offset="100%" stopColor="#334155" />
                  </linearGradient>
                </defs>

                {/* Horizontal Baseline */}
                <line x1="20" y1="108" x2="360" y2="108" stroke="#1E293B" strokeWidth="2" strokeDasharray="4 4" />

                {/* BAR 1: Week 1 (Post-Allowance Surge - 40%) */}
                <g className="cursor-pointer group">
                  <rect
                    x="35"
                    y="22"
                    width="54"
                    height="86"
                    rx="8"
                    fill="url(#emeraldGrad)"
                    className="transition-all duration-500 group-hover:brightness-110"
                    style={{ filter: "drop-shadow(0 0 10px rgba(16, 185, 129, 0.4))" }}
                  />
                  <text x="62" y="16" textAnchor="middle" fill="#34D399" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    40%
                  </text>
                  <text x="62" y="122" textAnchor="middle" fill="#E2E8F0" fontSize="10" fontWeight="bold">
                    Week 1
                  </text>
                  <text x="62" y="134" textAnchor="middle" fill="#34D399" fontSize="9" fontFamily="monospace">
                    Surge 🚀
                  </text>
                </g>

                {/* BAR 2: Week 2 (Moderate - 25%) */}
                <g className="cursor-pointer group">
                  <rect
                    x="120"
                    y="52"
                    width="54"
                    height="56"
                    rx="8"
                    fill="url(#amberGrad)"
                    className="transition-all duration-500 group-hover:brightness-110"
                    style={{ filter: "drop-shadow(0 0 8px rgba(245, 158, 11, 0.3))" }}
                  />
                  <text x="147" y="46" textAnchor="middle" fill="#FBBF24" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    25%
                  </text>
                  <text x="147" y="122" textAnchor="middle" fill="#CBD5E1" fontSize="10" fontWeight="bold">
                    Week 2
                  </text>
                  <text x="147" y="134" textAnchor="middle" fill="#F59E0B" fontSize="9" fontFamily="monospace">
                    Steady ⚡
                  </text>
                </g>

                {/* BAR 3: Week 3 (Moderate - 25%) */}
                <g className="cursor-pointer group">
                  <rect
                    x="205"
                    y="52"
                    width="54"
                    height="56"
                    rx="8"
                    fill="url(#amberGrad)"
                    className="transition-all duration-500 group-hover:brightness-110"
                    style={{ filter: "drop-shadow(0 0 8px rgba(245, 158, 11, 0.3))" }}
                  />
                  <text x="232" y="46" textAnchor="middle" fill="#FBBF24" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    25%
                  </text>
                  <text x="232" y="122" textAnchor="middle" fill="#CBD5E1" fontSize="10" fontWeight="bold">
                    Week 3
                  </text>
                  <text x="232" y="134" textAnchor="middle" fill="#F59E0B" fontSize="9" fontFamily="monospace">
                    Steady 🛡️
                  </text>
                </g>

                {/* BAR 4: Week 4 (Lean Days - 10%) */}
                <g className="cursor-pointer group">
                  <rect
                    x="290"
                    y="82"
                    width="54"
                    height="26"
                    rx="8"
                    fill="url(#slateGrad)"
                    className="transition-all duration-500 group-hover:brightness-110"
                  />
                  <text x="317" y="76" textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    10%
                  </text>
                  <text x="317" y="122" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold">
                    Week 4
                  </text>
                  <text x="317" y="134" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">
                    Lean 🌱
                  </text>
                </g>
              </svg>
            </div>

            {/* Week 4 Deficit Shield Badge */}
            <div className="mt-3 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-emerald-400 text-xs font-mono font-medium shadow-sm">
                🛡️ Shielded against month-end deficit
              </span>
            </div>
          </div>

          {/* RATIONALE CARDS */}
          {pacingSchedule && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-amber-500/20">
              {pacingSchedule.map((item) => (
                <div
                  key={item.week}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between font-mono mb-1">
                    <span className="text-slate-400">Week {item.week}</span>
                    <span className="font-bold text-amber-400 font-mono">
                      +{item.amount} KWD
                    </span>
                  </div>
                  <div className="font-semibold text-slate-200">{item.label}</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {item.rationale}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Keyholder Protocol Setup */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-slate-800 pb-3">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>2. Designate Keyholder Guardian (Peer Friction)</span>
          </div>

          <p className="text-xs text-slate-400">
            A trusted friend, sibling, or parent who holds the digital key to approve or deny early withdrawals.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Friend&apos;s Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={keyholderName}
                  onChange={(e) => setKeyholderName(e.target.value)}
                  placeholder="e.g. Fahad Al-Mutawa"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Phone Number (WhatsApp)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={keyholderPhone}
                  onChange={(e) => setKeyholderPhone(e.target.value)}
                  placeholder="+965 9988 7766"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Relationship
              </label>
              <input
                type="text"
                required
                value={keyholderRelationship}
                onChange={(e) => setKeyholderRelationship(e.target.value)}
                placeholder="e.g. Best Friend, Sister"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
          ) : (
            <>
              <Lock className="w-4 h-4 stroke-[2.5]" />
              <span>Lock Vault & Activate Protocol</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
