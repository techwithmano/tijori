"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  ArrowLeft,
  Shield,
  Calendar,
  Coins,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export default function CreateVaultPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState<number | "">(500);
  const [pullAmount, setPullAmount] = useState<number | "">(25);
  const [cadence, setCadence] = useState<"daily" | "weekly" | "biweekly" | "monthly">("weekly");
  const [allowanceDay, setAllowanceDay] = useState(25);
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split("T")[0];
  });

  const [keyholderName, setKeyholderName] = useState("");
  const [keyholderPhone, setKeyholderPhone] = useState("");
  const [keyholderRelationship, setKeyholderRelationship] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Mathematical Savings Projection
  const numTarget = typeof targetAmount === "number" ? targetAmount : 0;
  const numPull = typeof pullAmount === "number" ? pullAmount : 0;
  const totalPullsNeeded = numPull > 0 ? Math.ceil(numTarget / numPull) : 0;

  // Smart 4-Week Cycle Distribution
  const week1Pull = Math.round(numPull * 1.5);
  const week2Pull = numPull;
  const week3Pull = numPull;
  const week4Pull = Math.max(5, Math.round(numPull * 0.4));

  // Interactive AI Allowance Pacing Preview
  const [aiSchedule, setAiSchedule] = useState<{
    week: number;
    label: string;
    amount: number;
    phase: string;
    rationale: string;
  }[] | null>(null);
  const [loadingAiPacing, setLoadingAiPacing] = useState(false);

  const fetchAiPacing = async () => {
    try {
      setLoadingAiPacing(true);
      const res = await fetch("/api/ai/pacing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAmount: Number(targetAmount) || 500,
          pullAmount: Number(pullAmount) || 25,
          allowanceDay: Number(allowanceDay) || 25,
        }),
      });
      const data = await res.json();
      if (data.success && data.schedule) {
        setAiSchedule(data.schedule);
      }
    } catch (err) {
      console.warn("AI pacing fetch error:", err);
    } finally {
      setLoadingAiPacing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!title.trim()) {
      setError("Please enter a goal title for your vault");
      setIsSubmitting(false);
      return;
    }

    if (!keyholderName.trim() || !keyholderPhone.trim()) {
      setError("Please designate your Keyholder name and phone number");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          targetAmount: Number(targetAmount) || 500,
          pullAmount: Number(pullAmount) || 25,
          cadence,
          allowanceDay: Number(allowanceDay) || 25,
          targetDate,
          keyholder: {
            name: keyholderName,
            phone: keyholderPhone,
            relationship: keyholderRelationship || "Keyholder Guardian",
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
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
    <div className="max-w-2xl mx-auto py-6 pb-16">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-xs">
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Create New Micro-Savings Vault
            </h1>
            <p className="text-xs text-slate-600">
              Set your target, calibrate allowance pacing, and designate your Keyholder guardian.
            </p>
          </div>
        </div>
      </div>

      {/* QUICK-PICK GOAL CHIPS (OPTIONAL INSPIRATION) */}
      <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-card">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-amber-800 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Quick-Pick Inspiration</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono font-medium">1-Click Auto-Fill</span>
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
                className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between min-h-[58px] ${
                  isSelected
                    ? "bg-amber-50 border-amber-300 text-amber-950 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200/90 text-slate-700"
                }`}
              >
                <span className="font-semibold truncate">{preset.label}</span>
                <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                  {preset.target} KWD &bull; {preset.pull}/wk
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Vault Basics */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-200/90 bg-white shadow-card space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-3">
            <Coins className="w-4 h-4 text-amber-600" />
            <span>1. Vault Target & Recurrence</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Savings Goal Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Japan Summer Trip, New Laptop, Emergency Fund"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Target Amount (KWD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="10000"
                  required
                  value={targetAmount}
                  onChange={(e) =>
                    setTargetAmount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="500"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors font-mono"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-mono">
                  KWD
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Micro-Pull Amount (KWD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="500"
                  required
                  value={pullAmount}
                  onChange={(e) =>
                    setPullAmount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="25"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors font-mono"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-mono">
                  KWD
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Recurrence Cadence
              </label>
              <select
                value={cadence}
                onChange={(e: any) => setCadence(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
              >
                <option value="daily">Daily Micro-Pull</option>
                <option value="weekly">Weekly Pull (Recommended)</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="monthly">Monthly Cycle</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                GCC Salary / I&apos;ana Day
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={allowanceDay}
                onChange={(e) => setAllowanceDay(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Lock Release Target Date
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Interactive AI Pacing Preview */}
        {(() => {
          const currentWeek1 = aiSchedule ? aiSchedule[0]?.amount : week1Pull;
          const currentWeek2 = aiSchedule ? aiSchedule[1]?.amount : week2Pull;
          const currentWeek3 = aiSchedule ? aiSchedule[2]?.amount : week3Pull;
          const currentWeek4 = aiSchedule ? aiSchedule[3]?.amount : week4Pull;

          const maxPullVal = Math.max(currentWeek1, currentWeek2, currentWeek3, currentWeek4, 1);
          const getBarH = (amt: number) => Math.max(20, Math.min(84, Math.round((amt / maxPullVal) * 84)));

          const h1 = getBarH(currentWeek1);
          const h2 = getBarH(currentWeek2);
          const h3 = getBarH(currentWeek3);
          const h4 = getBarH(currentWeek4);

          return (
            <div className="glass-panel rounded-2xl p-5 border border-slate-200/90 bg-white shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Interactive AI Allowance Pacing Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchAiPacing}
                    disabled={loadingAiPacing}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-semibold transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>{loadingAiPacing ? "Calibrating..." : "AI Calibrate"}</span>
                  </button>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-semibold">
                    {totalPullsNeeded} Pulls
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Based on your monthly salary day ({allowanceDay}th), micro-pulls automatically surge when you have liquidity, then taper down during lean days:
              </p>

              {/* SVG Pacing Bar Chart */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-full max-w-md mx-auto">
                  <svg
                    viewBox="0 0 380 145"
                    className="w-full h-auto overflow-visible select-none"
                    style={{ maxHeight: "160px" }}
                  >
                    <defs>
                      <linearGradient id="surgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="amberGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#D97706" />
                      </linearGradient>
                      <linearGradient id="slateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#94A3B8" />
                        <stop offset="100%" stopColor="#64748B" />
                      </linearGradient>
                    </defs>

                    {/* Base guideline */}
                    <line x1="20" y1="108" x2="360" y2="108" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />

                    {/* BAR 1: Week 1 */}
                    <g>
                      <rect x="35" y={108 - h1} width="54" height={h1} rx="8" fill="url(#surgeGrad)" />
                      <text x="62" y={108 - h1 - 6} textAnchor="middle" fill="#059669" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        +{currentWeek1} KWD
                      </text>
                      <text x="62" y="122" textAnchor="middle" fill="#0F172A" fontSize="10" fontWeight="bold">
                        Week 1
                      </text>
                      <text x="62" y="134" textAnchor="middle" fill="#059669" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        Surge 🚀
                      </text>
                    </g>

                    {/* BAR 2: Week 2 */}
                    <g>
                      <rect x="120" y={108 - h2} width="54" height={h2} rx="8" fill="url(#amberGrad)" />
                      <text x="147" y={108 - h2 - 6} textAnchor="middle" fill="#D97706" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        +{currentWeek2} KWD
                      </text>
                      <text x="147" y="122" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="bold">
                        Week 2
                      </text>
                      <text x="147" y="134" textAnchor="middle" fill="#D97706" fontSize="9" fontFamily="monospace">
                        Steady ⚡
                      </text>
                    </g>

                    {/* BAR 3: Week 3 */}
                    <g>
                      <rect x="205" y={108 - h3} width="54" height={h3} rx="8" fill="url(#amberGrad)" />
                      <text x="232" y={108 - h3 - 6} textAnchor="middle" fill="#D97706" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        +{currentWeek3} KWD
                      </text>
                      <text x="232" y="122" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="bold">
                        Week 3
                      </text>
                      <text x="232" y="134" textAnchor="middle" fill="#D97706" fontSize="9" fontFamily="monospace">
                        Steady 🛡️
                      </text>
                    </g>

                    {/* BAR 4: Week 4 */}
                    <g>
                      <rect x="290" y={108 - h4} width="54" height={h4} rx="8" fill="url(#slateGrad)" />
                      <text x="317" y={108 - h4 - 6} textAnchor="middle" fill="#64748B" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        +{currentWeek4} KWD
                      </text>
                      <text x="317" y="122" textAnchor="middle" fill="#64748B" fontSize="10" fontWeight="bold">
                        Week 4
                      </text>
                      <text x="317" y="134" textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="monospace">
                        Lean 🌱
                      </text>
                    </g>
                  </svg>
                </div>

                {aiSchedule && (
                  <div className="mt-3 p-3 rounded-lg bg-white border border-amber-200 text-[11px] text-slate-700 space-y-1">
                    <div className="font-bold text-amber-800 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Gemini AI 4-Week Cashflow Rationale:</span>
                    </div>
                    <p className="italic text-slate-600 leading-relaxed">
                      &ldquo;{aiSchedule[0]?.rationale}&rdquo;
                    </p>
                  </div>
                )}

                <div className="mt-3 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-emerald-800 text-xs font-mono font-medium shadow-xs">
                    🛡️ Shielded against month-end deficit
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Step 2: Keyholder Protocol Setup */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-200/90 bg-white shadow-card space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-3">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>2. Designate Keyholder Guardian (Peer Friction)</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            A trusted friend, sibling, or parent who holds the digital key to approve or deny early withdrawals.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Friend&apos;s Full Name
              </label>
              <input
                type="text"
                required
                value={keyholderName}
                onChange={(e) => setKeyholderName(e.target.value)}
                placeholder="e.g. Khalid Al-Sabah"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Phone Number (WhatsApp)
              </label>
              <input
                type="text"
                required
                value={keyholderPhone}
                onChange={(e) => setKeyholderPhone(e.target.value)}
                placeholder="e.g. +965 9911 2233"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Relationship
              </label>
              <input
                type="text"
                required
                value={keyholderRelationship}
                onChange={(e) => setKeyholderRelationship(e.target.value)}
                placeholder="e.g. Best Friend, Sister"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="tactile-btn w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm tracking-wide shadow-md shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
