"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Target,
  KeyRound,
  Check,
  X,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BrandLogo from "@/components/BrandLogo";
import VaultContainer from "@/components/VaultContainer";
import { useT } from "@/lib/i18n";

export default function LandingPage() {
  const { t, lang } = useT();
  const isArabic = lang === "ar";
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [mockupDecision, setMockupDecision] = useState<"pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          }
        }
      } catch {}
    }
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen text-text selection:bg-accent/20 selection:text-accent overflow-x-clip">
      {/* ── Top Navigation ── */}
      <header className="border-b border-line bg-surface/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <BrandLogo href="/" size="md" showTagline={true} />

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSwitcher />

            {user ? (
              <Link
                href="/dashboard"
                className="tactile-btn inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-btn bg-accent text-accent-foreground font-extrabold text-xs shadow-limeGlow whitespace-nowrap shrink-0"
              >
                <span>{t("landing.dashboardBtn")}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex text-xs font-semibold text-text hover:text-accent px-3 sm:px-4 py-2 rounded-btn hover:bg-raised transition-colors whitespace-nowrap"
                >
                  {t("landing.ctaLogin")}
                </Link>
                <Link
                  href="/signup"
                  className="tactile-btn inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-btn bg-accent text-accent-foreground font-extrabold text-xs shadow-limeGlow whitespace-nowrap shrink-0"
                >
                  <span>{t("landing.ctaStart")}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Section 1: Hero ── */}
      <section className="relative overflow-hidden py-10 sm:py-20 lg:py-24 border-b border-line/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
            {/* Left Column (Right in RTL): Text + CTAs */}
            <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-start">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-btn bg-raised/80 border border-line text-muted text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span>{t("landing.engineBadge")}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-text">
                {t("landing.heroTitle")}
              </h1>

              <p className="text-base sm:text-lg text-muted max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t("landing.heroSubtitle")}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href={user ? "/dashboard" : "/signup"}
                  className="tactile-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-btn bg-accent text-accent-foreground font-extrabold text-sm sm:text-base shadow-limeGlow"
                >
                  <span>{user ? t("landing.dashboardBtn") : t("landing.ctaStart")}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Link>

                {!user && (
                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 rounded-btn border border-line bg-surface hover:bg-raised text-text hover:text-accent font-semibold text-sm sm:text-base transition-colors"
                  >
                    {t("landing.ctaLogin")}
                  </Link>
                )}
              </div>
            </div>

            {/* Right Column (Left in RTL): 3D Vault */}
            <div className="w-full lg:w-1/2 flex items-center justify-center relative">
              <VaultContainer />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: How It Works (Horizontal Scroll) ── */}
      <section id="how-it-works" className="py-20 sm:py-28 border-b border-line/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
              {t("landing.howItWorksHeading")}
            </h2>
            <p className="text-base text-muted max-w-xl">
              {t("landing.howItWorksSub")}
            </p>
          </div>

          {/* Horizontal scroll track */}
          <div className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none snap-x snap-mandatory">
            {/* Step 1 */}
            <div className="min-w-[280px] sm:min-w-[340px] lg:min-w-[360px] flex-1 bg-surface border border-line rounded-[24px] p-8 space-y-6 snap-start shadow-violetSubtle hover:border-violet/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold tracking-wider px-3 py-1 rounded-btn bg-raised border border-line text-accent">
                  {t("landing.step1Tag")}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-raised border border-line flex items-center justify-center text-accent">
                  <Target className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-text">
                  {t("landing.step1Title")}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {t("landing.step1Desc")}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="min-w-[280px] sm:min-w-[340px] lg:min-w-[360px] flex-1 bg-surface border border-line rounded-[24px] p-8 space-y-6 snap-start shadow-violetSubtle hover:border-accent/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold tracking-wider px-3 py-1 rounded-btn bg-raised border border-line text-accent">
                  {t("landing.step2Tag")}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-raised border border-line flex items-center justify-center text-accent">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-text">
                  {t("landing.step2Title")}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {t("landing.step2Desc")}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="min-w-[280px] sm:min-w-[340px] lg:min-w-[360px] flex-1 bg-surface border border-line rounded-[24px] p-8 space-y-6 snap-start shadow-violetSubtle hover:border-coral/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold tracking-wider px-3 py-1 rounded-btn bg-raised border border-line text-coral">
                  {t("landing.step3Tag")}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-raised border border-line flex items-center justify-center text-coral">
                  <KeyRound className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-text">
                  {t("landing.step3Title")}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {t("landing.step3Desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Live HTML Phone Mockup (Friend-Approval Moment) ── */}
      <section className="py-20 sm:py-28 border-b border-line/60 bg-surface/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
              {t("landing.approvalHeading")}
            </h2>
            <p className="text-base text-muted">
              {t("landing.approvalSub")}
            </p>
          </div>

          {/* Pure HTML Phone Mockup */}
          <div className="relative max-w-[370px] sm:max-w-[400px] mx-auto">
            {/* Ambient Phone Glow */}
            <div className="absolute inset-0 bg-violet/20 blur-3xl -z-10 rounded-[48px]" />

            {/* Chassis */}
            <div className="bg-[#171524] border-4 border-[#2C273F] rounded-[48px] shadow-2xl p-3.5 select-none">
              {/* Dynamic Island / Notch */}
              <div className="relative mx-auto w-28 h-5 bg-[#0B0A14] rounded-full mb-3 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1A1828] ms-8" />
              </div>

              {/* Inner Screen */}
              <div className="bg-[#0D0C18] rounded-[36px] overflow-hidden border border-line/50 text-text text-start">
                {/* Chat Top Bar */}
                <div className="bg-[#141B18] border-b border-[#213028] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-extrabold text-xs">
                      F
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-text">
                        {t("landing.mockupContact")}
                      </p>
                      <p className="text-xs text-[#3DFFB0]">online</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#3DFFB0] shadow-sm" />
                </div>

                {/* Chat Conversation Scroll Area */}
                <div className="p-4 space-y-4">
                  {/* WhatsApp-Style Message Bubble */}
                  <div className="bg-[#1A2820] border border-[#2B4034] rounded-2xl rounded-ss-sm p-3.5 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-[#3DFFB0]">
                        {t("landing.mockupSender")}
                      </span>
                      <span className="text-muted">09:41</span>
                    </div>

                    <p className="text-xs text-text font-medium leading-relaxed">
                      {t("landing.mockupAlertBody")}
                    </p>

                    <div className="bg-[#0F1813] rounded-xl p-2.5 border border-[#23352B] space-y-1">
                      <p className="text-xs text-muted">
                        {t("landing.mockupExcuseLabel")}:
                      </p>
                      <p className="text-xs font-semibold text-text">
                        &ldquo;{t("landing.mockupExcuseText")}&rdquo;
                      </p>
                    </div>

                    <div className="bg-[#241A30] rounded-xl p-2.5 border border-[#3E2954] space-y-1">
                      <div className="flex items-center gap-1.5 text-accent text-xs font-bold">
                        <Sparkles className="w-3 h-3 text-accent" />
                        <span>{t("landing.mockupAiLabel")}</span>
                      </div>
                      <p className="text-xs text-[#E3DAFC] italic">
                        &ldquo;{t("landing.mockupAiText")}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Integrated Clearance Card Screen */}
                  <div className="bg-surface border border-line rounded-2xl p-3.5 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted">
                        Japan Summer Trip
                      </span>
                      <span className="text-xs font-mono font-extrabold text-accent">
                        125.000 KWD
                      </span>
                    </div>

                    {mockupDecision === "pending" ? (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setMockupDecision("rejected")}
                          className="px-3 py-2 rounded-btn border border-coral/40 bg-coral/10 hover:bg-coral/20 text-coral font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{t("landing.mockupReject")}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMockupDecision("approved")}
                          className="px-3 py-2 rounded-btn bg-[#3DFFB0] hover:bg-[#34E09B] text-[#0B0A14] font-extrabold text-xs flex items-center justify-center gap-1 transition-colors shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t("landing.mockupApprove")}</span>
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`p-3 rounded-xl border text-center space-y-1.5 transition-all ${
                          mockupDecision === "rejected"
                            ? "bg-coral/10 border-coral/30 text-coral"
                            : "bg-[#3DFFB0]/10 border-[#3DFFB0]/30 text-[#3DFFB0]"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold">
                          {mockupDecision === "rejected" ? (
                            <ShieldAlert className="w-4 h-4 text-coral" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-[#3DFFB0]" />
                          )}
                          <span>
                            {mockupDecision === "rejected"
                              ? t("landing.mockupRejectedFeedback")
                              : t("landing.mockupApprovedFeedback")}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMockupDecision("pending")}
                          className="text-xs text-muted underline hover:text-text"
                        >
                          {isArabic ? "إعادة التجربة" : "Try again"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Final Big CTA ── */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text leading-tight">
              {t("landing.finalCtaHeading")}
            </h2>
            <p className="text-base sm:text-lg text-muted max-w-xl mx-auto">
              {t("landing.finalCtaSub")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="tactile-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 rounded-btn bg-accent text-accent-foreground font-extrabold text-base shadow-limeGlow"
            >
              <span>{user ? t("landing.dashboardBtn") : t("landing.finalCtaButton")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-line py-12 bg-surface/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface border border-line flex items-center justify-center">
              <Lock className="w-4 h-4 text-accent" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-text">Tijori</span>
              <span className="text-xs text-muted ms-2">
                {t("landing.footerTagline")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted">
            <a href="#how-it-works" className="hover:text-accent transition-colors">
              {t("landing.footerSecurity")}
            </a>
            <a href="#" className="hover:text-accent transition-colors">
              {t("landing.footerPrivacy")}
            </a>
            <a href="#" className="hover:text-accent transition-colors">
              {t("landing.footerTerms")}
            </a>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
          </div>
        </div>
      </footer>
    </div>
  );
}
