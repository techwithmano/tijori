"use client";

import React, { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  RefreshCw,
  Sparkles,
  Eye,
  EyeOff,
  Flame,
  Award,
  HeartHandshake,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { formatKWD } from "@/lib/utils";

interface VaultInviteData {
  id: string;
  title: string;
  targetAmount: number;
  currency: string;
  applicantName: string;
  keyholder: {
    name: string;
    phone?: string;
    email?: string;
    relationship?: string;
  };
  keyholderInviteAccepted: boolean;
}

export default function KeyholderInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const unwrappedParams = use(params);
  const token = unwrappedParams.token;
  const { lang } = useT();
  const isArabic = lang === "ar";

  const [vault, setVault] = useState<VaultInviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("Best Friend");
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [confirmDigits, setConfirmDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Recovery link state
  const [recoverySending, setRecoverySending] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    async function fetchInvite() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/keyholder/invite/${token}`);
        const data = await res.json();
        if (data.success && data.vault) {
          setVault(data.vault);
          setName(data.vault.keyholder?.name || "");
          setEmail(data.vault.keyholder?.email || "");
          setPhone(data.vault.keyholder?.phone?.replace(/^\+965/, "") || "");
          setRelationship(data.vault.keyholder?.relationship || "Best Friend");

          // Check if URL has ?action=recover or ?recover=true
          const isRecoverAction =
            typeof window !== "undefined" &&
            (window.location.search.includes("action=recover") ||
              window.location.search.includes("recover=true"));

          if (data.vault.keyholderInviteAccepted && !isRecoverAction) {
            setSuccess(true);
          }
        } else {
          setError(data.error || "Invite link not found or expired.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load keyholder invite.");
      } finally {
        setLoading(false);
      }
    }
    fetchInvite();
  }, [token]);

  // Handle segmented PIN input
  const handleDigitChange = (
    index: number,
    value: string,
    isConfirm: boolean = false
  ) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const targetDigits = isConfirm ? [...confirmDigits] : [...pinDigits];
    const targetRefs = isConfirm ? confirmRefs : pinRefs;

    targetDigits[index] = digit;
    if (isConfirm) {
      setConfirmDigits(targetDigits);
    } else {
      setPinDigits(targetDigits);
    }

    if (digit && index < 5) {
      targetRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    isConfirm: boolean = false
  ) => {
    const targetDigits = isConfirm ? confirmDigits : pinDigits;
    const targetRefs = isConfirm ? confirmRefs : pinRefs;

    if (e.key === "Backspace" && !targetDigits[index] && index > 0) {
      targetRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    isConfirm: boolean = false
  ) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = pasted.split("");
    while (newDigits.length < 6) newDigits.push("");

    if (isConfirm) {
      setConfirmDigits(newDigits);
      confirmRefs.current[Math.min(pasted.length, 5)]?.focus();
    } else {
      setPinDigits(newDigits);
      pinRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const fullPin = pinDigits.join("");
  const fullConfirm = confirmDigits.join("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (fullPin.length !== 6) {
      setFormError(
        isArabic
          ? "يجب أن يتكون الرمز السري من ٦ أرقام بالضبط."
          : "Your secret PIN must be exactly 6 numeric digits."
      );
      return;
    }

    if (fullPin !== fullConfirm) {
      setFormError(
        isArabic
          ? "الرمزان غير متطابقين. يرجى التأكد وإعادة الإدخال."
          : "PINs do not match. Please re-enter to confirm."
      );
      return;
    }

    try {
      setSubmitting(true);
      const cleanedPhone = phone.replace(/\s+/g, "").replace(/^\+965/, "");
      const fullPhone = cleanedPhone ? `+965${cleanedPhone}` : vault?.keyholder?.phone;

      const res = await fetch(`/api/keyholder/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: fullPin,
          confirmPin: fullConfirm,
          name: name.trim() || vault?.keyholder?.name,
          email: email.trim() || vault?.keyholder?.email,
          phone: fullPhone,
          relationship: relationship.trim() || "Best Friend",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#CFFF3A", "#6B4DFF", "#2DE0A5", "#14102B"],
        });
      } else {
        setFormError(data.error || "Failed to set PIN. Please try again.");
      }
    } catch (err: any) {
      setFormError(err.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendRecoveryEmail = async () => {
    try {
      setRecoverySending(true);
      const res = await fetch("/api/keyholder/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteToken: token,
          lang: isArabic ? "ar" : "en",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRecoverySuccess(true);
        setTimeout(() => setRecoverySuccess(false), 6000);
      } else {
        setFormError(data.error || "Failed to send recovery email");
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to send recovery email");
    } finally {
      setRecoverySending(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="card-hard bg-surface p-8 text-center space-y-4 max-w-sm w-full shadow-[4px_4px_0_var(--ink)]">
          <div className="w-12 h-12 rounded-xl bg-lime border-2 border-ink flex items-center justify-center mx-auto text-ink shadow-[2px_2px_0_var(--ink)] animate-bounce">
            <KeyRound className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-ink">
              {isArabic ? "جاري تحضير مفتاح الخزينة..." : "Loading Keyholder Hub..."}
            </h3>
            <p className="text-xs text-muted font-medium">
              {isArabic ? "نتحقق من صلاحية الرابط والمفتاح" : "Connecting to Tijori Vault Protocol"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Error / Not Found State
  if (error || !vault) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center p-4 sm:p-6">
        <div className="card-hard bg-surface p-8 sm:p-10 space-y-5 max-w-md w-full text-center shadow-[6px_6px_0_var(--ink)]">
          <div className="w-16 h-16 rounded-2xl bg-coral/20 border-2 border-ink mx-auto flex items-center justify-center text-coral shadow-[3px_3px_0_var(--ink)]">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-ink font-heading">
              {isArabic ? "رابط الدعوة غير متوفر أو منتهي" : "Invite Link Not Found"}
            </h1>
            <p className="text-xs sm:text-sm text-muted leading-relaxed font-medium">
              {isArabic
                ? "هذا الرابط غير صالح أو تم حذفه. يرجى طلب رابط دعوة جديد من صاحب الخزينة."
                : "This invite link is invalid or has expired. Please ask your friend to send a fresh invite."}
            </p>
          </div>
          <Link
            href="/"
            className="btn-hard w-full bg-lime text-ink font-bold text-xs sm:text-sm py-3.5 inline-flex items-center justify-center gap-2 shadow-[3px_3px_0_var(--ink)]"
          >
            <span>{isArabic ? "الرجوع لمنصة تِجوري" : "Go to Tijori"}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    );
  }

  // 3. Success / Keyholder Hub State ("You Hold the Key!")
  if (success) {
    const friendEmail = email || vault.keyholder?.email || "";
    return (
      <div className="max-w-xl w-full mx-auto p-4 sm:p-6 py-8 sm:py-12 space-y-6">
        {/* Confetti Hero Card */}
        <div className="card-hard bg-surface p-6 sm:p-10 space-y-6 text-center shadow-[6px_6px_0_var(--ink)] border-2 border-ink rounded-3xl">
          {/* Key Emblem */}
          <div className="relative inline-block mx-auto">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-lime border-3 border-ink mx-auto flex items-center justify-center text-ink shadow-[4px_4px_0_var(--ink)]">
              <KeyRound className="w-10 h-10 sm:w-12 sm:h-12 text-ink stroke-[2.2]" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-sun border-2 border-ink rounded-full p-1.5 shadow-[2px_2px_0_var(--ink)]">
              <ShieldCheck className="w-5 h-5 text-ink" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-lime/40 border border-ink text-xs font-black text-ink uppercase tracking-wider shadow-[2px_2px_0_var(--ink)]">
              <Sparkles className="w-3.5 h-3.5 text-violet" />
              <span>{isArabic ? "المفتاح مفعّل ومحمي" : "Keyholder Key Active & Secured"}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-ink tracking-tight font-heading">
              {isArabic ? "المفتاح بيدك الآن!" : "You Hold the Master Key!"}
            </h1>
            <p className="text-xs sm:text-sm text-muted font-medium max-w-md mx-auto leading-relaxed">
              {isArabic
                ? `تم حفظ رقمك السري (PIN) بنجاح. أنت الآن الحارس الرسمي لأهداف ومدخرات ${vault.applicantName} لمنع الصرف الاندفاعي.`
                : `Your secret 6-digit PIN has been locked in. You are now the official discipline guardian for ${vault.applicantName}'s savings.`}
            </p>
          </div>

          {/* Goal Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-start">
            <div className="p-4 rounded-2xl bg-bg border-2 border-ink shadow-[2px_2px_0_var(--ink)] space-y-1">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                {isArabic ? "هدف التوفير" : "Savings Goal"}
              </span>
              <p className="text-sm font-black text-ink truncate">{vault.title}</p>
            </div>
            <div className="p-4 rounded-2xl bg-bg border-2 border-ink shadow-[2px_2px_0_var(--ink)] space-y-1">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                {isArabic ? "المبلغ المقفول" : "Protected Goal Target"}
              </span>
              <p className="text-sm font-black text-violet">{formatKWD(vault.targetAmount)}</p>
            </div>
          </div>

          {/* Superpower & Duty Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-sun/20 border-2 border-ink text-start space-y-2 shadow-[2px_2px_0_var(--ink)]">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-ink shrink-0" />
              <h4 className="text-xs sm:text-sm font-extrabold text-ink">
                {isArabic ? "صلاحياتك كحامل المفتاح" : "Your Keyholder Responsibility"}
              </h4>
            </div>
            <p className="text-xs text-muted leading-relaxed font-medium">
              {isArabic
                ? `لن يتمكن ${vault.applicantName} من كسر هذه الخزينة أو سحب أمواله قبل الموعد المحدد إلا بموافقتك الشخصية وإدخال رمزك السري المكون من ٦ أرقام. رمزك السري مخفي عنه تماماً.`
                : `${vault.applicantName} cannot withdraw their funds early without your personal approval and your 6-digit secret PIN. Your PIN is completely invisible to them.`}
            </p>
          </div>

          {/* PIN Recovery Link Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-violet/10 border-2 border-ink text-start space-y-3 shadow-[2px_2px_0_var(--ink)]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-violet shrink-0" />
                <h4 className="text-xs sm:text-sm font-extrabold text-ink">
                  {isArabic ? "رابط استعادة الرمز السري (في حال النسيان)" : "PIN Recovery Link Dispatched"}
                </h4>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed font-medium">
              {isArabic
                ? `أرسلنا رابطاً خاصاً وسرياً إلى بريدك الإلكتروني (${friendEmail || "بريدك المسجل"}). إذا نسيت رقمك السري في أي وقت، يمكنك فتحه لإعادة تعيين الرمز فوراً.`
                : `We dispatched a private recovery link to your email (${friendEmail || "your email"}). If you ever forget your PIN, simply open that email to reset it anytime.`}
            </p>

            {recoverySuccess && (
              <div className="p-2.5 rounded-xl bg-mint/20 border border-mint/40 text-mint text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-mint" />
                <span>
                  {isArabic
                    ? "✓ تم إرسال رابط الاستعادة إلى بريدك بنجاح!"
                    : "✓ PIN recovery link resent to your email successfully!"}
                </span>
              </div>
            )}

            <button
              type="button"
              disabled={recoverySending}
              onClick={handleSendRecoveryEmail}
              className="btn-hard py-2.5 px-4 bg-surface hover:bg-bg text-ink font-bold text-xs shadow-[2px_2px_0_var(--ink)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recoverySending ? "animate-spin" : ""}`} />
              <span>
                {recoverySending
                  ? isArabic
                    ? "جاري إرسال الرابط..."
                    : "Sending recovery link..."
                  : isArabic
                  ? "إعادة إرسال رابط الاستعادة لبريدي ✉️"
                  : "Resend Recovery Email to My Inbox ✉️"}
              </span>
            </button>
          </div>

          {/* Edit PIN Option */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setPinDigits(["", "", "", "", "", ""]);
                setConfirmDigits(["", "", "", "", "", ""]);
              }}
              className="text-xs text-muted hover:text-ink font-bold underline cursor-pointer"
            >
              {isArabic ? "تريد تغيير رقمك السري الآن؟" : "Want to change your 6-digit PIN now?"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Active PIN Setup Form
  return (
    <div className="max-w-xl w-full mx-auto p-4 sm:p-6 py-6 sm:py-10 space-y-6">
      <div className="card-hard bg-surface p-6 sm:p-8 space-y-6 shadow-[6px_6px_0_var(--ink)] border-2 border-ink rounded-3xl">
        {/* Protocol Badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet/15 border-2 border-ink text-xs font-black text-violet shadow-[2px_2px_0_var(--ink)]">
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isArabic ? "دعوة حامل المفتاح الرسمية" : "Official Keyholder Protocol"}</span>
          </span>
          <span className="text-[11px] font-bold text-muted flex items-center gap-1">
            <Lock className="w-3 h-3 text-ink" />
            <span>{isArabic ? "سري وخاص" : "Confidential"}</span>
          </span>
        </div>

        {/* Hero Title */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight leading-tight font-heading">
            {isArabic
              ? `${vault.applicantName} اختارك لتكون حامل المفتاح!`
              : `${vault.applicantName} Chose You as Keyholder!`}
          </h1>
          <p className="text-xs sm:text-sm text-muted font-medium leading-relaxed">
            {isArabic
              ? `أنشأ ${vault.applicantName} خزينة توفير مقفلة لهدف "${vault.title}" بمبلغ ${formatKWD(vault.targetAmount)}. دورك هو مساعدته على الالتزام ومنع الصرف الاندفاعي.`
              : `${vault.applicantName} is locking away ${formatKWD(vault.targetAmount)} for "${vault.title}". They trust you to hold the approval key so they never break discipline on impulse.`}
          </p>
        </div>

        {/* Target Summary Strip */}
        <div className="p-4 rounded-2xl bg-bg border-2 border-ink flex items-center justify-between gap-4 shadow-[2px_2px_0_var(--ink)]">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
              {isArabic ? "الهدف المحمي" : "Protected Goal"}
            </span>
            <span className="text-sm font-extrabold text-ink">{vault.title}</span>
          </div>
          <div className="text-end space-y-0.5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
              {isArabic ? "المبلغ المستهدف" : "Target Amount"}
            </span>
            <span className="text-sm font-black text-violet">{formatKWD(vault.targetAmount)}</span>
          </div>
        </div>

        {/* Error Banner */}
        {formError && (
          <div className="p-3.5 rounded-xl bg-coral/20 border-2 border-ink text-ink font-bold text-xs flex items-center gap-2 shadow-[2px_2px_0_var(--ink)]">
            <ShieldAlert className="w-4 h-4 text-coral shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-ink block">
                {isArabic ? "اسمك" : "Your Name"}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ahmed"
                className="w-full bg-bg border-2 border-ink text-ink rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet shadow-[2px_2px_0_var(--ink)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-ink block">
                {isArabic ? "صلتك بصاحب الخزينة" : "Relationship"}
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full bg-bg border-2 border-ink text-ink rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet shadow-[2px_2px_0_var(--ink)]"
              >
                <option value="Best Friend">{isArabic ? "أعز الأصدقاء" : "Best Friend"}</option>
                <option value="Brother">{isArabic ? "أخ" : "Brother"}</option>
                <option value="Sister">{isArabic ? "أخت" : "Sister"}</option>
                <option value="Spouse">{isArabic ? "شريك الحياة" : "Spouse"}</option>
                <option value="Father">{isArabic ? "والد" : "Father"}</option>
                <option value="Mother">{isArabic ? "والدة" : "Mother"}</option>
                <option value="Friend">{isArabic ? "صديق" : "Friend"}</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-ink flex items-center justify-between">
              <span>{isArabic ? "بريدك الإلكتروني (لاستلام رابط الاستعادة)" : "Your Email (For Backup & Recovery Link)"}</span>
              <span className="text-[10px] text-muted font-bold">{isArabic ? "مهم جداً" : "Essential"}</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@gmail.com"
              className="w-full bg-bg border-2 border-ink text-ink rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet shadow-[2px_2px_0_var(--ink)]"
            />
            <p className="text-[11px] text-muted font-medium">
              {isArabic
                ? "سنرسل لك رابط استعادة سرياً إلى هذا البريد في حال نسيت رقمك السري مستقبلاً."
                : "We will email you a private recovery link so you can recover your PIN anytime if you forget it."}
            </p>
          </div>

          {/* 6-DIGIT PIN SETUP (Segmented Boxes) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-bg border-2 border-ink space-y-4 shadow-[3px_3px_0_var(--ink)]">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs sm:text-sm font-black text-ink block">
                  {isArabic ? "اختر رقمك السري الخاص (٦ أرقام)" : "Choose Your Secret 6-Digit PIN"}
                </label>
                <p className="text-[11px] text-muted font-medium mt-0.5">
                  {isArabic
                    ? `${vault.applicantName} لن يعرف هذا الرمز أبداً.`
                    : `${vault.applicantName} will never know this code.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-xs font-extrabold text-violet flex items-center gap-1 hover:underline cursor-pointer"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPin ? (isArabic ? "إخفاء" : "Hide") : (isArabic ? "إظهار" : "Show")}</span>
              </button>
            </div>

            {/* 6 Segmented PIN Boxes */}
            <div className="flex items-center justify-center gap-2 sm:gap-3" dir="ltr">
              {pinDigits.map((digit, idx) => (
                <input
                  key={`pin-${idx}`}
                  ref={(el) => { pinRefs.current[idx] = el; }}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value, false)}
                  onKeyDown={(e) => handleDigitKeyDown(idx, e, false)}
                  onPaste={(e) => handlePaste(e, false)}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black bg-surface border-2 border-ink rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-violet focus:border-violet shadow-[2px_2px_0_var(--ink)] transition-all"
                />
              ))}
            </div>

            {/* Confirm PIN Segmented Boxes */}
            <div className="pt-2 border-t border-ink/10 space-y-2">
              <label className="text-xs font-extrabold text-ink block text-start">
                {isArabic ? "تأكيد الرمز السري (أعد الإدخال)" : "Confirm Your 6-Digit PIN"}
              </label>

              <div className="flex items-center justify-center gap-2 sm:gap-3" dir="ltr">
                {confirmDigits.map((digit, idx) => (
                  <input
                    key={`confirm-${idx}`}
                    ref={(el) => { confirmRefs.current[idx] = el; }}
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value, true)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e, true)}
                    onPaste={(e) => handlePaste(e, true)}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black bg-surface border-2 border-ink rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-violet focus:border-violet shadow-[2px_2px_0_var(--ink)] transition-all"
                  />
                ))}
              </div>

              {fullPin && fullConfirm && fullPin === fullConfirm && (
                <div className="p-2 rounded-xl bg-mint/20 border border-mint/40 text-mint text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-mint" />
                  <span>{isArabic ? "الرمزان متطابقان ✓" : "PINs Match ✓"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Security Guarantee Banner */}
          <div className="p-4 rounded-2xl bg-sun/15 border-2 border-ink text-start space-y-1 shadow-[2px_2px_0_var(--ink)]">
            <div className="flex items-center gap-1.5 text-xs font-black text-ink">
              <ShieldCheck className="w-4 h-4 text-ink" />
              <span>{isArabic ? "ضمان الخصوصية والمسؤولية" : "Privacy & Accountability Guarantee"}</span>
            </div>
            <p className="text-xs text-muted leading-relaxed font-medium">
              {isArabic
                ? `هذا الرمز السري هو مفتاح الأمان الوحيد. لن يعرف ${vault.applicantName} هذا الرمز أبداً. وبمجرد حفظه سنرسل لك رابط استعادة تلقائياً إلى بريدك.`
                : `This PIN is the only key. ${vault.applicantName} will never know it. Upon saving, a secure backup recovery link will be dispatched immediately to your email.`}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || fullPin.length !== 6 || fullConfirm.length !== 6}
            className="btn-hard w-full py-4 px-6 bg-lime text-ink font-black text-base shadow-[4px_4px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{isArabic ? "جاري قفل المفتاح..." : "Securing Master Key..."}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-ink" />
                <span>{isArabic ? "تثبيت الرمز وتفعيل المفتاح 🔐" : "Lock PIN & Activate Key 🔐"}</span>
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
