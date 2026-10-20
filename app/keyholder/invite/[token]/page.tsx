"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Lock,
  UserCheck,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
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
    phone: string;
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
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("Best Friend");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
          setPhone(data.vault.keyholder?.phone?.replace(/^\+965/, "") || "");
          setRelationship(data.vault.keyholder?.relationship || "Best Friend");
          if (data.vault.keyholderInviteAccepted) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPin = pin.replace(/\D/g, "");
    const cleanConfirm = confirmPin.replace(/\D/g, "");

    if (cleanPin.length !== 6) {
      setFormError(
        isArabic
          ? "يجب أن يتكون الرمز السري من ٦ أرقام بالضبط."
          : "Your secret PIN must be exactly 6 numeric digits."
      );
      return;
    }

    if (cleanPin !== cleanConfirm) {
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
          pin: cleanPin,
          confirmPin: cleanConfirm,
          name: name.trim() || vault?.keyholder?.name,
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

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center p-4">
        <div className="card-hard bg-surface p-8 text-center space-y-4 max-w-sm w-full">
          <div className="w-12 h-12 rounded-full border-4 border-ink border-t-lime animate-spin mx-auto" />
          <p className="text-sm font-bold text-ink">
            {isArabic ? "جاري تجهيز دعوة حامل المفتاح..." : "Loading Keyholder invitation..."}
          </p>
        </div>
      </div>
    );
  }

  // 2. Error / Not Found State
  if (error || !vault) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col pt-[calc(var(--nav-h)+24px)]">
        <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 flex flex-col justify-center items-center text-center">
          <div className="card-hard bg-surface p-8 space-y-5 w-full">
            <div className="w-16 h-16 rounded-2xl bg-coral/20 border-2 border-ink mx-auto flex items-center justify-center text-coral shadow-[2px_2px_0_var(--ink)]">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink font-heading">
              {isArabic ? "الرابط غير صالح أو منتهي" : "Invite Link Not Found"}
            </h1>
            <p className="text-xs sm:text-sm text-muted leading-relaxed font-medium">
              {isArabic
                ? "هذا الرابط غير صالح أو تم حذفه. يرجى طلب رابط دعوة جديد من صاحب الخزينة."
                : "This invite link is invalid or has expired. Please ask your friend to send a fresh invite link."}
            </p>
            <Link
              href="/"
              className="btn-hard w-full bg-lime text-ink font-bold text-xs sm:text-sm py-3 inline-flex items-center justify-center gap-2"
            >
              <span>{isArabic ? "الرجوع لمنصة تِجوري" : "Go to Tijori"}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // 3. Success / Accepted State
  if (success) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col">
        <header className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-md border-b-2 border-ink px-4 h-16 flex items-center justify-between">
          <BrandLogo />
          <LanguageSwitcher />
        </header>

        <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 flex flex-col justify-center items-center pt-24 pb-12">
          <div className="card-hard bg-surface p-6 sm:p-8 space-y-5 w-full text-center shadow-[4px_4px_0_var(--ink)]">
            <div className="w-16 h-16 rounded-2xl bg-lime border-2 border-ink mx-auto flex items-center justify-center text-ink shadow-[2px_2px_0_var(--ink)]">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime/30 border border-ink text-xs font-black text-ink uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-violet" />
                <span>{isArabic ? "المفتاح مفعّل ومحمي" : "Keyholder Key Locked"}</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight font-heading">
                {isArabic ? "أنت الآن حامل المفتاح!" : "You Hold the Key!"}
              </h1>
              <p className="text-xs sm:text-sm text-muted font-medium leading-relaxed">
                {isArabic
                  ? `تم حفظ رقمك السري (PIN) بنجاح. أنت الآن حارس مدخرات ${vault.applicantName} لهدف (${vault.title}).`
                  : `Your secret 6-digit PIN has been secured. You are now guarding ${vault.applicantName}'s goal ("${vault.title}").`}
              </p>
            </div>

            {/* Commitment Box */}
            <div className="p-4 rounded-xl bg-bg border-2 border-ink text-start space-y-2.5 shadow-[2px_2px_0_var(--ink)]">
              <div className="flex items-center justify-between text-xs font-bold text-muted">
                <span>{isArabic ? "هدف التوفير" : "Savings Goal"}</span>
                <span className="font-extrabold text-ink">{vault.title}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-muted">
                <span>{isArabic ? "المبلغ المستهدف" : "Target Amount"}</span>
                <span className="font-extrabold text-violet">{formatKWD(vault.targetAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-muted border-t border-ink/10 pt-2">
                <span>{isArabic ? "حامل المفتاح" : "Designated Keyholder"}</span>
                <span className="font-extrabold text-ink">{name || vault.keyholder.name}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-violet/10 border-2 border-ink text-start space-y-1">
              <p className="text-xs font-bold text-ink flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-violet shrink-0" />
                <span>{isArabic ? "تذكير الأمان" : "Security Guarantee"}</span>
              </p>
              <p className="text-xs text-muted leading-relaxed font-medium">
                {isArabic
                  ? `رقمك السري لن يظهر لـ ${vault.applicantName} أبداً. إذا طلب كسر الخزينة مبكراً، سيتعين عليه طلب موافقتك وإدخال هذا الرمز السري.`
                  : `Your PIN is completely hidden from ${vault.applicantName}. If they ever try to break their vault before the target date, they must ask you for this secret PIN.`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="text-xs text-muted hover:text-ink font-bold underline cursor-pointer"
            >
              {isArabic ? "تعديل الرمز السري؟" : "Need to change your PIN?"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 4. Active PIN Setup Form
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-md border-b-2 border-ink px-4 h-16 flex items-center justify-between">
        <BrandLogo />
        <LanguageSwitcher />
      </header>

      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 flex flex-col justify-center items-center pt-24 pb-12">
        <div className="card-hard bg-surface p-5 sm:p-8 space-y-5 w-full shadow-[4px_4px_0_var(--ink)]">
          {/* Top Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet/15 border border-ink text-xs font-extrabold text-violet">
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isArabic ? "دعوة حامل المفتاح" : "Keyholder Invitation"}</span>
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight leading-tight font-heading">
              {isArabic
                ? `${vault.applicantName} اختارك حامل مفتاحه!`
                : `${vault.applicantName} chose you as their Keyholder!`}
            </h1>
            <p className="text-xs sm:text-sm text-muted font-medium leading-relaxed">
              {isArabic
                ? `يقوم ${vault.applicantName} بإنشاء خزينة توفير مقفلة لهدف "${vault.title}" بمبلغ ${formatKWD(vault.targetAmount)}. دورك هو مساعدته على الالتزام ومنع الصرف التلقائي.`
                : `${vault.applicantName} is creating a locked savings vault for "${vault.title}" (${formatKWD(vault.targetAmount)}). Your job is to keep them disciplined and stop impulse spending.`}
            </p>
          </div>

          {/* Form Error Banner */}
          {formError && (
            <div className="p-3.5 rounded-xl bg-coral/20 border-2 border-ink text-ink font-bold text-xs flex items-center gap-2 shadow-[2px_2px_0_var(--ink)]">
              <ShieldAlert className="w-4 h-4 text-coral shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* The Setup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Friend's Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink block">
                {isArabic ? "اسمك" : "Your Name"}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ahmed"
                className="w-full bg-bg border-2 border-ink text-ink rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet/30"
              />
            </div>

            {/* Friend's WhatsApp Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink block">
                {isArabic ? "رقم واتساب (+965)" : "WhatsApp Number (+965)"}
              </label>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-3.5 rounded-xl bg-bg border-2 border-ink text-xs font-black text-ink select-none">
                  +965
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="99887766"
                  className="flex-1 bg-bg border-2 border-ink text-ink rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet/30"
                />
              </div>
            </div>

            {/* Relationship */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink block">
                {isArabic ? "صلة القرابة / الصداقة" : "Relationship"}
              </label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Best Friend, Brother, Cousin"
                className="w-full bg-bg border-2 border-ink text-ink rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet/30"
              />
            </div>

            {/* Secret 6-Digit PIN Field */}
            <div className="p-4 rounded-xl bg-bg border-2 border-ink shadow-[2px_2px_0_var(--ink)] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-ink flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-violet" />
                  <span>{isArabic ? "اختر رقمك السري (٦ أرقام)" : "Set Your Secret 6-Digit PIN"}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <input
                type={showPin ? "text" : "password"}
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full bg-surface border-2 border-ink text-ink font-extrabold tracking-[0.5em] text-center text-xl rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet/30"
              />

              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-muted block">
                  {isArabic ? "تأكيد الرقم السري (٦ أرقام)" : "Confirm Secret PIN"}
                </label>
                <input
                  type={showPin ? "text" : "password"}
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="w-full bg-surface border-2 border-ink text-ink font-extrabold tracking-[0.5em] text-center text-xl rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet/30"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-surface border border-ink/20">
                <p className="text-xs text-muted leading-tight font-medium">
                  {isArabic
                    ? `⚠️ حافظ على سرية هذا الرمز! ${vault.applicantName} لن يراه، وسيحتاج موافقتك وطلب هذا الرمز إذا فكر يكسر الخزينة بدري.`
                    : `⚠️ Keep this strictly secret! ${vault.applicantName} will never see it, and will need your permission and this PIN if they ever try to break their vault.`}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-hard w-full py-3.5 px-6 bg-lime text-ink font-extrabold text-base shadow-[4px_4px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{isArabic ? "تثبيت المفتاح السري والموافقة" : "Lock Secret PIN & Guard Vault"}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
