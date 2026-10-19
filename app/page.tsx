"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowDown,
  Lock,
  Shield,
  Flame,
  Star,
  Check,
  RotateCcw,
  SlidersHorizontal,
  KeyRound,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import VaultContainer from "@/components/VaultContainer";
import { useT } from "@/lib/i18n";

export default function LandingPage() {
  const { t, lang } = useT();
  const isArabic = lang === "ar";

  // Friend Approval Interactive Mockup State
  const [mockupState, setMockupState] = useState<"pending" | "locked" | "unlocked">("pending");

  // Sticky How-It-Works Active Step State
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === step1Ref.current) setActiveStep(1);
            if (entry.target === step2Ref.current) setActiveStep(2);
            if (entry.target === step3Ref.current) setActiveStep(3);
          }
        });
      },
      { rootMargin: "-20% 0px -40% 0px", threshold: 0.2 }
    );

    if (step1Ref.current) observer.observe(step1Ref.current);
    if (step2Ref.current) observer.observe(step2Ref.current);
    if (step3Ref.current) observer.observe(step3Ref.current);

    return () => observer.disconnect();
  }, []);

  const handleKeepLocked = async () => {
    setMockupState("locked");
    // Trigger confetti if not prefers-reduced-motion
    if (typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: ["#CFFF3A", "#6B4DFF", "#2DE0A5", "#FFD23F"],
        });
      } catch {}
    }
  };

  const handleLetHaveIt = () => {
    setMockupState("unlocked");
  };

  const marqueeGoals = isArabic
    ? [
        "سفرة اليابان",
        "سوني 5",
        "آيفون جديد",
        "ويكند شاليه",
        "دفعة أولى للسيارة",
        "عمرة",
        "سنيكر ليمتد",
        "هدية تخرج",
      ]
    : [
        "Japan trip",
        "PS5",
        "iPhone",
        "Chalet weekend",
        "Car downpayment",
        "Umrah",
        "Sneaker drop",
        "Graduation gift",
      ];

  return (
    <div className="w-full text-ink overflow-x-clip selection:bg-lime selection:text-ink">
      {/* ─── 1. HERO SECTION ─── */}
      <section className="relative pt-6 sm:pt-12 pb-16 sm:pb-24 px-4 sm:px-6 max-w-[1100px] mx-auto">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-10 lg:gap-14">
          {/* Start Column: Headline, Sticker, Sub, CTAs */}
          <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-start">
            {/* Rotated Sticker above Headline */}
            <div className="inline-block transform -rotate-2 hover:rotate-0 transition-transform">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lime border-2 border-ink shadow-[2px_2px_0_var(--ink)] text-sm font-bold text-ink">
                <span>{t("landing.sticker")}</span>
              </span>
            </div>

            {/* H1 Headline: 56-88px desktop / 40px phone, weight 800 */}
            <h1 className="text-[40px] sm:text-6xl lg:text-[72px] font-extrabold tracking-tight leading-[1.06] text-ink">
              {t("landing.heroTitle")}
            </h1>

            {/* Subhead: 18px body font */}
            <p className="text-lg text-muted max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              {t("landing.heroSubtitle")}
            </p>

            {/* CTAs: Primary Lime + Secondary Text Link with ArrowDown */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                id="hero-cta-btn"
                href="/signup"
                className="btn-hard w-full sm:w-auto bg-lime text-ink font-extrabold text-base sm:text-lg px-8 py-4 inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t("landing.ctaStart")}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 text-base font-bold text-ink hover:text-violet transition-colors py-3 px-4 cursor-pointer"
              >
                <span>{t("landing.seeHowItWorks")}</span>
                <ArrowDown className="w-4 h-4" />
              </a>
            </div>

            {/* Works with existing card note (No fake stats anywhere) */}
            <p className="text-sm font-medium text-muted">
              {t("landing.worksWithCard")}
            </p>
          </div>

          {/* End Column: 3D Vault with 3 Floating Bobbing HTML Stickers */}
          <div className="w-full lg:w-1/2 flex items-center justify-center relative min-h-[300px] sm:min-h-[460px]">
            {/* The 3D Vault Container */}
            <div className="w-full max-w-[340px] sm:max-w-[440px] h-[300px] sm:h-[460px]">
              <VaultContainer />
            </div>

            {/* Sticker A: Lime (+25 KWD locked) */}
            <div
              className="absolute top-4 sm:top-8 -start-2 sm:-start-6 z-10 animate-sticker-bob-1 pointer-events-none"
              style={{ "--rot": "-3deg" } as React.CSSProperties}
            >
              <div className="px-3.5 py-1.5 rounded-full bg-lime border-2 border-ink shadow-[3px_3px_0_var(--ink)] flex items-center gap-1.5 text-xs sm:text-sm font-bold text-ink select-none">
                <Lock className="w-3.5 h-3.5 text-ink" />
                <span>{t("landing.stickerLocked")}</span>
              </div>
            </div>

            {/* Sticker B: Coral (Fahad said no) */}
            <div
              className="absolute top-1/2 -end-2 sm:-end-6 z-10 animate-sticker-bob-2 pointer-events-none"
              style={{ "--rot": "2.5deg" } as React.CSSProperties}
            >
              <div className="px-3.5 py-1.5 rounded-full bg-coral border-2 border-ink shadow-[3px_3px_0_var(--ink)] flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white select-none">
                <Shield className="w-3.5 h-3.5 text-white" />
                <span>{t("landing.stickerFahadNo")}</span>
              </div>
            </div>

            {/* Sticker C: Sun (18-day streak) */}
            <div
              className="absolute bottom-4 sm:bottom-8 -start-1 sm:start-4 z-10 animate-sticker-bob-3 pointer-events-none"
              style={{ "--rot": "-2deg" } as React.CSSProperties}
            >
              <div className="px-3.5 py-1.5 rounded-full bg-sun border-2 border-ink shadow-[3px_3px_0_var(--ink)] flex items-center gap-1.5 text-xs sm:text-sm font-bold text-ink select-none">
                <Flame className="w-3.5 h-3.5 text-ink" />
                <span>{t("landing.stickerStreak")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. GOALS MARQUEE ─── */}
      <section className="w-full bg-ink border-y-2 border-ink py-4 sm:py-5 overflow-hidden select-none">
        <div className={isArabic ? "animate-marquee-rtl" : "animate-marquee-ltr"}>
          {[...marqueeGoals, ...marqueeGoals, ...marqueeGoals].map((goal, idx) => (
            <div
              key={idx}
              className="flex items-center gap-6 sm:gap-8 px-4 text-lime text-xl font-bold whitespace-nowrap"
            >
              <span>{goal}</span>
              <Star className="w-4 h-4 fill-lime text-lime shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* ─── 3. HOW IT WORKS SECTION ─── */}
      <section
        id="how-it-works"
        className="py-20 sm:py-28 px-4 sm:px-6 max-w-[1100px] mx-auto scroll-mt-24"
      >
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-ink font-heading">
            {t("landing.howItWorksHeading")}
          </h2>
          <p className="text-base sm:text-lg text-muted font-medium">
            {t("landing.howItWorksSub")}
          </p>
        </div>

        {/* Desktop Sticky Scroll (>= 1024px) */}
        <div className="hidden lg:grid grid-cols-2 gap-12 items-start relative">
          {/* Start Side: Sticky Visual Container */}
          <div className="sticky top-28 card-hard-lg bg-surface p-8 max-w-[420px] mx-auto space-y-6">
            <div className="flex items-center justify-between border-b-2 border-ink/10 pb-4">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                {isArabic ? "محاكاة الخزينة" : "Live Vault Preview"}
              </span>
              <span className="w-3 h-3 rounded-full bg-lime border border-ink animate-pulse" />
            </div>

            {/* Visual State changing per active step */}
            {activeStep === 1 && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 rounded-2xl bg-lime/20 border-2 border-ink space-y-2">
                  <div className="text-xs font-bold text-muted">
                    {isArabic ? "الهدف المحدد:" : "Active Goal:"}
                  </div>
                  <div className="text-2xl font-extrabold text-ink">
                    {isArabic ? "سفرة اليابان" : "Japan Summer Trip"}
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-ink pt-2">
                  <span>{isArabic ? "المبلغ المستهدف" : "Target Amount"}</span>
                  <span className="text-xl font-extrabold text-violet">
                    {isArabic ? "٥٠٠ د.ك" : "500 KWD"}
                  </span>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 rounded-2xl bg-violet text-white border-2 border-ink space-y-2">
                  <div className="text-xs font-bold text-lime">
                    {isArabic ? "خصم تلقائي منتظم" : "Automated Deduction"}
                  </div>
                  <div className="text-3xl font-extrabold font-mono tracking-tight text-white">
                    {isArabic ? "١٢٥.٠٠٠ د.ك" : "125.000 KWD"}
                  </div>
                </div>
                <div className="w-full bg-bg rounded-full h-3 border-2 border-ink overflow-hidden">
                  <div className="bg-lime h-full w-1/4 rounded-full" />
                </div>
                <div className="text-xs font-bold text-muted text-center">
                  {isArabic ? "خصم أسبوعي ٢٥ د.ك في يوم المكافأة" : "Auto-saving 25 KWD weekly on allowance day"}
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 rounded-2xl bg-[#FFEBEF] border-2 border-ink space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-coral text-white text-xs font-bold">
                    <Lock className="w-3 h-3" />
                    <span>{isArabic ? "القفل محمي" : "Keyholder Protected"}</span>
                  </div>
                  <div className="text-lg font-extrabold text-ink">
                    {isArabic ? "المفتاح بيد فهد المطوع" : "Key held by Fahad Al-Mutawa"}
                  </div>
                  <p className="text-xs text-muted">
                    {isArabic
                      ? "أي محاولة لكسر القفل قبل وقته تتطلب موافقة فهد الصريحة."
                      : "Breaking early requires Fahad's explicit approval on WhatsApp."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* End Side: 3 Big Steps Stacked Vertically with Different Heights & Colors */}
          <div className="space-y-20 py-6">
            {/* Step 1: Lime Accent Card */}
            <div
              ref={step1Ref}
              className={`card-hard p-8 sm:p-10 transition-all duration-300 ${
                activeStep === 1
                  ? "bg-lime border-2 border-ink shadow-[6px_6px_0_var(--ink)]"
                  : "bg-surface opacity-80"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-surface border-2 border-ink flex items-center justify-center font-extrabold text-xl text-ink mb-6 shadow-[2px_2px_0_var(--ink)]">
                1
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-ink mb-3 font-heading">
                {t("landing.step1Title")}
              </h3>
              <p className="text-base sm:text-lg text-ink/80 leading-relaxed font-medium">
                {t("landing.step1Desc")}
              </p>
            </div>

            {/* Step 2: Violet Accent Card (Taller height) */}
            <div
              ref={step2Ref}
              className={`card-hard p-8 sm:p-12 transition-all duration-300 ${
                activeStep === 2
                  ? "bg-violet text-white border-2 border-ink shadow-[6px_6px_0_var(--ink)]"
                  : "bg-surface opacity-80 text-ink"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-lime border-2 border-ink flex items-center justify-center font-extrabold text-xl text-ink mb-6 shadow-[2px_2px_0_var(--ink)]">
                2
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 font-heading">
                {t("landing.step2Title")}
              </h3>
              <p className="text-base sm:text-lg opacity-90 leading-relaxed font-medium">
                {t("landing.step2Desc")}
              </p>
            </div>

            {/* Step 3: Coral Tint Accent Card */}
            <div
              ref={step3Ref}
              className={`card-hard p-8 sm:p-10 transition-all duration-300 ${
                activeStep === 3
                  ? "bg-[#FFEBEF] border-2 border-ink shadow-[6px_6px_0_var(--ink)]"
                  : "bg-surface opacity-80"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-surface border-2 border-ink flex items-center justify-center font-extrabold text-xl text-coral mb-6 shadow-[2px_2px_0_var(--ink)]">
                3
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-ink mb-3 font-heading">
                {t("landing.step3Title")}
              </h3>
              <p className="text-base sm:text-lg text-ink/80 leading-relaxed font-medium">
                {t("landing.step3Desc")}
              </p>
            </div>
          </div>
        </div>

        {/* Phone Vertical Stack (< 1024px) */}
        <div className="grid lg:hidden grid-cols-1 gap-6">
          {/* Mobile Step 1 */}
          <div className="card-hard bg-lime p-6 sm:p-8 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-surface border-2 border-ink flex items-center justify-center font-extrabold text-lg text-ink shadow-[2px_2px_0_var(--ink)]">
              1
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-ink font-heading">
              {t("landing.step1Title")}
            </h3>
            <p className="text-sm sm:text-base text-ink/80 leading-relaxed font-medium">
              {t("landing.step1Desc")}
            </p>
          </div>

          {/* Mobile Step 2 */}
          <div className="card-hard bg-violet text-white p-7 sm:p-9 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-lime border-2 border-ink flex items-center justify-center font-extrabold text-lg text-ink shadow-[2px_2px_0_var(--ink)]">
              2
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
              {t("landing.step2Title")}
            </h3>
            <p className="text-sm sm:text-base opacity-90 leading-relaxed font-medium">
              {t("landing.step2Desc")}
            </p>
          </div>

          {/* Mobile Step 3 */}
          <div className="card-hard bg-[#FFEBEF] p-6 sm:p-8 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-surface border-2 border-ink flex items-center justify-center font-extrabold text-lg text-coral shadow-[2px_2px_0_var(--ink)]">
              3
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-ink font-heading">
              {t("landing.step3Title")}
            </h3>
            <p className="text-sm sm:text-base text-ink/80 leading-relaxed font-medium">
              {t("landing.step3Desc")}
            </p>
          </div>
        </div>
      </section>

      {/* ─── 4. FRIEND APPROVAL MOMENT (EMOTIONAL CORE) ─── */}
      <section
        id="friend-approval"
        className="py-20 sm:py-28 px-4 sm:px-6 max-w-[1100px] mx-auto border-t-2 border-ink/10 scroll-mt-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Start Column: Story & Explanation */}
          <div className="space-y-6 text-center lg:text-start">
            <div className="inline-block transform -rotate-1">
              <span className="px-3.5 py-1 rounded-full bg-sun border-2 border-ink shadow-[2px_2px_0_var(--ink)] text-xs font-bold text-ink">
                {isArabic ? "موافقة الربع" : "Friend Accountability"}
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-ink tracking-tight font-heading leading-tight">
              {t("landing.approvalHeading")}
            </h2>

            <div className="space-y-4 text-base sm:text-lg text-muted font-medium leading-relaxed">
              <p>• {t("landing.approvalStory1")}</p>
              <p>• {t("landing.approvalStory2")}</p>
              <p>• {t("landing.approvalStory3")}</p>
            </div>
          </div>

          {/* End Column: Interactive Phone Mockup (HTML/CSS, 2px ink border, rounded 40px) */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[380px] bg-surface border-2 border-ink rounded-[40px] shadow-[6px_6px_0_var(--ink)] p-5 sm:p-6 space-y-5 select-none relative">
              {/* Phone Notch/Island */}
              <div className="w-28 h-4 bg-ink rounded-full mx-auto" />

              {/* Inside Phone: Fahad's Notification Card */}
              <div className="card-hard bg-bg p-4 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-muted">
                  <span>{isArabic ? "طلب فك الخزينة" : "Unlock Request"}</span>
                  <span className="text-coral font-mono">125.000 KWD</span>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-extrabold text-ink">
                    {t("landing.mockupUser")}
                  </div>
                  <div className="text-2xl font-extrabold text-ink">
                    {t("landing.mockupAmount")}
                  </div>
                </div>

                {/* Stated Excuse Quote Box */}
                <div className="p-3 rounded-2xl bg-surface border-2 border-ink space-y-1">
                  <div className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    {isArabic ? "العذر المكتوب:" : "Stated Excuse:"}
                  </div>
                  <blockquote dir="auto" className="text-xs sm:text-sm font-semibold text-ink italic">
                    <bdi>&ldquo;{t("landing.mockupExcuse")}&rdquo;</bdi>
                  </blockquote>
                </div>

                {/* Neutral AI Briefing Note (Does NOT tell him what to choose) */}
                <div className="p-2.5 rounded-xl bg-surface/80 border border-ink/20 text-xs font-medium text-muted space-y-0.5">
                  <div className="font-bold text-ink">
                    {isArabic ? "ملخص ذكي محايد" : "Neutral AI Briefing"}
                  </div>
                  <div>{t("landing.mockupAiNote")}</div>
                </div>

                {/* Interactive Decisions State */}
                {mockupState === "pending" && (
                  <div className="pt-2 flex items-center gap-3">
                    {/* Button 1: Keep it locked */}
                    <button
                      type="button"
                      onClick={handleKeepLocked}
                      className="flex-1 py-3 px-2 rounded-btn border-2 border-ink font-bold text-xs sm:text-sm text-center bg-surface hover:bg-bg shadow-[2px_2px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer text-ink"
                    >
                      {t("landing.mockupKeepLocked")}
                    </button>

                    {/* Button 2: Let him have it (Same height, same weight, equal prominence) */}
                    <button
                      type="button"
                      onClick={handleLetHaveIt}
                      className="flex-1 py-3 px-2 rounded-btn border-2 border-ink font-bold text-xs sm:text-sm text-center bg-surface hover:bg-bg shadow-[2px_2px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer text-ink"
                    >
                      {t("landing.mockupLetHaveIt")}
                    </button>
                  </div>
                )}

                {/* State: Locked Feedback */}
                {mockupState === "locked" && (
                  <div className="p-4 rounded-2xl bg-lime/30 border-2 border-ink text-center space-y-2 animate-in zoom-in-95 duration-200">
                    <div className="w-8 h-8 rounded-full bg-lime border border-ink mx-auto flex items-center justify-center">
                      <Check className="w-5 h-5 text-ink" />
                    </div>
                    <div className="text-sm font-extrabold text-ink">
                      {t("landing.mockupProtected")}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMockupState("pending")}
                      className="inline-flex items-center gap-1 text-xs font-bold text-violet underline hover:text-ink cursor-pointer pt-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t("landing.mockupReplay")}</span>
                    </button>
                  </div>
                )}

                {/* State: Unlocked Feedback */}
                {mockupState === "unlocked" && (
                  <div className="p-4 rounded-2xl bg-[#FFEBEF] border-2 border-ink text-center space-y-2 animate-in zoom-in-95 duration-200">
                    <div className="w-8 h-8 rounded-full bg-coral border border-ink mx-auto flex items-center justify-center text-white">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-extrabold text-ink">
                      {t("landing.mockupUnlocked")}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMockupState("pending")}
                      className="inline-flex items-center gap-1 text-xs font-bold text-coral underline hover:text-ink cursor-pointer pt-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t("landing.mockupReplay")}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. WHY TIJORI (BENTO GRID) ─── */}
      <section
        id="why-tijori"
        className="py-20 sm:py-28 px-4 sm:px-6 max-w-[1100px] mx-auto border-t-2 border-ink/10 scroll-mt-24"
      >
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-ink font-heading">
            {t("landing.whyHeading")}
          </h2>
          <p className="text-base sm:text-lg text-muted font-medium">
            {t("landing.whySub")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tile 1: Locked means locked (Big, Violet, spans 2 cols on md) */}
          <div className="md:col-span-2 card-hard bg-violet text-white p-8 sm:p-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-lime border-2 border-ink flex items-center justify-center text-ink shadow-[2px_2px_0_var(--ink)]">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
              {t("landing.why1Title")}
            </h3>
            <p className="text-base sm:text-lg opacity-90 leading-relaxed font-medium">
              {t("landing.why1Desc")}
            </p>
          </div>

          {/* Tile 2: Your friend decides (Lime, 1 col) */}
          <div className="card-hard bg-lime text-ink p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-surface border-2 border-ink flex items-center justify-center text-ink shadow-[2px_2px_0_var(--ink)]">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-extrabold font-heading text-ink">
              {t("landing.why2Title")}
            </h3>
            <p className="text-sm sm:text-base text-ink/80 leading-relaxed font-medium">
              {t("landing.why2Desc")}
            </p>
          </div>

          {/* Tile 3: You set the pace (White, 1 col) */}
          <div className="card-hard bg-surface text-ink p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-bg border-2 border-ink flex items-center justify-center text-violet shadow-[2px_2px_0_var(--ink)]">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-extrabold font-heading text-ink">
              {t("landing.why3Title")}
            </h3>
            <p className="text-sm sm:text-base text-muted leading-relaxed font-medium">
              {t("landing.why3Desc")}
            </p>
          </div>

          {/* Tile 4: Built for allowance day (Sun Yellow, spans 2 cols on md) */}
          <div className="md:col-span-2 card-hard bg-sun text-ink p-8 sm:p-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-surface border-2 border-ink flex items-center justify-center text-ink shadow-[2px_2px_0_var(--ink)]">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-ink">
              {t("landing.why4Title")}
            </h3>
            <p className="text-base sm:text-lg text-ink/85 leading-relaxed font-medium">
              {t("landing.why4Desc")}
            </p>
          </div>
        </div>
      </section>

      {/* ─── 6. FINAL CTA SECTION ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-[1100px] mx-auto">
        <div className="card-hard-lg bg-violet text-white p-10 sm:p-16 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-heading tracking-tight">
            {t("landing.finalCtaHeading")}
          </h2>

          <p className="text-base sm:text-lg opacity-90 max-w-xl mx-auto font-medium">
            {t("landing.finalCtaSub")}
          </p>

          <div className="pt-4 flex justify-center">
            <Link
              href="/signup"
              className="btn-hard bg-lime text-ink font-extrabold text-lg px-8 py-4 inline-flex items-center gap-2 cursor-pointer shadow-[4px_4px_0_var(--ink)]"
            >
              <span>{t("landing.finalCtaButton")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
