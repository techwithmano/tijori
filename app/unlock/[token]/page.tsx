"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Lock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  Flame,
  Clock,
  ExternalLink,
} from "lucide-react";
import { formatKWD } from "@/lib/utils";
import GoalTitle from "@/components/GoalTitle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BrandLogo from "@/components/BrandLogo";
import { useT } from "@/lib/i18n";

interface VaultData {
  _id: string;
  title: string;
  targetAmount: number;
  currentBalance: number;
  pullAmount: number;
  cadence: string;
  streakCount: number;
  denialsCount?: number;
  status: "LOCKED" | "UNLOCK_PENDING" | "UNLOCKED";
  keyholder: {
    name: string;
    phone: string;
    relationship: string;
  };
  unlockReason?: string;
  breakExcuse?: string;
  realityCheck?: string;
  unlockToken?: string | null;
  totalProtected?: number;
}

export default function KeyholderTokenUnlockPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const unwrappedParams = use(params);
  const token = unwrappedParams.token;
  const { lang } = useT();

  const [vault, setVault] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyUsed, setAlreadyUsed] = useState(false);
  const [processingAction, setProcessingAction] = useState<"APPROVE" | "DENY" | null>(null);
  const [decisionRecorded, setDecisionRecorded] = useState<"APPROVE" | "DENY" | null>(null);

  useEffect(() => {
    async function fetchVault() {
      try {
        setLoading(true);
        const res = await fetch(`/api/unlock/${token}`);
        const data = await res.json();
        if (data.success && data.vault) {
          setVault(data.vault);
        } else {
          setAlreadyUsed(true);
        }
      } catch {
        setAlreadyUsed(true);
      } finally {
        setLoading(false);
      }
    }
    fetchVault();
  }, [token]);

  const handleDecision = async (action: "APPROVE" | "DENY") => {
    if (!vault || processingAction) return;
    try {
      setProcessingAction(action);
      const res = await fetch(`/api/unlock/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setDecisionRecorded(action);
        if (action === "DENY") {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#3DFFB0", "#C6FF3D", "#7C5CFF", "#FFFFFF"],
          });
        }
      } else {
        setAlreadyUsed(true);
      }
    } catch {
      alert("Network error processing decision.");
    } finally {
      setProcessingAction(null);
    }
  };

  const isArabic = lang === "ar";
  const guardianFirstName = vault?.keyholder?.name ? vault.keyholder.name.split(" ")[0] : (isArabic ? "فهد" : "Fahad");
  const applicantName = isArabic ? "عبدالرحمن" : "Abdulrahman";

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-3 border-line border-t-accent animate-spin" />
        <p className="mt-4 text-xs font-mono text-muted">
          {isArabic ? "جاري التحقق من رابط الحماية..." : "Verifying clearance link..."}
        </p>
      </div>
    );
  }

  // 2. Link Already Used or Expired
  if (alreadyUsed || !vault) {
    return (
      <div className="min-h-screen bg-bg text-text flex flex-col">
        {/* Single-line Header without overflow */}
        <header className="border-b border-line bg-surface/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
          <BrandLogo href="/" size="sm" showTagline={false} />
          <LanguageSwitcher />
        </header>

        <main className="flex-1 max-w-[390px] w-full mx-auto p-4 sm:p-6 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-raised border border-line flex items-center justify-center mb-4 text-muted shadow-violetSubtle">
            <ShieldCheck className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-xl font-black text-text mb-2">
            {isArabic ? "تم استخدام هذا الرابط مسبقاً" : "This link was already used"}
          </h1>
          <p className="text-xs text-muted leading-relaxed mb-6">
            {isArabic
              ? "تم تسجيل القرار في هذا الرابط الفردي بالفعل. يتم حرق الروابط لمرة واحدة فور استخدامها لحماية مدخراتك من التكرار."
              : "A decision has already been executed for this clearance request. Single-use links are permanently burned to protect savings."}
          </p>
          <Link
            href="/"
            className="tactile-btn inline-flex items-center gap-2 px-6 py-3 rounded-btn bg-surface hover:bg-raised border border-line text-xs font-bold text-text hover:text-accent transition-colors"
          >
            <span>{isArabic ? "الرجوع لمنصة تِجوري" : "Return to Tijori"}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </main>
      </div>
    );
  }

  // 3. Decision Recorded Screen
  if (decisionRecorded) {
    const isDeny = decisionRecorded === "DENY";
    return (
      <div className="min-h-screen bg-bg text-text flex flex-col">
        <header className="border-b border-line bg-surface/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-surface border border-line flex items-center justify-center shadow-violetSubtle">
              <Lock className="w-4 h-4 text-accent" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-text">Tijori</span>
          </Link>
          <LanguageSwitcher />
        </header>

        <main className="flex-1 max-w-[390px] w-full mx-auto p-4 sm:p-6 flex flex-col justify-center items-center text-center space-y-6">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center border ${
              isDeny
                ? "bg-[#3DFFB0]/15 border-[#3DFFB0]/40 text-[#3DFFB0] shadow-limeGlow"
                : "bg-coral/15 border-coral/40 text-coral"
            }`}
          >
            {isDeny ? <ShieldCheck className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-text">
              {isDeny
                ? isArabic ? "كفو! تم حفظ المدخرات" : "Vault Kept Locked!"
                : isArabic ? "تم تأكيد فك الخزينة" : "Break Approved"}
            </h1>
            <p className="text-xs text-muted leading-relaxed">
              {isDeny
                ? isArabic
                  ? `أحسنت التصرف! تم رفض كسر الخزينة بنجاح، ومدخرات ${applicantName} (${formatKWD(vault.currentBalance)} د.ك) لا زالت بأمان وسلسلة التزامه مستمرة.`
                  : `Hero move! You blocked the impulse break. ${applicantName}'s savings (${formatKWD(vault.currentBalance)} KWD) remain 100% locked and his streak is alive.`
                : isArabic
                  ? `تم الإفراج عن المبلغ بعد خصم 5% رسوم التزام، وإرسال الاسترداد عبر Stripe.`
                  : `Vault broken. Payout issued (minus 5% discipline fee) via Stripe refund.`}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface border border-line text-xs text-muted w-full font-mono">
            {isArabic
              ? "تم حرق الرابط بنجاح ولا يمكن إعادة استخدامه."
              : "Single-use authorization token has been burned."}
          </div>

          <Link
            href="/"
            className="tactile-btn inline-flex items-center gap-2 px-6 py-3 rounded-btn bg-surface hover:bg-raised border border-line text-xs font-bold text-text hover:text-accent transition-colors"
          >
            <span>{isArabic ? "الرجوع للرئيسية" : "Return to Home"}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </main>
      </div>
    );
  }

  // 4. Main Clearance Decision View (Mobile-First 390px, Zero Header Overflow)
  const excuseText = vault.unlockReason || vault.breakExcuse || (isArabic ? "رغبة شراء لحظية" : "Impulse purchase urge");
  const streak = vault.streakCount || 0;
  const denials = vault.denialsCount || 0;

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col selection:bg-accent/20 selection:text-accent">
      {/* Single-line Header with NO overflow */}
      <header className="border-b border-line bg-surface/90 backdrop-blur-md px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <BrandLogo href="/" size="sm" showTagline={false} />
        <LanguageSwitcher />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[390px] w-full mx-auto p-4 sm:p-5 space-y-4">
        {/* Headline */}
        <div className="text-start space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-coral/10 border border-coral/30 text-coral text-xs font-bold">
            <ShieldAlert className="w-3 h-3" />
            <span>{isArabic ? "طلب كسر معلّق" : "Clearance Request"}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-text tracking-tight leading-snug">
            {isArabic
              ? `${guardianFirstName}، ${applicantName} يبي يكسر تِجوريه.`
              : `${guardianFirstName}, ${applicantName} wants to break his vault.`}
          </h1>
        </div>

        {/* Goal & Amount at Stake Card */}
        <div className="bg-surface border border-line rounded-card p-4 space-y-3 shadow-card">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{isArabic ? "الهدف المحفوظ" : "Savings Goal"}</span>
            <span className="font-medium text-text">{vault.title}</span>
          </div>

          <div className="pt-1">
            <span className="text-xs text-muted block">{isArabic ? "المبلغ المعرض للكسر" : "Amount at stake"}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-text tabular-nums">
                {formatKWD(vault.currentBalance)}
              </span>
              <span className="text-sm font-bold text-accent">
                {isArabic ? "د.ك" : "KWD"}
              </span>
            </div>
          </div>
        </div>

        {/* User Excuse Quote Card with Bidi Isolation to prevent inverted quotation marks */}
        <div className="bg-raised border border-violet/30 rounded-card p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-bold text-[#E3DAFC]">
              {isArabic ? `عذر ${applicantName}:` : `${applicantName}'s stated excuse:`}
            </span>
            <span className="text-xs text-muted font-mono">
              {isArabic ? "مكتوب بخط يده" : "Applicant note"}
            </span>
          </div>
          <blockquote className="text-xs sm:text-sm font-semibold text-text italic leading-relaxed" dir="auto">
            <bdi>&ldquo;{excuseText}&rdquo;</bdi>
          </blockquote>
        </div>

        {/* Neutral AI Briefing Line (Fact-based, does NOT tell Fahad what to decide) */}
        <div className="p-3.5 rounded-2xl bg-surface border border-line space-y-1.5 shadow-sm text-start">
          <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>{isArabic ? "بيانات الذكاء المحايدة" : "Neutral AI Briefing"}</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            {isArabic
              ? `${applicantName} محافظ على سلسلة التزام لمدة ${streak} يوم، ولديه ${denials} محاولات كسر سابقة. القرار النهائي بيدك وحدك كرفيقه الموثوق.`
              : `${applicantName} has maintained an active ${streak}-day savings streak with ${denials} previous break attempts. The final decision rests entirely in your hands as his trusted friend.`}
          </p>
        </div>

        {/* Two Equal-Weight Big Buttons */}
        <div className="space-y-3 pt-2">
          {/* 1. Keep it locked (Consistent Signature Neon Lime) */}
          <button
            type="button"
            disabled={processingAction !== null}
            onClick={() => handleDecision("DENY")}
            className="tactile-btn w-full py-4 px-6 rounded-btn bg-accent text-accent-foreground font-extrabold text-sm sm:text-base shadow-limeGlow flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>
              {processingAction === "DENY"
                ? isArabic ? "جاري الحفظ..." : "Locking..."
                : isArabic ? "خله مقفول" : "Keep it locked"}
            </span>
          </button>

          {/* 2. Let him have it */}
          <button
            type="button"
            disabled={processingAction !== null}
            onClick={() => handleDecision("APPROVE")}
            className="w-full py-3.5 px-6 rounded-btn border border-coral/60 bg-coral/15 hover:bg-coral/25 text-coral font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>
              {processingAction === "APPROVE"
                ? isArabic ? "جاري الفتح..." : "Unlocking..."
                : isArabic ? "خلّه يصرف" : "Let him have it"}
            </span>
          </button>
        </div>

        {/* Small Discipline Fee Disclaimer */}
        <p className="text-xs text-muted text-center pt-1 leading-normal">
          {isArabic
            ? "في حال الموافقة يُخصم 5% رسوم انضباط ويُسترد 95%. في حال الرفض لا يُخصم أي فلس."
            : "If approved, a 5% discipline fee is deducted (95% refund). If locked, 0% is charged."}
        </p>
      </main>
    </div>
  );
}
