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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Goal Details */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Pull Cadence
              </label>
              <select
                value={cadence}
                onChange={(e: any) => setCadence(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        {/* AI Pacing Preview Widget */}
        <div className="glass-panel-gold rounded-2xl p-5 border border-amber-500/30">
          <div className="flex items-center justify-between mb-3">
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
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-medium transition-all"
            >
              {loadingPacing ? "Analyzing Cycle..." : "Generate AI Pacing Preview ✨"}
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Tijori analyzes your day-{allowanceDay} allowance inflow and automatically ramps up micro-pulls when you have cash, tapering off during lean days before your next deposit.
          </p>

          {pacingSchedule && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-amber-500/20">
              {pacingSchedule.map((item) => (
                <div
                  key={item.week}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
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
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
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
