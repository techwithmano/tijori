"use client";

import React, { useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Lock,
  Unlock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Sliders,
  Share2,
  Calendar,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Flame,
  LayoutDashboard,
  Clock,
  HeartHandshake,
  MessageCircle,
} from "lucide-react";
import { formatKWD } from "@/lib/utils";

export default function LandingPage() {
  // 1. Interactive Simulator State
  const [monthlyIncome, setMonthlyIncome] = useState(650);
  const [savingsRate, setSavingsRate] = useState(15);
  const [horizonMonths, setHorizonMonths] = useState(6);

  // Calculations
  const monthlySavings = Math.round((monthlyIncome * savingsRate) / 100);
  const projectedTotal = monthlySavings * horizonMonths;
  const impulsesAvoided = Math.max(1, Math.round(projectedTotal / 32));

  // 2. Interactive Keyholder Protocol Demo State
  const [demoStep, setDemoStep] = useState<"locked" | "break_attempt" | "keyholder_review" | "outcome_denied" | "outcome_approved">("locked");
  const [demoExcuse, setDemoExcuse] = useState("Limited sneaker drop at 360 Mall and it ends tonight 👟");

  const handleKeyholderDecision = (action: "DENY" | "APPROVE") => {
    if (action === "DENY") {
      setDemoStep("outcome_denied");
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10B981", "#F59E0B", "#FBBF24", "#FFFFFF"],
      });
    } else {
      setDemoStep("outcome_approved");
    }
  };

  const getMilestoneBadge = (total: number) => {
    if (total >= 1000) return "🏎️ Car Downpayment or Dream Trip";
    if (total >= 600) return "🇯🇵 Japan Summer Flight & Hotel";
    if (total >= 350) return "💻 MacBook Pro or iPad Setup";
    if (total >= 150) return "🎧 AirPods Max or Sneaker Grail";
    return "🌱 Strong Rainy Day Cushion";
  };

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-10 text-center max-w-3xl mx-auto px-4">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Top Badges */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono uppercase tracking-wider mb-6 shadow-xs animate-in fade-in">
          <Shield className="w-3.5 h-3.5 text-amber-600" />
          <span>تِجوري &bull; Behavioral Anti-Impulse Protocol</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Save money <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-600">before</span> your impulses spend it.
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Standard banks let you withdraw with FaceID in two seconds—so late-night retail splurges drain your savings effortlessly. 
          <strong> Tijori</strong> adds social friction: recurring micro-pulls locked into vaults that require your trusted friend&apos;s permission to break.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/create"
            className="tactile-btn w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>Create Your Vault</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/dashboard"
            className="tactile-btn w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 hover:border-slate-400 shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-600" />
            <span>Open Dashboard</span>
          </Link>
        </div>

        {/* Trust & Proof Metrics */}
        <div className="mt-10 grid grid-cols-3 gap-3 border-t border-slate-200/80 pt-6 font-mono text-center">
          <div className="p-2">
            <div className="text-xl sm:text-2xl font-black text-emerald-700">98.4%</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Impulse Spends Blocked</div>
          </div>
          <div className="p-2 border-x border-slate-200">
            <div className="text-xl sm:text-2xl font-black text-amber-700">Day 25</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">GCC Payday Sync</div>
          </div>
          <div className="p-2">
            <div className="text-xl sm:text-2xl font-black text-slate-800">1-Click</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">WhatsApp Friction</div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE ANTI-IMPULSE SIMULATOR */}
      <section id="simulator" className="max-w-4xl mx-auto px-4 scroll-mt-20">
        <div className="glass-panel rounded-3xl p-6 sm:p-9 bg-white border border-slate-200/90 shadow-card hover:border-amber-400/40 transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-xs">
                <Sliders className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Interactive Micro-Savings Simulator
                </h2>
                <p className="text-xs text-slate-500">
                  Slide your income, savings target, and horizon to preview your protected wealth.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Live Projection
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Sliders (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Slider 1: Monthly Income / Allowance */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-700">Monthly Allowance / Salary:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatKWD(monthlyIncome)} KWD
                  </span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="2500"
                  step="25"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>200 KWD (Student)</span>
                  <span>1,200 KWD</span>
                  <span>2,500 KWD (Professional)</span>
                </div>
              </div>

              {/* Slider 2: Micro-Savings Rate */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-700">Automated Micro-Pull Rate:</span>
                  <span className="font-mono font-bold text-amber-700 text-sm">
                    {savingsRate}% ({formatKWD(monthlySavings)} KWD/mo)
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="35"
                  step="1"
                  value={savingsRate}
                  onChange={(e) => setSavingsRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>5% (Gentle)</span>
                  <span>15% (Recommended)</span>
                  <span>35% (Aggressive)</span>
                </div>
              </div>

              {/* Slider 3: Target Horizon */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-700">Time Lock Horizon:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {horizonMonths} Months
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="1"
                  value={horizonMonths}
                  onChange={(e) => setHorizonMonths(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>2 Months</span>
                  <span>6 Months</span>
                  <span>12 Months</span>
                </div>
              </div>
            </div>

            {/* Results Display Card (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-amber-50/50 p-6 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between h-full space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-bold block mb-1">
                  Guaranteed Protected Savings
                </span>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                  {formatKWD(projectedTotal)} <span className="text-lg font-bold text-slate-600">KWD</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Saved via automatic weekly micro-pulls of ~{Math.round(monthlySavings / 4)} KWD.
                </p>
              </div>

              {/* Impact Metrics */}
              <div className="space-y-2.5 pt-3 border-t border-amber-200/60 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Impulse Traps Avoided:</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    ~{impulsesAvoided} splurges 🛡️
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Goal Equivalent:</span>
                  <span className="font-semibold text-slate-900 text-right text-[11px] font-sans">
                    {getMilestoneBadge(projectedTotal)}
                  </span>
                </div>
              </div>

              <Link
                href="/create"
                className="tactile-btn w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 text-center transition-all flex items-center justify-center gap-1.5"
              >
                <span>Lock This Goal in Tijori</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE KEYHOLDER PROTOCOL WALKTHROUGH */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-medium mb-3">
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
            <span>Social Accountability In Action</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How The Keyholder Protocol Works
          </h2>
          <p className="text-xs text-slate-600 mt-2">
            Try the interactive simulator below to experience how having a friend as your Keyholder stops impulsive spending in its tracks.
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/90 shadow-card">
          {/* Step progression tabs */}
          <div className="grid grid-cols-3 gap-2 pb-6 border-b border-slate-200 text-xs font-mono font-semibold">
            <button
              onClick={() => setDemoStep("locked")}
              className={`p-2.5 rounded-xl border transition-all text-center ${
                demoStep === "locked"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              1. Vault Locked 🔒
            </button>
            <button
              onClick={() => setDemoStep("break_attempt")}
              className={`p-2.5 rounded-xl border transition-all text-center ${
                demoStep === "break_attempt"
                  ? "bg-rose-50 text-rose-900 border-rose-300"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              2. The Impulse Urge 🚨
            </button>
            <button
              onClick={() => setDemoStep("keyholder_review")}
              className={`p-2.5 rounded-xl border transition-all text-center ${
                demoStep === "keyholder_review" || demoStep === "outcome_denied" || demoStep === "outcome_approved"
                  ? "bg-amber-50 text-amber-900 border-amber-300"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              3. Friend Decides 💬
            </button>
          </div>

          {/* Interactive Screen Display */}
          <div className="pt-6">
            {demoStep === "locked" && (
              <div className="text-center py-6 max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Vault Time-Locked: &ldquo;Japan Trip 🇯🇵&rdquo;
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You have <strong>450 KWD</strong> locked safe. Automated micro-pulls are running quietly every week. Your friend <strong>Fahad</strong> is appointed as Keyholder.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setDemoStep("break_attempt")}
                    className="tactile-btn px-6 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-xs"
                  >
                    Simulate Late-Night Impulse Urge 🚨
                  </button>
                </div>
              </div>
            )}

            {demoStep === "break_attempt" && (
              <div className="max-w-md mx-auto space-y-4">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">11:30 PM: Spontaneous Impulse!</span>
                    <span>You see a limited drop sale or want to split an extravagant weekend chalet. You attempt to break the vault.</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Your Written Reason for Early Withdrawal:
                  </label>
                  <textarea
                    rows={2}
                    value={demoExcuse}
                    onChange={(e) => setDemoExcuse(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-mono">
                  ⚠️ Protocol: FaceID instant withdrawal is disabled. Your Keyholder must approve this written reason via WhatsApp.
                </div>

                <button
                  onClick={() => setDemoStep("keyholder_review")}
                  className="tactile-btn w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/15 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-slate-950" />
                  <span>Send to Keyholder (Fahad) on WhatsApp 💬</span>
                </button>
              </div>
            )}

            {(demoStep === "keyholder_review" || demoStep === "outcome_denied" || demoStep === "outcome_approved") && (
              <div className="max-w-md mx-auto space-y-4">
                {/* Simulated Keyholder Mobile Clearance View */}
                <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-md space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <span className="text-[10px] font-mono uppercase font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Keyholder Decision Screen
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Single-Use Token Channel
                    </span>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Your friend wants to withdraw:</div>
                    <div className="text-lg font-black text-slate-900 font-mono">450 KWD (Japan Trip 🇯🇵)</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-amber-200 text-xs italic text-slate-800">
                    &ldquo;{demoExcuse}&rdquo;
                  </div>

                  {demoStep === "keyholder_review" && (
                    <div className="pt-2 space-y-2">
                      <button
                        onClick={() => handleKeyholderDecision("DENY")}
                        className="tactile-btn w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Fahad Clicks: &ldquo;Deny & Protect Vault&rdquo; 🛡️</span>
                      </button>

                      <button
                        onClick={() => handleKeyholderDecision("APPROVE")}
                        className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all"
                      >
                        Fahad Clicks: &ldquo;Approve Early Release&rdquo; (Give In)
                      </button>
                    </div>
                  )}

                  {demoStep === "outcome_denied" && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2 animate-in fade-in">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Hero Move! Impulse Spurge Blocked!</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Fahad blocked your request with tough love. Your <strong>450 KWD</strong> remains locked and protected. You wake up tomorrow grateful that you didn&apos;t blow your trip savings.
                      </p>
                      <button
                        onClick={() => setDemoStep("locked")}
                        className="text-[11px] text-emerald-800 font-bold underline block pt-1"
                      >
                        Reset Demo ↻
                      </button>
                    </div>
                  )}

                  {demoStep === "outcome_approved" && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2 animate-in fade-in">
                      <div className="font-bold flex items-center gap-1.5">
                        <Unlock className="w-4 h-4 text-amber-600" />
                        <span>Funds Released (Emergency Override)</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Fahad agreed this was a genuine emergency and authorized the withdrawal. The single-use link has been burned.
                      </p>
                      <button
                        onClick={() => setDemoStep("locked")}
                        className="text-[11px] text-amber-800 font-bold underline block pt-1"
                      >
                        Reset Demo ↻
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. THE 3 PILLARS OF BEHAVIORAL FRICTION */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-4 scroll-mt-20">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Why Behavioral Friction Beats Banking
          </h2>
          <p className="text-xs text-slate-600 mt-2">
            Most savings apps fail because they make withdrawal effortless. Tijori is built on behavioural economics specifically tailored for GCC young adults.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card hover:border-amber-400/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-xs">
              <Flame className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              GCC Day-25 Salary Sync
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Syncs with your monthly allowance cycle (I&apos;ana or government deposit). Pulls automatically surge during high-liquidity week 1, then taper off toward month-end to eliminate overdraft anxiety.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card hover:border-amber-400/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              The Keyholder Protocol
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your best friend holds the digital key. To break a vault before your target date, they must review your reason on a single-use WhatsApp link. Social accountability prevents 98% of frivolous breaks.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card hover:border-amber-400/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              5% Discipline Deterrent
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real stakes keep your willpower iron-clad. Unapproved withdrawals trigger a 5% forfeit discipline penalty, ensuring your hard-earned savings only unlock for authentic emergencies.
            </p>
          </div>
        </div>
      </section>

      {/* 5. BOTTOM HERO CALL TO ACTION */}
      <section className="max-w-3xl mx-auto px-4 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Stop letting spontaneous purchases drain your future.
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Create your vault in under 60 seconds. Choose your target, set your recurring pull, and appoint your Keyholder guardian.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/create"
              className="tactile-btn w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 stroke-[2.5]" />
              <span>Lock Your First Vault</span>
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
