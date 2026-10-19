"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Flame,
  Clock,
  Coins,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  Send,
  RefreshCw,
  Copy,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";

export default function StyleguidePage() {
  const { t, lang, setLang } = useT();
  const [activeTab, setActiveTab] = useState<"interactive" | "sidebyside">("sidebyside");
  const [sampleAmount, setSampleAmount] = useState("125.000");
  const [sampleNote, setSampleNote] = useState("Weekend chalet with friends in Khiran");

  const colors = [
    { name: "--bg", hex: "#0B0A14", label: "Deep Obsidian Canvas", border: true },
    { name: "--surface", hex: "#15131F", label: "Base Card Surface", border: true },
    { name: "--raised", hex: "#1E1B2B", label: "Raised Layer / Inner Card", border: true },
    { name: "--line", hex: "#2A2639", label: "Structural Borders", border: false },
    { name: "--text", hex: "#F5F3FF", label: "High-Contrast Lavender Text", border: false, textColor: "#0B0A14" },
    { name: "--muted", hex: "#A29DB8", label: "Secondary & Helper Copy", border: false, textColor: "#0B0A14" },
    { name: "--accent (lime)", hex: "#C6FF3D", label: "Single Primary Action", border: false, textColor: "#0B0A14" },
    { name: "--violet", hex: "#7C5CFF", label: "Secondary Glows & Accents", border: false, textColor: "#FFFFFF" },
    { name: "--coral", hex: "#FF5C7A", label: "Danger / Break Vault Only", border: false, textColor: "#FFFFFF" },
    { name: "--mint", hex: "#3DFFB0", label: "Success & Protection Locked", border: false, textColor: "#0B0A14" },
  ];

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Top Header & Context Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-line">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-btn bg-raised border border-line text-xs font-semibold text-accent">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tijori GCC Design System v2.0</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-text tracking-tight">
            {t("styleguide.title")}
          </h1>
          <p className="text-base sm:text-lg text-muted max-w-2xl">
            {t("styleguide.subtitle")}
          </p>
        </div>

        {/* View Toggle & Language Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-btn bg-surface border border-line p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("sidebyside")}
              className={`px-3 py-1.5 rounded-btn transition-all ${
                activeTab === "sidebyside"
                  ? "bg-raised text-accent border border-line shadow-violetSubtle"
                  : "text-muted hover:text-text"
              }`}
            >
              Side-by-Side (EN &amp; AR)
            </button>
            <button
              onClick={() => setActiveTab("interactive")}
              className={`px-3 py-1.5 rounded-btn transition-all ${
                activeTab === "interactive"
                  ? "bg-raised text-accent border border-line shadow-violetSubtle"
                  : "text-muted hover:text-text"
              }`}
            >
              Live Dynamic Mode
            </button>
          </div>

          <LanguageSwitcher />
        </div>
      </div>

      {/* 1. COLOR TOKENS PALETTE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-text tracking-tight">
              {t("styleguide.colorsTitle")}
            </h2>
            <p className="text-xs text-muted">
              Dark-first curated tokens: single primary action lime, secondary violet glows, coral for break states only.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {colors.map((c) => (
            <div
              key={c.name}
              className="bg-surface border border-line rounded-card p-4 space-y-3 shadow-card hover:border-violet/40 transition-colors"
            >
              <div
                className="w-full h-16 rounded-xl flex items-center justify-center font-bold text-xs"
                style={{
                  backgroundColor: c.hex,
                  color: c.textColor || "#F5F3FF",
                  boxShadow: c.hex === "#C6FF3D" ? "0 0 20px -3px rgba(198, 255, 61, 0.3)" : c.hex === "#7C5CFF" ? "0 0 20px -3px rgba(124, 92, 255, 0.3)" : c.hex === "#FF5C7A" ? "0 0 20px -3px rgba(255, 92, 122, 0.3)" : undefined,
                  border: c.border ? "1px solid #2A2639" : "none",
                }}
              >
                {c.hex}
              </div>
              <div>
                <p className="font-mono text-xs font-semibold text-text">{c.name}</p>
                <p className="text-xs text-muted leading-tight mt-0.5">{c.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. MONEY DISPLAY (56px - 96px Tabular-Nums) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-text tracking-tight">
            {t("styleguide.moneyTitle")}
          </h2>
          <p className="text-xs text-muted">
            Strictly tabular-nums font configuration. Never serif, never generic decimals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* English Money Card */}
          <div className="bg-surface border border-line rounded-card p-6 sm:p-8 shadow-card space-y-4">
            <div className="flex items-center justify-between text-xs text-muted pb-2 border-b border-line">
              <span className="font-semibold text-text">English (LTR)</span>
              <span className="font-mono text-xs">Bricolage Grotesque + Tabular Nums</span>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs text-muted mb-1">Headline Money (96px scale)</p>
                <div className="font-extrabold text-text tracking-tight tabular-nums text-5xl sm:text-7xl lg:text-8xl leading-none">
                  1,500<span className="text-muted/60 text-3xl sm:text-5xl">.000</span>
                  <span className="text-accent ms-3 text-2xl sm:text-4xl font-bold">KWD</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted mb-1">Vault Core Balance (56px scale)</p>
                <div className="font-extrabold text-text tracking-tight tabular-nums text-4xl sm:text-5xl lg:text-6xl leading-none">
                  125<span className="text-muted/60 text-2xl sm:text-3xl">.000</span>
                  <span className="text-accent ms-2 text-xl sm:text-2xl font-bold">KWD</span>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-btn bg-raised border border-line text-mint font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  +25.000 KWD auto-tucked
                </span>
                <span className="tabular-nums font-semibold">Goal: 500.000 KWD</span>
              </div>
            </div>
          </div>

          {/* Arabic Money Card */}
          <div dir="rtl" className="bg-surface border border-line rounded-card p-6 sm:p-8 shadow-card space-y-4">
            <div className="flex items-center justify-between text-xs text-muted pb-2 border-b border-line">
              <span className="font-semibold text-text font-sans">عربي (RTL)</span>
              <span className="font-sans text-xs">Readex Pro + أرقام جدولية</span>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs text-muted mb-1 font-sans">عرض المبلغ العريض (مقياس 96px)</p>
                <div className="font-extrabold text-text tracking-tight tabular-nums text-5xl sm:text-7xl lg:text-8xl leading-none font-sans">
                  1,500<span className="text-muted/60 text-3xl sm:text-5xl">.000</span>
                  <span className="text-accent me-3 text-2xl sm:text-4xl font-bold">د.ك</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted mb-1 font-sans">رصيد الخزينة المباشر (مقياس 56px)</p>
                <div className="font-extrabold text-text tracking-tight tabular-nums text-4xl sm:text-5xl lg:text-6xl leading-none font-sans">
                  125<span className="text-muted/60 text-2xl sm:text-3xl">.000</span>
                  <span className="text-accent me-2 text-xl sm:text-2xl font-bold">د.ك</span>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2 text-xs text-muted font-sans">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-btn bg-raised border border-line text-mint font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  +25.000 د.ك توفير تلقائي
                </span>
                <span className="tabular-nums font-semibold">الهدف: 500.000 د.ك</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BUTTONS & TACTILE STATES */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-text tracking-tight">
            {t("styleguide.buttonsTitle")}
          </h2>
          <p className="text-xs text-muted">
            Strict shape: 999px radius (rounded-btn), generous padding, spring-tactile interaction on click.
          </p>
        </div>

        <div className="bg-surface border border-line rounded-card p-6 sm:p-8 shadow-card space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Primary Action Lime */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
                Primary (1 Per Screen)
              </span>
              <button
                type="button"
                className="w-full tactile-btn px-6 py-3.5 rounded-btn bg-accent text-accent-foreground font-extrabold text-sm shadow-limeGlow hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>{t("styleguide.primaryBtn")}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>

            {/* 2. Secondary Raised */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
                Secondary Raised
              </span>
              <button
                type="button"
                className="w-full tactile-btn px-6 py-3.5 rounded-btn bg-raised hover:bg-surface border border-line text-text font-bold text-sm shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Coins className="w-4 h-4 text-violet" />
                <span>{t("styleguide.secondaryBtn")}</span>
              </button>
            </div>

            {/* 3. Secondary Glow Violet */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
                Secondary Glow Accent
              </span>
              <button
                type="button"
                className="w-full tactile-btn px-6 py-3.5 rounded-btn bg-violet/15 hover:bg-violet/25 border border-violet/30 text-text font-bold text-sm shadow-violetSubtle active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-violet" />
                <span>Violet Glow Highlight</span>
              </button>
            </div>

            {/* 4. Danger / Break Early Coral */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-coral uppercase tracking-wider block">
                Danger / Break Vault Only
              </span>
              <button
                type="button"
                className="w-full tactile-btn px-6 py-3.5 rounded-btn bg-coral/15 hover:bg-coral/25 border border-coral/30 text-coral font-bold text-sm shadow-coralGlow active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>{t("styleguide.dangerBtn")}</span>
              </button>
            </div>
          </div>

          {/* Button States Demonstration */}
          <div className="pt-4 border-t border-line">
            <span className="text-xs font-semibold text-muted block mb-3">Interactive States:</span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                disabled
                className="tactile-btn px-5 py-2.5 rounded-btn bg-raised/50 border border-line text-muted/50 font-bold text-xs cursor-not-allowed"
              >
                Disabled Action
              </button>

              <button className="tactile-btn px-5 py-2.5 rounded-btn bg-accent text-accent-foreground font-extrabold text-xs inline-flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                <span>Processing...</span>
              </button>

              <button className="tactile-btn px-4 py-2 rounded-btn bg-mint/15 border border-mint/30 text-mint font-bold text-xs inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approved</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INPUT FIELDS & FORMS */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-text tracking-tight">
            {t("styleguide.inputsTitle")}
          </h2>
          <p className="text-xs text-muted">
            High-contrast dark inputs, generous touch targets (24px+ padding), violet focus ring, RTL alignment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LTR Inputs */}
          <div className="bg-surface border border-line rounded-card p-6 sm:p-8 shadow-card space-y-4">
            <span className="text-xs font-semibold text-text pb-2 border-b border-line block">
              English Input Stack
            </span>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text block">
                {t("styleguide.sampleLabel")}
              </label>
              <input
                type="text"
                defaultValue={t("styleguide.sampleValue")}
                placeholder={t("styleguide.inputPlaceholder")}
                className="w-full bg-raised border border-line text-text placeholder:text-muted/50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text block">
                Target Savings Amount (KWD)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={sampleAmount}
                  onChange={(e) => setSampleAmount(e.target.value)}
                  className="w-full bg-raised border border-line text-text placeholder:text-muted/50 rounded-xl px-4 py-3.5 text-sm font-semibold tabular-nums pe-16 focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 transition-all"
                />
                <span className="absolute inset-y-0 end-4 flex items-center text-xs font-bold text-accent pointer-events-none">
                  KWD
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text block">
                Break Lock Excuse (Why do you need it?)
              </label>
              <textarea
                rows={3}
                value={sampleNote}
                onChange={(e) => setSampleNote(e.target.value)}
                className="w-full bg-raised border border-line text-text placeholder:text-muted/50 rounded-xl p-4 text-sm focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 transition-all resize-none"
              />
            </div>
          </div>

          {/* RTL Inputs */}
          <div dir="rtl" className="bg-surface border border-line rounded-card p-6 sm:p-8 shadow-card space-y-4 font-sans">
            <span className="text-xs font-semibold text-text pb-2 border-b border-line block">
              حقول الإدخال بالعربية (RTL)
            </span>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text block">
                اسم هدف التوفير
              </label>
              <input
                type="text"
                defaultValue="سفرة طوكيو بالصيف"
                placeholder="اكتب اسم الهدف..."
                className="w-full bg-raised border border-line text-text placeholder:text-muted/50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 transition-all font-sans"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text block">
                المبلغ المستهدف (د.ك)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={sampleAmount}
                  onChange={(e) => setSampleAmount(e.target.value)}
                  className="w-full bg-raised border border-line text-text placeholder:text-muted/50 rounded-xl px-4 py-3.5 text-sm font-semibold tabular-nums pe-16 focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 transition-all"
                />
                <span className="absolute inset-y-0 end-4 flex items-center text-xs font-bold text-accent pointer-events-none font-sans">
                  د.ك
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text block">
                عذر كسر القفل (ليش تبي تسحب الفلوس؟)
              </label>
              <textarea
                rows={3}
                defaultValue="شاليه الويكند مع الربع بالخيران ومحتاج كاش"
                className="w-full bg-raised border border-line text-text placeholder:text-muted/50 rounded-xl p-4 text-sm focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 transition-all resize-none font-sans"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. CARDS, SHAPES & REALITY CHECK GLOWS */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-text tracking-tight">
            {t("styleguide.cardsTitle")}
          </h2>
          <p className="text-xs text-muted">
            20px radius (rounded-card), soft violet glow shadows, high-contrast borders, zero gray drop shadows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Vault Core Card */}
          <div className="bg-surface border border-line rounded-card p-6 sm:p-7 shadow-card space-y-4 hover:shadow-cardHover transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-raised border border-line flex items-center justify-center shadow-violetSubtle">
                <Lock className="w-5 h-5 text-accent" />
              </div>
              <span className="px-2.5 py-1 rounded-btn bg-mint/15 text-mint border border-mint/30 text-xs font-bold">
                Time-Locked
              </span>
            </div>
            <div>
              <p className="text-xs text-muted">Savings Vault</p>
              <h3 className="text-xl font-extrabold text-text">Japan Summer Trip</h3>
            </div>
            <div className="pt-2 border-t border-line flex items-center justify-between">
              <span className="text-xs text-muted">Balance</span>
              <span className="text-lg font-extrabold text-accent tabular-nums">125.000 KWD</span>
            </div>
          </div>

          {/* Card 2: Keyholder Social Friction Card */}
          <div className="bg-surface border border-line rounded-card p-6 sm:p-7 shadow-card space-y-4 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet/20 border border-violet/30 flex items-center justify-center shadow-violetSubtle">
                <ShieldCheck className="w-5 h-5 text-violet" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-text">Fahad Al-Mutawa</h4>
                <p className="text-xs text-muted">Best Friend &bull; Keyholder</p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-raised border border-line text-xs text-muted leading-relaxed">
              &quot;Fahad has prevented 3 impulsive breaks, protecting 380 KWD in your vault.&quot;
            </div>
            <button className="w-full tactile-btn py-2.5 rounded-btn bg-raised hover:bg-surface border border-line text-xs font-bold text-text flex items-center justify-center gap-2">
              <Send className="w-3.5 h-3.5 text-accent" />
              <span>Ping Fahad on WhatsApp</span>
            </button>
          </div>

          {/* Card 3: Reality Check Roast Card */}
          <div className="bg-surface border border-coral/30 rounded-card p-6 sm:p-7 shadow-coralGlow space-y-4">
            <div className="flex items-center gap-2 text-coral">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-extrabold tracking-wider uppercase">
                Tijori Reality Check
              </span>
            </div>
            <p className="text-sm font-medium text-text leading-relaxed">
              &quot;Abdulrahman wants 125 KWD for chalet weekend? He bought 3 iced V60s yesterday and cried about Tokyo tickets.&quot;
            </p>
            <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-muted">
              <span>Audience: Fahad</span>
              <span className="text-coral font-bold">5% Break Buffer</span>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Return */}
      <div className="pt-8 border-t border-line flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-accent transition-colors"
        >
          <span>&larr; Return to Landing Page</span>
        </Link>

        <Link
          href="/dashboard"
          className="tactile-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-accent text-accent-foreground font-extrabold text-xs shadow-limeGlow"
        >
          <span>Open Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}
