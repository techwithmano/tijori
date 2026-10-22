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
import { FRIEND_FEE_PCT, FRIEND_RETURN_PCT } from "@/lib/config";
import DecisionModal, { DecisionModalType } from "@/components/DecisionModal";

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
  const isArabic = lang === "ar";

  const [vault, setVault] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyUsed, setAlreadyUsed] = useState(false);
  const [processingAction, setProcessingAction] = useState<"APPROVE" | "DENY" | null>(null);
  const [decisionRecorded, setDecisionRecorded] = useState<"APPROVE" | "DENY" | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [sendingRecovery, setSendingRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  const handleForgotPin = async () => {
    try {
      setSendingRecovery(true);
      setPinError(null);
      const res = await fetch("/api/keyholder/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlockToken: token, lang: isArabic ? "ar" : "en" }),
      });
      const data = await res.json();
      if (data.success) {
        setRecoverySent(true);
      } else {
        setPinError(data.error || "Failed to send recovery email");
      }
    } catch (err: any) {
      setPinError(err.message || "Failed to send recovery email");
    } finally {
      setSendingRecovery(false);
    }
  };

  const [decisionModal, setDecisionModal] = useState<{
    isOpen: boolean;
    type?: DecisionModalType;
    title: string;
    badge?: string;
    description: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    hideCancel?: boolean;
    onConfirm?: () => Promise<void> | void;
  } | null>(null);

  useEffect(() => {
    async function fetchVault() {
      try {
        setLoading(true);
        if (token.startsWith("demo_")) {
          setVault({
            _id: "demo_vault_london_2026",
            title: isArabic ? "سفرة لندن 🇬🇧" : "London Summer Trip 🇬🇧",
            targetAmount: 500,
            currentBalance: 185,
            pullAmount: 25,
            cadence: "monthly",
            streakCount: 18,
            denialsCount: 2,
            status: "UNLOCK_PENDING",
            keyholder: {
              name: isArabic ? "أحمد (أخوي)" : "Ahmed (Brother)",
              phone: "+965 9988 7766",
              relationship: isArabic ? "أخ" : "Brother",
            },
            unlockReason: isArabic
              ? "شراء سنيكرز ترافيس سكوت من مجمع ٣٦٠ — إصدار محدود هذا الأسبوع!"
              : "Travis Scott sneaker drop at 360 Mall — limited release this weekend!",
            breakExcuse: isArabic
              ? "شراء سنيكرز ترافيس سكوت من مجمع ٣٦٠ — إصدار محدود هذا الأسبوع!"
              : "Travis Scott sneaker drop at 360 Mall — limited release this weekend!",
            realityCheck: isArabic
              ? "رغبة شراء لحظية ستكسر سلسلة التزامك المالي البالغة ١٨ يوماً وتخصم ٥٪ رسوم انضباط."
              : "Impulse buy urge that will reset your 18-day streak and deduct 5% penalty.",
            unlockToken: token,
          } as any);
          setLoading(false);
          return;
        }

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
  }, [token, isArabic]);

  const handleDecision = async (action: "APPROVE" | "DENY", pinCode?: string) => {
    if (!vault || processingAction) return;
    try {
      setProcessingAction(action);
      setPinError(null);

      if (token.startsWith("demo_")) {
        if (action === "APPROVE") {
          const checkPin = (pinCode || pin).trim();
          if (checkPin !== "123456") {
            setPinError(isArabic ? "الرمز غير صحيح. للتجربة استخدم: 123456" : "Invalid PIN. For demo, use: 123456");
            return;
          }
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#CFFF3A", "#6B4DFF", "#2DE0A5", "#FF6B6B"],
          });
        } else {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#CFFF3A", "#6B4DFF", "#2DE0A5", "#14102B"],
          });
        }
        setShowPinModal(false);
        setDecisionRecorded(action);
        return;
      }

      const res = await fetch(`/api/unlock/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, pin: pinCode || pin }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPinModal(false);
        setDecisionRecorded(action);
        if (action === "DENY") {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#CFFF3A", "#6B4DFF", "#2DE0A5", "#14102B"],
          });
        }
      } else {
        if (data.invalidPin) {
          setPinError(isArabic ? "الرمز غير صحيح. يرجى إدخال الرمز المكون من 6 أرقام." : "Invalid 6-digit PIN. Please try again.");
        } else {
          setAlreadyUsed(true);
        }
      }
    } catch {
      setDecisionModal({
        isOpen: true,
        type: "danger",
        badge: isArabic ? "خطأ في الشبكة" : "Network Error",
        title: isArabic ? "تعذر معالجة القرار" : "Processing Failed",
        description: isArabic
          ? "حدث خطأ أثناء معالجة قرارك، يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً."
          : "Network error processing decision. Please check your connection and try again.",
        hideCancel: true,
        confirmLabel: isArabic ? "إغلاق" : "Close",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const keyholderFirstName = vault?.keyholder?.name ? vault.keyholder.name.split(" ")[0] : (isArabic ? "يا رفيقي" : "Friend");
  const applicantName = (vault as any)?.applicantName || (isArabic ? "صاحبك" : "Your friend");

  const handleDenyClick = () => {
    setDecisionModal({
      isOpen: true,
      type: "discipline",
      badge: isArabic ? "حماية الانضباط المالي" : "Enforce Discipline",
      title: isArabic ? "تأكيد رفض طلب الكسر وإبقاء الخزينة مقفلة؟" : "Deny break request & keep vault locked?",
      description: isArabic
        ? `بصفتك حامل المفتاح الموثوق، فإن رفضك للطلب يحمي مدخرات ${applicantName} ويمنعه من كسر التزامه بهدفه (${vault?.title}). لن يتم خصم أي فلس.`
        : `As ${applicantName}'s trusted Keyholder, denying this request protects their locked savings and keeps their streak alive for "${vault?.title}". 0% will be charged.`,
      confirmLabel: isArabic ? "نعم، خله مقفول" : "Yes, Keep It Locked",
      cancelLabel: isArabic ? "تراجع" : "Cancel",
      onConfirm: async () => {
        setDecisionModal(null);
        await handleDecision("DENY");
      },
    });
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center p-4">
        <div className="card-hard bg-surface p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-ink border-t-lime animate-spin mx-auto" />
          <p className="text-sm font-bold text-ink">
            {isArabic ? "جاري التحقق من رابط الحماية..." : "Verifying unlock link..."}
          </p>
        </div>
      </div>
    );
  }

  // 2. Link Already Used or Expired
  if (alreadyUsed || !vault) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col pt-[calc(var(--nav-h)+24px)]">
        <main className="flex-1 max-w-[400px] w-full mx-auto p-4 sm:p-6 flex flex-col justify-center items-center text-center">
          <div className="card-hard bg-surface p-8 space-y-5 w-full">
            <div className="w-16 h-16 rounded-2xl bg-lime border-2 border-ink mx-auto flex items-center justify-center text-ink shadow-[2px_2px_0_var(--ink)]">
              <ShieldCheck className="w-8 h-8 text-ink" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink">
              {isArabic ? "تم استخدام هذا الرابط مسبقاً" : "This link was already used"}
            </h1>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {isArabic
                ? "تم تسجيل القرار في هذا الرابط الفردي بالفعل. يتم حرق الروابط لمرة واحدة فور استخدامها لحماية مدخراتك من التكرار."
                : "A decision has already been executed for this break request. Single-use links are permanently burned to protect savings."}
            </p>
            <Link
              href="/"
              className="btn-hard w-full bg-lime text-ink font-bold text-xs sm:text-sm py-3 inline-flex items-center justify-center gap-2"
            >
              <span>{isArabic ? "الرجوع لمنصة تِجوري" : "Return to Tijori"}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // 3. Decision Recorded Screen
  if (decisionRecorded) {
    const isDeny = decisionRecorded === "DENY";
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col pt-[calc(var(--nav-h)+24px)]">

        <main className="flex-1 max-w-[420px] w-full mx-auto p-4 sm:p-6 flex flex-col justify-center items-center text-center space-y-6">
          <div className="card-hard bg-surface p-8 space-y-6 w-full text-center">
            <div
              className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center border-2 border-ink shadow-[3px_3px_0_var(--ink)] ${
                isDeny
                  ? "bg-lime text-ink"
                  : "bg-coral text-white"
              }`}
            >
              {isDeny ? <ShieldCheck className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink font-heading">
                {isDeny
                  ? isArabic ? "كفو! تم حفظ المدخرات" : "Vault Kept Locked!"
                  : isArabic ? "تم تأكيد فك الخزينة" : "Break Approved"}
              </h1>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                {isDeny
                  ? isArabic
                    ? `أحسنت التصرف! تم رفض كسر الخزينة بنجاح، ومدخرات ${applicantName} (${formatKWD(vault.currentBalance)} د.ك) لا زالت بأمان وسلسلة التزامه مستمرة.`
                    : `Hero move! You blocked the impulse break. ${applicantName}'s savings (${formatKWD(vault.currentBalance)} KWD) remain 100% locked and his streak is alive.`
                  : isArabic
                    ? `تم الإفراج عن المبلغ بعد خصم ${FRIEND_FEE_PCT}% رسوم، وإرسال الاسترداد عبر Stripe.`
                    : `Vault broken. Payout issued (minus ${FRIEND_FEE_PCT}% fee) via Stripe refund.`}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-bg border-2 border-ink text-xs text-muted w-full font-bold">
              {isArabic
                ? "تم حرق الرابط بنجاح ولا يمكن إعادة استخدامه."
                : "Single-use authorization token has been burned."}
            </div>

            <Link
              href="/"
              className="btn-hard w-full bg-lime text-ink font-bold text-xs sm:text-sm py-3.5 inline-flex items-center justify-center gap-2"
            >
              <span>{isArabic ? "الرجوع للرئيسية" : "Return to Home"}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // 4. Main Decision View (Light Neobrutalism)
  const excuseText = vault.unlockReason || vault.breakExcuse || (isArabic ? "رغبة شراء لحظية" : "Impulse purchase urge");
  const streak = vault.streakCount || 0;
  const denials = vault.denialsCount || 0;

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col selection:bg-lime selection:text-ink pt-[calc(var(--nav-h)+24px)]">
      {/* Main Content Area */}
      <main className="flex-1 max-w-[420px] w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Headline */}
        <div className="text-start space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral text-white border-2 border-ink text-xs font-bold shadow-[2px_2px_0_var(--ink)]">
            <ShieldAlert className="w-3.5 h-3.5 text-white" />
            <span>{isArabic ? "طلب كسر معلّق" : "Break Request"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-heading leading-tight">
            {isArabic
              ? `${keyholderFirstName}، ${applicantName} يبي يكسر تِجوريه.`
              : `${keyholderFirstName}, ${applicantName} wants to break his vault.`}
          </h1>
        </div>

        {/* Goal & Amount at Stake Card */}
        <div className="card-hard bg-surface p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-muted">
            <span>{isArabic ? "الهدف المحفوظ" : "Savings Goal"}</span>
            <span className="text-ink">{vault.title}</span>
          </div>

          <div className="pt-1">
            <span className="text-xs font-bold text-muted block">{isArabic ? "المبلغ المعرض للكسر" : "Amount at stake"}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink tabular-nums font-heading">
                {formatKWD(vault.currentBalance)}
              </span>
              <span className="text-sm font-bold text-violet">
                {isArabic ? "د.ك" : "KWD"}
              </span>
            </div>
          </div>
        </div>

        {/* User Excuse Quote Card */}
        <div className="card-hard bg-[#F6F2FF] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-ink">
            <span>
              {isArabic ? `عذر ${applicantName}:` : `${applicantName}'s stated excuse:`}
            </span>
            <span className="text-xs text-muted font-medium">
              {isArabic ? "مكتوب بخط يده" : "Applicant note"}
            </span>
          </div>
          <blockquote className="text-xs sm:text-sm font-semibold text-ink italic leading-relaxed" dir="auto">
            <bdi>&ldquo;{excuseText}&rdquo;</bdi>
          </blockquote>
        </div>

        {/* Neutral AI Briefing Line */}
        <div className="card-hard bg-surface p-4 space-y-2 text-start">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-violet">
            <Sparkles className="w-3.5 h-3.5 text-violet" />
            <span>{isArabic ? "بيانات الذكاء المحايدة" : "Neutral AI Briefing"}</span>
          </div>
          <p className="text-xs sm:text-sm text-muted leading-relaxed font-medium">
            {isArabic
              ? `${applicantName} محافظ على سلسلة التزام لمدة ${streak} يوم، ولديه ${denials} محاولات كسر سابقة. القرار النهائي بيدك وحدك كرفيقه الموثوق.`
              : `${applicantName} has maintained an active ${streak}-day savings streak with ${denials} previous break attempts. The final decision rests entirely in your hands as his trusted friend.`}
          </p>
        </div>

        {/* Two Equal-Weight Big Buttons */}
        <div className="space-y-3 pt-2">
          {/* 1. Keep it locked */}
          <button
            type="button"
            disabled={processingAction !== null}
            onClick={handleDenyClick}
            className="btn-hard w-full py-4 px-6 bg-lime text-ink font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-[4px_4px_0_var(--ink)]"
          >
            <Lock className="w-4 h-4" />
            <span>
              {processingAction === "DENY"
                ? isArabic ? "جاري الحفظ..." : "Locking..."
                : isArabic ? "خله مقفول" : "Keep it locked"}
            </span>
          </button>

          {/* 2. Let him have it -> Opens PIN verification modal */}
          <button
            type="button"
            disabled={processingAction !== null}
            onClick={() => {
              setPin("");
              setPinError(null);
              setShowPinModal(true);
            }}
            className="btn-hard w-full py-3.5 px-6 bg-surface text-coral border-2 border-coral hover:bg-[#FFEBEF] font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0_var(--coral)]"
          >
            <XCircle className="w-4 h-4" />
            <span>
              {isArabic ? "خلّه يصرف" : "Let him have it"}
            </span>
          </button>
        </div>

        {/* Small Early Release Fee Disclaimer */}
        <p className="text-xs text-muted text-center pt-1 leading-normal font-medium">
          {isArabic
            ? `في حال الموافقة يُخصم ${FRIEND_FEE_PCT}% رسوم ويُسترد ${FRIEND_RETURN_PCT}%. في حال الرفض لا يُخصم أي فلس.`
            : `If approved, a ${FRIEND_FEE_PCT}% fee is deducted (${FRIEND_RETURN_PCT}% refund). If locked, 0% is charged.`}
        </p>
      </main>

      {/* 6-Digit PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-hard bg-surface max-w-sm w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-coral/10 border-2 border-coral mx-auto flex items-center justify-center text-coral mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-ink font-heading">
                {isArabic ? "أدخل رمز التفويض" : "Keyholder Authorization PIN"}
              </h2>
              <p className="text-xs text-muted leading-relaxed font-medium">
                {isArabic
                  ? `أدخل رمزك المكون من 6 أرقام لتأكيد كسر الخزينة وإعادة 95% من المدخرات.`
                  : `Enter your 6-digit PIN to authorize breaking the vault and releasing 95% payout.`}
              </p>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-coral/10 border-2 border-coral text-coral text-xs font-bold text-center">
                {pinError}
              </div>
            )}

            <div className="space-y-2">
              {/* Demo PIN Helper Pill */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setPin("123456");
                    setPinError(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet/10 hover:bg-violet/20 border border-violet/40 text-violet text-xs font-bold transition-all cursor-pointer shadow-[1px_1px_0_var(--ink)]"
                >
                  <span>🔑</span>
                  <span>
                    {isArabic
                      ? "رمز الديمو المعتمد: 123456 (اضغط للتعبئة)"
                      : "Demo PIN: 123456 (Click to auto-fill)"}
                  </span>
                </button>
              </div>

              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                className="w-full text-center text-2xl tracking-[0.5em] font-mono font-black py-3.5 bg-bg border-2 border-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-violet"
              />
              {recoverySent ? (
                <div className="p-2.5 rounded-xl bg-mint/20 border border-mint/40 text-mint text-xs font-bold text-center">
                  {isArabic
                    ? "✓ تم إرسال رابط استعادة الرمز السري إلى بريدك الإلكتروني!"
                    : "✓ PIN recovery link sent to your email!"}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={sendingRecovery}
                  onClick={handleForgotPin}
                  className="text-xs text-muted hover:text-ink font-bold underline block mx-auto pt-1 cursor-pointer"
                >
                  {sendingRecovery
                    ? (isArabic ? "جاري إرسال الرابط..." : "Sending link...")
                    : (isArabic ? "نسيت الرمز السري؟ أرسل رابط الاستعادة لبريدي" : "Forgot PIN? Send recovery link to my email")}
                </button>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-3 px-4 rounded-btn border-2 border-ink bg-surface text-ink font-bold text-xs cursor-pointer hover:bg-bg transition-colors"
              >
                {isArabic ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={pin.length < 6 || processingAction !== null}
                onClick={() => handleDecision("APPROVE", pin)}
                className="flex-1 btn-hard py-3 px-4 bg-coral text-white font-extrabold text-xs cursor-pointer disabled:opacity-50"
              >
                {processingAction === "APPROVE" ? (isArabic ? "جاري التأكيد..." : "Verifying...") : (isArabic ? "تأكيد الفك" : "Authorize")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Neo-Brutalist Decision Modal */}
      {decisionModal && (
        <DecisionModal
          isOpen={decisionModal.isOpen}
          onClose={() => setDecisionModal(null)}
          type={decisionModal.type}
          title={decisionModal.title}
          badge={decisionModal.badge}
          description={decisionModal.description}
          confirmLabel={decisionModal.confirmLabel}
          cancelLabel={decisionModal.cancelLabel}
          hideCancel={decisionModal.hideCancel}
          onConfirm={decisionModal.onConfirm}
          isArabic={isArabic}
        />
      )}
    </div>
  );
}
