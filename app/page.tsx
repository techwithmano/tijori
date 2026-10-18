"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Lock,
  Shield,
  Zap,
  ArrowRight,
  TrendingUp,
  Coins,
  CheckCircle2,
  Sparkles,
  Flame,
  Clock,
  ShieldAlert,
  Share2,
} from "lucide-react";
import { formatKWD } from "@/lib/utils";
import GoalTitle from "@/components/GoalTitle";

export default function LandingPage() {
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);

  // Interactive Simulator State
  const [allowance, setAllowance] = useState(750);
  const [savingsRate, setSavingsRate] = useState(15);
  const [durationMonths, setDurationMonths] = useState(6);

  // Live Calculations
  const monthlyTuck = Math.round((allowance * savingsRate) / 100);
  const totalProjected = monthlyTuck * durationMonths;
  const impulsesAvoided = Math.max(3, Math.round(totalProjected / 20));

  const handleLaunchDemo = async () => {
    try {
      setSeeding(true);
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.3 },
          colors: ["#F59E0B", "#10B981", "#3B82F6", "#FFFFFF"],
        });
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/dashboard");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-amber-100 selection:text-amber-900">
      {/* Top Navigation */}
      <header className="border-b border-slate-200/90 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
              <Lock className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
                  Tijori
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold font-mono">
                  تِجوري
                </span>
              </div>
              <p className="text-xs text-slate-500 -mt-0.5">
                GCC Anti-Impulse Micro-Savings
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>

            <button
              onClick={handleLaunchDemo}
              disabled={seeding}
              className="tactile-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {seeding ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
              )}
              <span>Launch Live Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Proposition */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                Stop blowing your savings on{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-rose-600">
                  temporary urges.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Tijori (تِجوري) automatically locks micro-savings aligned with your monthly student allowance or salary deposit. Protected by genuine social friction with your trusted Keyholder.
              </p>

              {/* Dual Action CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  id="launch-demo-btn"
                  onClick={handleLaunchDemo}
                  disabled={seeding}
                  className="tactile-btn w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all disabled:opacity-50"
                >
                  {seeding ? (
                    <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 fill-slate-950" />
                  )}
                  <span>⚡ Launch Live Demo (1-Click)</span>
                </button>

                <Link
                  href="/login?tab=register"
                  className="tactile-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-card transition-all"
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>

            {/* Right Column: Physical Vault Dial Teaser */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800">
                      Auto-Save Active &bull; Locked 🔒
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    🔥 18-Day Streak
                  </span>
                </div>

                <div className="text-center mb-6">
                  <span className="text-xs uppercase font-mono text-slate-500 font-semibold tracking-wider">
                    Target Goal
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                    <GoalTitle title="Japan Summer Trip 🇯🇵" />
                  </h3>
                </div>

                {/* Circular Gauge Graphic */}
                <div className="relative w-52 h-52 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      stroke="#E2E8F0"
                      strokeWidth="14"
                      fill="transparent"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      stroke="url(#dialGrad)"
                      strokeWidth="14"
                      strokeDasharray="502.65"
                      strokeDashoffset="376.99"
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="dialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 mb-1">
                      <Lock className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span className="text-2xl font-extrabold text-slate-900 font-mono">
                      25%
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 mt-1">
                      125 / 500 KWD
                    </span>
                  </div>
                </div>

                {/* Keyholder Status Card */}
                <div className="mt-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Keyholder: Fahad Al-Mutawa</div>
                      <div className="text-xs text-slate-500">Brother &bull; Guarded by Fahad 🛡️</div>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-medium">
                    Guarded
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Micro-Savings Simulator */}
      <section className="py-16 bg-white border-y border-slate-200/90">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Interactive Allowance Pacing</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Calculate Your Anti-Impulse Projection
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
              See how minor weekly micro-pulls protect you from late-night impulse shopping.
            </p>
          </div>

          <div className="bg-[#F8FAFC] rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Slider 1: Allowance */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Monthly Allowance / Salary:</span>
                  <span className="font-mono text-amber-800 font-bold">{allowance} KWD</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="50"
                  value={allowance}
                  onChange={(e) => setAllowance(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 font-mono block">Day-25 Deposit Basis</span>
              </div>

              {/* Slider 2: Micro-Pull Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Micro-Pull Rate:</span>
                  <span className="font-mono text-emerald-800 font-bold">{savingsRate}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="35"
                  step="5"
                  value={savingsRate}
                  onChange={(e) => setSavingsRate(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 font-mono block">+{monthlyTuck} KWD / Month Protected</span>
              </div>

              {/* Slider 3: Duration */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Time Lock Horizon:</span>
                  <span className="font-mono text-slate-900 font-bold">{durationMonths} Months</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="1"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full accent-slate-800 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 font-mono block">Discipline Lock Cycle</span>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Total Protected Savings</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono mt-1">
                  +{formatKWD(totalProjected)} KWD
                </div>
                <span className="text-xs text-slate-500 font-medium">Locked in Tijori Vault</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-medium">Estimated Impulse Traps Avoided</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-mono mt-1">
                  {impulsesAvoided} Purchases
                </div>
                <span className="text-xs text-slate-500 font-medium">Based on ~20 KWD impulse price</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-medium">Equivalent Lifestyle Goal</div>
                <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {totalProjected >= 800
                    ? "💻 MacBook M3 Max"
                    : totalProjected >= 450
                    ? "🇯🇵 Tokyo Flight & Stay"
                    : totalProjected >= 200
                    ? "👟 Grail Designer Sneakers"
                    : "☕ 50+ Specialty Brews Saved"}
                </div>
                <span className="text-xs text-slate-500 font-medium">Earned Through Pure Discipline</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Anti-Impulse Pillars */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Why Traditional Banking Fails GCC Youth
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Modern banking makes spending frictionless. Tijori introduces behavioral roadblocks where you need them most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Allowance Day-25 Surge</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Captures a larger micro-tuck immediately after university I&apos;ana or salary hits your bank account on day 25, tapering off during month-end lean days.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Keyholder Social Friction</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Appoint a real friend or sibling as your Keyholder. Any early withdrawal attempt requires their single-use WhatsApp clearance. No secret impulse breaks.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">5% Discipline Tax Warning</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A behavioral commitment fee and Google Gemini AI reality-check intervention roast that challenges impulse shopping before a penny is unlocked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">Tijori (تِجوري)</span>
            <span>&bull;</span>
            <span>GCC Anti-Impulse Micro-Savings</span>
          </div>
          <div className="text-slate-400">
            &copy; 2026 Tijori. Behavioral savings for GCC young adults.
          </div>
        </div>
      </footer>
    </div>
  );
}
