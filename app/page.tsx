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
  AlertCircle,
} from "lucide-react";
import VaultContainer from "@/components/VaultContainer";
import MiniVaultGraphic from "@/components/MiniVaultGraphic";
import { useT } from "@/lib/i18n";
import {
  FRIEND_FEE_PCT,
  SOLO_FEE_PCT,
  FRIEND_RETURN_PCT,
  SOLO_RETURN_PCT,
} from "@/lib/config";

export default function LandingPage() {
  const { t, lang } = useT();
  const isArabic = lang === "ar";

  const [user, setUser] = useState<{ id?: string; name?: string } | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("tijori_user");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.success && data?.user) {
          setUser(data.user);
          try {
            localStorage.setItem("tijori_user", JSON.stringify(data.user));
          } catch {}
        } else if (data && !data.success) {
          setUser(null);
          try {
            localStorage.removeItem("tijori_user");
          } catch {}
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Vault Click / Sticker Pulse State
  const [stickersPulsing, setStickersPulsing] = useState(false);
  const [vaultSpinTrigger, setVaultSpinTrigger] = useState(0);

  const handleVaultClick = () => {
    setStickersPulsing(true);
    setVaultSpinTrigger((c) => c + 1);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("tijori:vault-spin"));
    }
    setTimeout(() => setStickersPulsing(false), 700);
  };

  // Friend Approval Interactive Mockup State
  const [mockupState, setMockupState] = useState<"pending" | "locked" | "unlocked">("pending");

  // AI Reality Check Preview State (Interactive Roaster)
  const [roastExcuse, setRoastExcuse] = useState("");
  const [roastResult, setRoastResult] = useState("");
  const [roastLoading, setRoastLoading] = useState(false);
  const [roastGender, setRoastGender] = useState<"female" | "male">("female");

  const handleFetchLandingRoast = async (excuseToTest?: string, genderToUse?: "female" | "male") => {
    const textToTest = excuseToTest !== undefined ? excuseToTest : roastExcuse;
    const targetGender = genderToUse || roastGender;
    if (!textToTest.trim()) return;
    setRoastLoading(true);
    try {
      const res = await fetch("/api/ai/reality-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          excuse: textToTest,
          goal: isArabic ? "سفرة اليابان" : "Japan Summer Trip",
          currentBalance: 125,
          keyholderName: targetGender === "female" ? (isArabic ? "سارة" : "Sara") : (isArabic ? "أحمد" : "Ahmed"),
          gender: targetGender,
          lang,
        }),
      });
      const data = await res.json();
      setRoastResult(data.realityCheck || "");
    } catch {
      setRoastResult(
        isArabic
          ? (targetGender === "female"
              ? "يا الحبيبة، كسر الخزينة بيكلّفج ١٥٪ كرسوم طوارئ على تعبج. فكّري بهدفج وخليج قد التحدي!"
              : "يا الحبيب، كسر الخزينة بيكلّفك ١٥٪ كرسوم طوارئ على تعبك. فكّر بهدفك وخلك قد كلمتك!")
          : (targetGender === "female"
              ? "Wallah habibti, you'll burn a 15% emergency fee on your hard-earned savings. Put the card away and protect your goal!"
              : "Wallah bro, you'll burn a 15% emergency fee on your hard-earned savings. Put the card away and let your money grow!")
      );
    } finally {
      setRoastLoading(false);
    }
  };

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
      { rootMargin: "-25% 0px -35% 0px", threshold: 0.25 }
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

  const sectionPaddingStyle = {
    paddingTop: "clamp(64px, 8vw, 112px)",
    paddingBottom: "clamp(64px, 8vw, 112px)",
  };

  return (
    <div className="w-full text-ink overflow-x-clip selection:bg-lime selection:text-ink relative">
      {/* ─── Continuous Background with Soft Warm Radial Glow behind Hero & CTA ─── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[700px] pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(circle at 60% 30%, rgba(255, 244, 227, 0.75) 0%, rgba(246, 242, 255, 0) 70%)",
        }}
      />
      <div
        className="absolute bottom-[200px] left-1/2 -translate-x-1/2 w-full max-w-[1100px] h-[600px] pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255, 244, 227, 0.6) 0%, rgba(246, 242, 255, 0) 70%)",
        }}
      />

      {/* ─── 1. HERO SECTION ─── */}
      <section
        className="relative w-full overflow-hidden"
        style={{ paddingTop: "clamp(32px, 5vw, 64px)", paddingBottom: "clamp(48px, 7vw, 88px)" }}
      >
        {/* Full-width 3D Canvas Background Layer behind text */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
          <VaultContainer
            isRTL={isArabic}
            onVaultClick={handleVaultClick}
            spinTrigger={vaultSpinTrigger}
          />
        </div>

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
            {/* Start Column: Headline, Sticker, Sub, CTAs */}
            <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-start relative z-10 pointer-events-auto">
              {/* Rotated Sticker above Headline */}
              <div className="inline-block transform -rotate-2 hover:rotate-0 transition-transform">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lime border-2 border-ink shadow-[2px_2px_0_var(--ink)] text-sm font-bold text-ink">
                  <span>{t("landing.sticker")}</span>
                </span>
              </div>

              {/* H1 Headline: Plain ink text (clean, no dynamic inversion mask) */}
              <h1 className="text-[40px] sm:text-6xl lg:text-[72px] font-extrabold tracking-tight leading-[1.06] text-ink font-heading">
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
                  href={user ? "/dashboard" : "/signup"}
                  className="btn-hard w-full sm:w-auto bg-lime text-ink font-extrabold text-base sm:text-lg px-8 py-4 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {user
                      ? isArabic
                        ? "لوحة التحكم"
                        : "Go to Dashboard"
                      : t("landing.ctaStart")}
                  </span>
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

              {/* Works with existing card note */}
              <p className="text-sm font-medium text-muted">
                {t("landing.worksWithCard")}
              </p>
            </div>

            {/* End Column: 3D Vault with 3 Floating Bobbing HTML Stickers */}
            <div
              id="vault-3d-anchor"
              className="w-full lg:w-1/2 flex items-center justify-center relative min-h-[220px] sm:min-h-[340px] lg:min-h-[460px] overflow-visible pointer-events-auto"
            >
              {/* Interactive Click Target on Vault to spin wheel */}
              <button
                type="button"
                onClick={handleVaultClick}
                className="w-[140px] sm:w-[300px] lg:w-[360px] h-[140px] sm:h-[300px] lg:h-[360px] rounded-full cursor-pointer focus:outline-none focus:ring-0 active:scale-95 transition-transform"
                aria-label="Spin the vault wheel"
              />

              {/* Sticker A: Lime (+25 KWD locked) - outer band top-start: 4% / 4% */}
              <div
                id="hero-sticker-locked"
                className={`absolute z-20 animate-sticker-bob-1 pointer-events-none transition-transform duration-300 ${
                  stickersPulsing ? "scale-110" : ""
                }`}
                style={{ top: "4%", insetInlineStart: "4%", "--rot": "-3deg" } as React.CSSProperties}
              >
                <div className="px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-lime border-2 border-ink shadow-[3px_3px_0_var(--ink)] flex items-center gap-1.5 text-xs sm:text-sm font-bold text-ink select-none whitespace-nowrap">
                  <Lock className="w-3.5 h-3.5 text-ink shrink-0" />
                  <span>{t("landing.stickerLocked")}</span>
                </div>
              </div>

              {/* Sticker B: Coral (Ahmed said no) - outer band end side lower: 84% / -6% */}
              <div
                id="hero-sticker-no"
                className={`absolute z-20 animate-sticker-bob-2 pointer-events-none transition-transform duration-300 ${
                  stickersPulsing ? "scale-110" : ""
                }`}
                style={{ top: "84%", insetInlineEnd: "-6%", "--rot": "2.5deg" } as React.CSSProperties}
              >
                <div className="px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-coral border-2 border-ink shadow-[3px_3px_0_var(--ink)] flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white select-none whitespace-nowrap">
                  <Shield className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>{t("landing.stickerFahadNo")}</span>
                </div>
              </div>

              {/* Sticker C: Sun (18-day streak) - outer band bottom-start: 2% / 8% */}
              <div
                id="hero-sticker-streak"
                className={`absolute z-20 animate-sticker-bob-3 pointer-events-none transition-transform duration-300 ${
                  stickersPulsing ? "scale-110" : ""
                }`}
                style={{ bottom: "2%", insetInlineStart: "8%", "--rot": "-2deg" } as React.CSSProperties}
              >
                <div className="px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-sun border-2 border-ink shadow-[3px_3px_0_var(--ink)] flex items-center gap-1.5 text-xs sm:text-sm font-bold text-ink select-none whitespace-nowrap">
                  <Flame className="w-3.5 h-3.5 text-ink shrink-0" />
                  <span>{t("landing.stickerStreak")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. GOALS MARQUEE (Full-Bleed Moment) ─── */}
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

      {/* ─── 3. HOW IT WORKS SECTION (Sticky Mini Vault) ─── */}
      <section
        id="how-it-works"
        className="px-4 sm:px-6 max-w-[1100px] mx-auto scroll-mt-24"
        style={sectionPaddingStyle}
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
          {/* Start Side: Sticky Mini Vault Graphic (Pinned at vertical center for entire section) */}
          <div className="sticky top-[22%] self-start w-full flex items-center justify-center">
            <MiniVaultGraphic step={activeStep} isArabic={isArabic} />
          </div>

          {/* End Side: 3 Big Steps Stacked Vertically with Different Heights & Colors */}
          <div className="space-y-32 py-12">
            {/* Step 1: Lime Accent Card */}
            <div
              ref={step1Ref}
              className={`card-hard p-8 sm:p-10 min-h-[220px] transition-all duration-300 bg-lime text-ink border-2 border-ink ${
                activeStep === 1
                  ? "scale-100 opacity-100 shadow-[6px_6px_0_var(--ink)]"
                  : "scale-[0.96] opacity-70 shadow-[2px_2px_0_var(--ink)]"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-surface border-2 border-ink flex items-center justify-center font-extrabold text-xl text-ink mb-6 shadow-[2px_2px_0_var(--ink)]">
                1
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-ink mb-3 font-heading">
                {t("landing.step1Title")}
              </h3>
              <p className="text-base sm:text-lg text-ink/90 leading-relaxed font-medium">
                {t("landing.step1Desc")}
              </p>
            </div>

            {/* Step 2: Violet Accent Card (Taller height min-h-[290px]) */}
            <div
              ref={step2Ref}
              className={`card-hard p-10 sm:p-14 min-h-[290px] transition-all duration-300 bg-violet text-white border-2 border-ink ${
                activeStep === 2
                  ? "scale-100 opacity-100 shadow-[6px_6px_0_var(--ink)]"
                  : "scale-[0.96] opacity-70 shadow-[2px_2px_0_var(--ink)]"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-lime border-2 border-ink flex items-center justify-center font-extrabold text-xl text-ink mb-6 shadow-[2px_2px_0_var(--ink)]">
                2
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 font-heading text-white">
                {t("landing.step2Title")}
              </h3>
              <p className="text-base sm:text-lg text-white/90 leading-relaxed font-medium">
                {t("landing.step2Desc")}
              </p>
            </div>

            {/* Step 3: Coral Accent Card (min-h-[250px]) */}
            <div
              ref={step3Ref}
              className={`card-hard p-8 sm:p-11 min-h-[250px] transition-all duration-300 bg-coral text-ink border-2 border-ink ${
                activeStep === 3
                  ? "scale-100 opacity-100 shadow-[6px_6px_0_var(--ink)]"
                  : "scale-[0.96] opacity-70 shadow-[2px_2px_0_var(--ink)]"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-surface border-2 border-ink flex items-center justify-center font-extrabold text-xl text-ink mb-6 shadow-[2px_2px_0_var(--ink)]">
                3
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-ink mb-3 font-heading">
                {t("landing.step3Title")}
              </h3>
              <p className="text-base sm:text-lg text-ink/90 leading-relaxed font-medium">
                {t("landing.step3Desc")}
              </p>
            </div>
          </div>
        </div>

        {/* Phone Vertical Stack (< 1024px) */}
        <div className="grid lg:hidden grid-cols-1 gap-6">
          {/* Mobile Step 1 */}
          <div className="card-hard bg-lime text-ink p-6 sm:p-8 space-y-4 border-2 border-ink shadow-[4px_4px_0_var(--ink)]">
            <div className="w-10 h-10 rounded-xl bg-surface border-2 border-ink flex items-center justify-center font-extrabold text-lg text-ink shadow-[2px_2px_0_var(--ink)]">
              1
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-ink font-heading">
              {t("landing.step1Title")}
            </h3>
            <p className="text-sm sm:text-base text-ink/90 leading-relaxed font-medium">
              {t("landing.step1Desc")}
            </p>
          </div>

          {/* Mobile Step 2 */}
          <div className="card-hard bg-violet text-white p-7 sm:p-9 space-y-4 border-2 border-ink shadow-[4px_4px_0_var(--ink)]">
            <div className="w-10 h-10 rounded-xl bg-lime border-2 border-ink flex items-center justify-center font-extrabold text-lg text-ink shadow-[2px_2px_0_var(--ink)]">
              2
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
              {t("landing.step2Title")}
            </h3>
            <p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium">
              {t("landing.step2Desc")}
            </p>
          </div>

          {/* Mobile Step 3 */}
          <div className="card-hard bg-coral text-ink p-6 sm:p-8 space-y-4 border-2 border-ink shadow-[4px_4px_0_var(--ink)]">
            <div className="w-10 h-10 rounded-xl bg-surface border-2 border-ink flex items-center justify-center font-extrabold text-lg text-ink shadow-[2px_2px_0_var(--ink)]">
              3
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-ink font-heading">
              {t("landing.step3Title")}
            </h3>
            <p className="text-sm sm:text-base text-ink/90 leading-relaxed font-medium">
              {t("landing.step3Desc")}
            </p>
          </div>
        </div>
      </section>

      {/* ─── 4. FRIEND APPROVAL MOMENT (EMOTIONAL CORE) ─── */}
      <section
        id="friend-approval"
        className="px-4 sm:px-6 max-w-[1100px] mx-auto scroll-mt-24"
        style={sectionPaddingStyle}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Start Column: Story & Explanation */}
          <div className="space-y-6 text-center lg:text-start">
            <div className="inline-block transform -rotate-1">
              <span className="px-3.5 py-1 rounded-full bg-sun border-2 border-ink shadow-[2px_2px_0_var(--ink)] text-xs font-bold text-ink">
                {isArabic ? "موافقة الربع" : "Friend approval"}
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-ink tracking-tight font-heading leading-tight">
              {t("landing.approvalHeading")}
            </h2>

            {/* List with real Lucide Check icons in small lime circles */}
            <div className="space-y-4 text-base sm:text-lg text-muted font-medium leading-relaxed">
              <div className="flex items-start gap-3.5 text-start">
                <span className="w-6 h-6 rounded-full bg-lime border-2 border-ink flex items-center justify-center shrink-0 mt-0.5 shadow-[1px_1px_0_var(--ink)]">
                  <Check className="w-3.5 h-3.5 text-ink stroke-[3]" />
                </span>
                <span>{t("landing.approvalStory1")}</span>
              </div>
              <div className="flex items-start gap-3.5 text-start">
                <span className="w-6 h-6 rounded-full bg-lime border-2 border-ink flex items-center justify-center shrink-0 mt-0.5 shadow-[1px_1px_0_var(--ink)]">
                  <Check className="w-3.5 h-3.5 text-ink stroke-[3]" />
                </span>
                <span>{t("landing.approvalStory2")}</span>
              </div>
              <div className="flex items-start gap-3.5 text-start">
                <span className="w-6 h-6 rounded-full bg-lime border-2 border-ink flex items-center justify-center shrink-0 mt-0.5 shadow-[1px_1px_0_var(--ink)]">
                  <Check className="w-3.5 h-3.5 text-ink stroke-[3]" />
                </span>
                <span>{t("landing.approvalStory3")}</span>
              </div>
            </div>
          </div>

          {/* End Column: Interactive Phone Mockup (HTML/CSS, 2px ink border, rounded 40px) */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[380px] bg-surface border-2 border-ink rounded-[40px] shadow-[6px_6px_0_var(--ink)] p-5 sm:p-6 space-y-5 select-none relative">
              {/* Phone Notch/Island */}
              <div className="w-28 h-4 bg-ink rounded-full mx-auto" />

              {/* Inside Phone: Ahmed's Notification Card */}
              <div className="card-hard bg-bg p-4 space-y-4">
                {/* Header with Circular Avatar "A" for Ahmed */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-violet text-white border-2 border-ink flex items-center justify-center font-extrabold text-sm shadow-[1px_1px_0_var(--ink)] shrink-0">
                      A
                    </div>
                    <div>
                      <div className="text-xs font-bold text-ink">
                        {isArabic ? "أحمد المطوع" : "Ahmed Al-Mutawa"}
                      </div>
                      <div className="text-xs text-muted">
                        {isArabic ? "حامل المفتاح" : "Keyholder"}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">
                    {isArabic ? "طلب كسر" : "Break Request"}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-extrabold text-ink">
                    {t("landing.mockupUser")}
                  </div>
                  {/* Amount shown ONCE inside phone card */}
                  <div className="text-2xl font-extrabold text-ink font-heading">
                    {t("landing.mockupAmount")}
                  </div>
                </div>

                {/* Stated Excuse Quote Box */}
                <div className="p-3 rounded-2xl bg-surface border-2 border-ink space-y-1">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider">
                    {isArabic ? "العذر المكتوب:" : "Stated Excuse:"}
                  </div>
                  <blockquote dir="auto" className="text-xs sm:text-sm font-semibold text-ink italic">
                    <bdi>&ldquo;{t("landing.mockupExcuse")}&rdquo;</bdi>
                  </blockquote>
                </div>

                {/* Quick heads-up Note (Does NOT tell him what to choose) */}
                <div className="p-2.5 rounded-xl bg-surface/80 border border-ink/20 text-xs font-medium text-muted space-y-0.5">
                  <div className="font-bold text-ink">
                    {t("landing.quickHeadsUp")}
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

      {/* ─── 4.5 THE TWO RULES (5% Friend Approval vs 15% Emergency Self-Break) ─── */}
      <section
        id="unlock-rules"
        className="px-4 sm:px-6 max-w-[1100px] mx-auto scroll-mt-24"
        style={sectionPaddingStyle}
      >
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-block transform rotate-1 mb-1">
            <span className="px-3.5 py-1 rounded-full bg-lime border-2 border-ink shadow-[2px_2px_0_var(--ink)] text-xs font-bold text-ink">
              {t("landing.rulesTag")}
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-ink font-heading tracking-tight leading-tight">
            {t("landing.rulesHeading")}
          </h2>
          <p className="text-base sm:text-lg text-muted font-medium">
            {t("landing.rulesSub")}
          </p>
        </div>

        {/* 2-Column Side-by-Side Neobrutalist Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Path A: 5% Friend Approval */}
          <div className="card-hard bg-surface p-7 sm:p-9 border-2 border-ink shadow-[6px_6px_0_var(--ink)] rounded-[28px] flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-lime border-2 border-ink shadow-[2px_2px_0_var(--ink)] text-xs font-extrabold text-ink">
                  {t("landing.ruleFriendBadge")}
                </span>
                <span className="text-xs font-bold text-muted uppercase tracking-wider">
                  {isArabic ? "مع الرفيق" : "With a friend"}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-ink font-heading">
                  {t("landing.ruleFriendTitle", { fee: FRIEND_FEE_PCT })}
                </h3>
                <div className="text-end">
                  <div className="text-3xl sm:text-4xl font-extrabold text-ink font-heading">
                    {t("landing.ruleFriendRate", { fee: FRIEND_FEE_PCT })}
                  </div>
                  <div className="text-xs font-bold text-muted">
                    {t("landing.ruleFriendRateLabel")}
                  </div>
                </div>
              </div>

              <p className="text-base text-muted font-medium leading-relaxed">
                {t("landing.ruleFriendDesc", { fee: FRIEND_FEE_PCT, keep: FRIEND_RETURN_PCT })}
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm font-semibold text-ink">
                  <span className="w-5 h-5 rounded-full bg-lime border border-ink flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-ink stroke-[3]" />
                  </span>
                  <span>{t("landing.ruleFriendBullet1", { keep: FRIEND_RETURN_PCT })}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold text-ink">
                  <span className="w-5 h-5 rounded-full bg-lime border border-ink flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-ink stroke-[3]" />
                  </span>
                  <span>{t("landing.ruleFriendBullet2")}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold text-ink">
                  <span className="w-5 h-5 rounded-full bg-lime border border-ink flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-ink stroke-[3]" />
                  </span>
                  <span>{t("landing.ruleFriendBullet3")}</span>
                </div>
              </div>
            </div>

            {/* Micro Outcome Box */}
            <div className="p-3.5 rounded-2xl bg-lime/25 border-2 border-ink text-xs font-bold text-ink flex items-center justify-between">
              <span>{isArabic ? "على ١٠٠ د.ك توفير:" : "On 100 KWD savings:"}</span>
              <span className="text-ink font-extrabold bg-lime px-2 py-0.5 rounded-md border border-ink">
                {isArabic ? "تسترجع ٩٥ د.ك (٥ د.ك رسوم)" : "Keep 95 KWD (5 KWD fee)"}
              </span>
            </div>
          </div>

          {/* Path B: 15% Emergency Self-Break */}
          <div className="card-hard bg-[#FFF0F3] p-7 sm:p-9 border-2 border-ink shadow-[6px_6px_0_var(--ink)] rounded-[28px] flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-coral border-2 border-ink shadow-[2px_2px_0_var(--ink)] text-xs font-extrabold text-white">
                  {t("landing.ruleSelfBadge")}
                </span>
                <span className="text-xs font-bold text-coral uppercase tracking-wider">
                  {isArabic ? "بنفسك" : "On your own"}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-ink font-heading">
                  {t("landing.ruleSelfTitle", { fee: SOLO_FEE_PCT })}
                </h3>
                <div className="text-end">
                  <div className="text-3xl sm:text-4xl font-extrabold text-coral font-heading">
                    {t("landing.ruleSelfRate", { fee: SOLO_FEE_PCT })}
                  </div>
                  <div className="text-xs font-bold text-muted">
                    {t("landing.ruleSelfRateLabel")}
                  </div>
                </div>
              </div>

              <p className="text-base text-muted font-medium leading-relaxed">
                {t("landing.ruleSelfDesc", { fee: SOLO_FEE_PCT })}
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm font-semibold text-ink">
                  <span className="w-5 h-5 rounded-full bg-coral border border-ink flex items-center justify-center shrink-0 text-white">
                    <Flame className="w-3.5 h-3.5" />
                  </span>
                  <span>{t("landing.ruleSelfBullet1")}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold text-ink">
                  <span className="w-5 h-5 rounded-full bg-coral border border-ink flex items-center justify-center shrink-0 text-white">
                    <Flame className="w-3.5 h-3.5" />
                  </span>
                  <span>{t("landing.ruleSelfBullet2", { fee: SOLO_FEE_PCT })}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold text-ink">
                  <span className="w-5 h-5 rounded-full bg-coral border border-ink flex items-center justify-center shrink-0 text-white">
                    <Flame className="w-3.5 h-3.5" />
                  </span>
                  <span>{t("landing.ruleSelfBullet3")}</span>
                </div>
              </div>
            </div>

            {/* Micro Outcome Box */}
            <div className="p-3.5 rounded-2xl bg-coral/20 border-2 border-ink text-xs font-bold text-ink flex items-center justify-between">
              <span>{isArabic ? "على ١٠٠ د.ك توفير:" : "On 100 KWD savings:"}</span>
              <span className="text-white font-extrabold bg-coral px-2 py-0.5 rounded-md border border-ink">
                {isArabic ? "تسترجع ٨٥ د.ك (١٥ د.ك رسوم)" : "Keep 85 KWD (15 KWD fee)"}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Banner Comparison */}
        <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-ink text-white border-2 border-ink shadow-[4px_4px_0_var(--ink)] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime text-ink border border-ink flex items-center justify-center font-extrabold shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <p className="text-sm sm:text-base font-bold text-white">
              {t("landing.rulesComparisonNote")}{" "}
              <span className="text-lime">{t("landing.rulesComparisonFriend")}</span> /{" "}
              <span className="text-coral">{t("landing.rulesComparisonSelf")}</span>
            </p>
          </div>
          <Link
            href="/signup"
            className="btn-hard bg-lime text-ink font-bold text-sm px-5 py-2.5 shrink-0 inline-flex items-center gap-2"
          >
            <span>{t("landing.ctaStart")}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>
      </section>

      {/* ─── 4.75 AI REALITY CHECK PREVIEW (Interactive Roaster) ─── */}
      <section
        id="reality-check-preview"
        className="px-4 sm:px-6 max-w-[1100px] mx-auto scroll-mt-24"
        style={sectionPaddingStyle}
      >
        <div className="card-hard bg-surface p-8 sm:p-12 border-2 border-ink shadow-[6px_6px_0_var(--ink)] rounded-[32px] space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-block transform -rotate-1">
              <span className="px-3.5 py-1 rounded-full bg-sun border-2 border-ink shadow-[2px_2px_0_var(--ink)] text-xs font-bold text-ink">
                {t("landing.roasterBadge")}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-ink font-heading tracking-tight">
              {t("landing.roasterHeading")}
            </h2>
            <p className="text-base sm:text-lg text-muted font-medium">
              {t("landing.roasterSub")}
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {/* Persona Switcher (Her vs Him) */}
            <div className="flex items-center justify-center gap-2 pb-1">
              <span className="text-xs font-bold text-muted me-2">
                {isArabic ? "لمن المراجعة؟" : "Audience:"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setRoastGender("female");
                  setRoastExcuse("");
                  setRoastResult("");
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-black border-2 border-ink transition-all cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0_var(--ink)] ${
                  roastGender === "female"
                    ? "bg-violet text-white scale-105"
                    : "bg-surface text-ink hover:bg-bg"
                }`}
              >
                <span>👩</span>
                <span>{isArabic ? "بنات / For Her" : "For Her (Girls)"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoastGender("male");
                  setRoastExcuse("");
                  setRoastResult("");
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-black border-2 border-ink transition-all cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0_var(--ink)] ${
                  roastGender === "male"
                    ? "bg-lime text-ink scale-105"
                    : "bg-surface text-ink hover:bg-bg"
                }`}
              >
                <span>👨</span>
                <span>{isArabic ? "شباب / For Him" : "For Him (Guys)"}</span>
              </button>
            </div>

            {/* Quick-Pick Inspiration Chips */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="text-xs font-bold text-muted me-1">
                {isArabic ? "أعذار شائعة:" : "Popular excuses:"}
              </span>
              {(roastGender === "female"
                ? isArabic
                  ? ["كولكشن عبايات ليمتد", "عطورات وميك أب دروب", "عشا وماتشا مع البنات", "تنزيلات الأفنيوز"]
                  : [
                      "Limited abaya collection",
                      "Luxury perfume & makeup drop",
                      "Matcha & dinner with girls",
                      "The Avenues flash sale",
                    ]
                : isArabic
                ? ["سنيكر ليمتد بمجمع ٣٦٠", "ويكند شاليه مع الربع", "نزل آيفون جديد اليوم", "ساعة ليمتد"]
                : [
                    "Flash sneaker drop at 360 Mall",
                    "Chalet weekend with the boys",
                    "New iPhone just dropped",
                    "Limited edition watch",
                  ]
              ).map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setRoastExcuse(chip);
                    handleFetchLandingRoast(chip, roastGender);
                  }}
                  className="px-3 py-1 rounded-full bg-bg hover:bg-lime border border-ink text-xs font-bold text-ink transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Interactive Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleFetchLandingRoast();
              }}
              className="flex flex-col sm:flex-row items-stretch gap-3 pt-2"
            >
              <input
                type="text"
                value={roastExcuse}
                onChange={(e) => setRoastExcuse(e.target.value)}
                placeholder={
                  roastGender === "female"
                    ? isArabic
                      ? "مثال: بطلب عطر ليمتد نزل اليوم، أو طلعة مطعم مع البنات..."
                      : "e.g. Limited perfume drop, or dinner with the girls..."
                    : isArabic
                    ? "مثال: سنيكر ليمتد بمجمع ٣٦٠، أو حجزت شاليه مع الربع..."
                    : "e.g. Flash sneaker drop at 360 Mall, or chalet trip..."
                }
                enterKeyHint="send"
                className="input-hard flex-1 text-sm sm:text-base py-3.5 px-4 bg-bg focus:bg-surface"
              />
              <button
                type="submit"
                disabled={!roastExcuse.trim() || roastLoading}
                className="btn-hard bg-coral text-white font-extrabold text-sm sm:text-base px-6 py-3.5 flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {roastLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t("landing.roasterLoading")}</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4" />
                    <span>{t("landing.roasterBtn")}</span>
                  </>
                )}
              </button>
            </form>

            {/* Generated Roast Box addressing user in 2nd person */}
            {roastResult && (
              <div
                id="landing-roast-output"
                className="mt-6 p-6 rounded-2xl bg-coral/10 border-2 border-coral shadow-[4px_4px_0_var(--ink)] space-y-3 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-coral uppercase tracking-wider">
                    <Flame className="w-4 h-4 text-coral" />
                    <span>{isArabic ? "الفزعة الصريحة" : "The Reality Check"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRoastResult("");
                      setRoastExcuse("");
                    }}
                    className="text-xs font-bold text-muted hover:text-ink underline cursor-pointer"
                  >
                    {t("landing.roasterTryAnother")}
                  </button>
                </div>

                <blockquote
                  dir="auto"
                  className="text-base sm:text-lg font-bold text-ink italic leading-relaxed"
                >
                  <bdi>&ldquo;{roastResult.replace(/^["“\s]+|["”\s]+$/g, "")}&rdquo;</bdi>
                </blockquote>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── 5. WHY TIJORI (BENTO GRID) ─── */}
      <section
        id="why-tijori"
        className="px-4 sm:px-6 max-w-[1100px] mx-auto scroll-mt-24"
        style={sectionPaddingStyle}
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

      {/* ─── 6. FINAL CTA SECTION (Full Bleed Moment) ─── */}
      <section
        className="px-4 sm:px-6 max-w-[1100px] mx-auto pb-12 sm:pb-16"
        style={{ paddingTop: "clamp(32px, 5vw, 64px)" }}
      >
        <div className="card-hard-lg bg-violet text-white p-10 sm:p-16 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-heading tracking-tight">
            {t("landing.finalCtaHeading")}
          </h2>

          <p className="text-base sm:text-lg opacity-90 max-w-xl mx-auto font-medium">
            {t("landing.finalCtaSub")}
          </p>

          <div className="pt-4 flex justify-center">
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="btn-hard bg-lime text-ink font-extrabold text-lg px-8 py-4 inline-flex items-center gap-2 cursor-pointer shadow-[4px_4px_0_var(--ink)]"
            >
              <span>
                {user
                  ? isArabic
                    ? "لوحة التحكم"
                    : "Go to Dashboard"
                  : t("landing.finalCtaButton")}
              </span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
