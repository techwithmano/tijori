"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  TrendingUp,
  Copy,
  Check,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { formatKWD } from "@/lib/utils";
import StripeCardForm from "@/components/StripeCardForm";
import { FRIEND_FEE_PCT } from "@/lib/config";

interface QuickChip {
  id: string;
  labelKey: string;
  defaultTitle: string;
  defaultAmount: number;
}

const QUICK_CHIPS: QuickChip[] = [
  { id: "japan", labelKey: "chips.japanTrip", defaultTitle: "Japan Summer Trip", defaultAmount: 600 },
  { id: "phone", labelKey: "chips.newPhone", defaultTitle: "New iPhone Pro", defaultAmount: 420 },
  { id: "car", labelKey: "chips.car", defaultTitle: "Car Down Payment", defaultAmount: 1500 },
  { id: "emergency", labelKey: "chips.emergencyFund", defaultTitle: "Emergency Buffer", defaultAmount: 500 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { t, lang } = useT();
  const isArabic = lang === "ar";

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCard, setSavedCard] = useState<{ brand: string; last4: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  // Keyholder Invite Token (Generated client-side or fallback UUID)
  const [inviteToken, setInviteToken] = useState<string>(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "inv_" + Math.random().toString(36).substring(2, 12);
  });
  const [copiedInvite, setCopiedInvite] = useState(false);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Step 1: Goal & Target
  const [goalName, setGoalName] = useState("Japan Summer Trip");
  const [targetAmount, setTargetAmount] = useState<number | string>(500);

  // Step 2: Flexible Pacing
  const [pullAmount, setPullAmount] = useState<number | string>(25);
  const [cadence, setCadence] = useState<"daily" | "weekly" | "biweekly" | "monthly" | "custom">("weekly");
  const [customCadenceDays, setCustomCadenceDays] = useState<number>(3);
  const [incrementalType, setIncrementalType] = useState<"none" | "fixed" | "percentage">("none");
  const [incrementalValue, setIncrementalValue] = useState<number>(0.1);
  const [allowanceDay, setAllowanceDay] = useState<number>(25);

  // Step 3: Keyholder (Friend who holds the key)
  const [keyholderName, setKeyholderName] = useState("Ahmed");
  const [keyholderEmail, setKeyholderEmail] = useState("");
  const [keyholderRel, setKeyholderRel] = useState("Best Friend");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);

  // Email Validation
  const validateEmail = (mail: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim());
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!goalName.trim()) {
      setError(isArabic ? "يرجى تحديد هدف التوفير." : "Please enter what you are saving for.");
      return;
    }
    if (!targetAmount || Number(targetAmount) <= 0) {
      setError(isArabic ? "يرجى إدخال مبلغ هدف صالح." : "Please enter a valid target amount.");
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pullAmount || Number(pullAmount) <= 0) {
      setError(isArabic ? "يرجى تحديد مبلغ استقطاع صالح." : "Please enter a valid auto-save amount.");
      return;
    }
    setStep(3);
  };

  const handleNextStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!keyholderName.trim()) {
      setError(isArabic ? "يرجى إدخال اسم حامل المفتاح." : "Please enter your keyholder's name.");
      return;
    }
    if (!keyholderEmail.trim() || !validateEmail(keyholderEmail)) {
      setError(t("onboarding.emailValidation"));
      return;
    }
    setStep(4);
  };

  const handleSendEmailInvite = async () => {
    setError(null);
    if (!keyholderEmail.trim() || !validateEmail(keyholderEmail)) {
      setError(t("onboarding.emailValidation"));
      return;
    }

    try {
      setSendingEmail(true);
      const res = await fetch("/api/keyholder/invite/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: keyholderEmail.trim(),
          keyholderName: keyholderName.trim() || "Friend",
          applicantName: currentUser?.name || "Your Friend",
          goalTitle: goalName.trim() || "Savings Goal",
          targetAmount: Number(targetAmount) || 500,
          inviteToken,
          lang: isArabic ? "ar" : "en",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEmailSentNotice(
          isArabic
            ? `تم إرسال الدعوة إلى ${keyholderEmail.trim()}! ✉️`
            : `Invite email sent to ${keyholderEmail.trim()}! ✉️`
        );
      } else {
        setError(data.error || "Failed to send email invite.");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCreateVault = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: goalName.trim(),
          targetAmount: Number(targetAmount),
          pullAmount: Number(pullAmount),
          cadence,
          customCadenceDays: cadence === "custom" ? customCadenceDays : 7,
          incrementalSavingsType: incrementalType,
          incrementalSavingsValue: incrementalValue,
          allowanceDay: Number(allowanceDay) || 25,
          keyholder: {
            name: keyholderName.trim(),
            email: keyholderEmail.trim(),
            relationship: keyholderRel.trim() || "Best Friend",
          },
          inviteToken,
        }),
      });

      const data = await res.json();

      if (data.success && data.vault) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Failed to create vault. Please check your inputs.");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInvite = () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/keyholder/invite/${inviteToken}`;
    navigator.clipboard.writeText(url);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const inviteUrl =
    typeof window !== "undefined" && inviteToken
      ? `${window.location.origin}/keyholder/invite/${inviteToken}`
      : `/keyholder/invite/${inviteToken}`;

  const progressPercentage = (step / 4) * 100;

  return (
    <div className={`min-h-[85vh] flex flex-col justify-center mx-auto px-4 pb-12 pt-[calc(var(--nav-h)+24px)] transition-all ${step === 4 ? "max-w-3xl" : "max-w-xl"}`}>
      {/* Neobrutalist Progress Bar directly above card (16px gap, 25/50/75/100%) */}
      <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden border-2 border-ink shadow-[2px_2px_0_var(--ink)] mb-4">
        <div
          className="h-full bg-lime border-e-2 border-ink transition-all duration-300 rounded-full"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Main Card */}
      <div className="card-hard bg-surface p-5 sm:p-8 shadow-[4px_4px_0_var(--ink)] space-y-5">
        {/* Inside Card Header: Back & Step X of 4 on one line above title */}
        <div className="flex items-center justify-between text-xs text-muted border-b border-ink/10 pb-3">
          <div className="flex items-center gap-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as any) : 1))}
                className="inline-flex items-center gap-1 text-muted hover:text-ink font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t("onboarding.backAction")}</span>
              </button>
            ) : (
              <span className="text-muted/60 font-semibold">Tijori</span>
            )}
          </div>
          <span className="font-extrabold text-ink">
            {t("onboarding.stepCount", { current: step, total: 4 })}
          </span>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-coral/20 border-2 border-ink text-ink font-bold text-xs flex items-center gap-2 shadow-[2px_2px_0_var(--ink)]">
            <AlertCircle className="w-4 h-4 text-coral shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── STEP 1: What are you saving for? ── */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight leading-tight font-heading">
                {t("onboarding.step1Title")}
              </h1>
              <p className="text-xs sm:text-sm text-muted font-medium">
                {t("onboarding.step1Sub")}
              </p>
            </div>

            {/* Popular Goals Chips */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-muted block">
                {t("onboarding.popularGoals")}
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setGoalName(chip.defaultTitle);
                      setTargetAmount(chip.defaultAmount);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 border-ink transition-all cursor-pointer shadow-[2px_2px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 ${
                      goalName === chip.defaultTitle
                        ? "bg-lime text-ink"
                        : "bg-surface text-muted hover:text-ink hover:bg-bg"
                    }`}
                  >
                    {t(`onboarding.${chip.labelKey}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Title Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink block">
                {t("onboarding.goalNameLabel")}
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                enterKeyHint="next"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder={t("onboarding.goalNamePlaceholder")}
                className="w-full bg-bg border-2 border-ink text-ink placeholder:text-muted/60 rounded-xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all font-semibold"
              />
            </div>

            {/* Target Amount Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink block">
                {t("onboarding.targetAmountLabel")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.5"
                  step="any"
                  required
                  autoComplete="off"
                  enterKeyHint="next"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full bg-bg border-2 border-ink text-ink placeholder:text-muted/60 rounded-xl px-4 py-3 text-xl sm:text-2xl font-extrabold tabular-nums pe-20 focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all font-heading"
                />
                <span className="absolute inset-y-0 end-4 flex items-center text-sm font-extrabold text-ink pointer-events-none">
                  {isArabic ? "د.ك" : "KWD"}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="btn-hard w-full py-3.5 px-6 bg-lime text-ink font-extrabold text-base shadow-[4px_4px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t("onboarding.nextAction")}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2: Flexible Pacing ── */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight leading-tight font-heading">
                {t("onboarding.step2Title")}
              </h1>
              <p className="text-xs sm:text-sm text-muted font-medium">
                {t("onboarding.step2Sub")}
              </p>
            </div>

            {/* How much each time */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink block">
                {t("onboarding.pullAmountLabel")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.5"
                  step="any"
                  required
                  autoComplete="off"
                  enterKeyHint="next"
                  value={pullAmount}
                  onChange={(e) => setPullAmount(e.target.value)}
                  className="w-full bg-bg border-2 border-ink text-ink placeholder:text-muted/60 rounded-xl px-4 py-3 text-xl sm:text-2xl font-extrabold tabular-nums pe-20 focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all font-heading"
                />
                <span className="absolute inset-y-0 end-4 flex items-center text-sm font-extrabold text-ink pointer-events-none">
                  {isArabic ? "د.ك" : "KWD"}
                </span>
              </div>

              {/* Quick amount chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[10, 20, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPullAmount(amt)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border-2 border-ink transition-all tabular-nums cursor-pointer shadow-[2px_2px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 ${
                      Number(pullAmount) === amt
                        ? "bg-lime text-ink"
                        : "bg-surface text-muted hover:text-ink"
                    }`}
                  >
                    {amt} {isArabic ? "د.ك" : "KWD"}
                  </button>
                ))}
              </div>
            </div>

            {/* Cadence: How often */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink block">
                {t("onboarding.cadenceLabel")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "daily", label: isArabic ? "يومي" : "Daily", desc: isArabic ? "كل يوم" : "Every day" },
                  { id: "weekly", label: isArabic ? "أسبوعي" : "Weekly", desc: isArabic ? "كل ٧ أيام" : "Every 7 days" },
                  { id: "biweekly", label: isArabic ? "كل أسبوعين" : "Bi-weekly", desc: isArabic ? "كل ١٤ يوم" : "Every 14 days" },
                  { id: "custom", label: isArabic ? "مخصص" : "Custom", desc: isArabic ? "حدد الأيام" : "Pick days" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCadence(item.id as any)}
                    className={`p-2.5 rounded-xl border-2 border-ink text-start space-y-0.5 transition-all cursor-pointer shadow-[2px_2px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 ${
                      cadence === item.id
                        ? "bg-lime text-ink"
                        : "bg-surface text-muted hover:text-ink"
                    }`}
                  >
                    <span className="font-extrabold text-xs sm:text-sm block text-ink">{item.label}</span>
                    <span className="text-xs text-muted block font-medium">{item.desc}</span>
                  </button>
                ))}
              </div>

              {/* Custom Cadence Slider */}
              {cadence === "custom" && (
                <div className="p-3 rounded-xl bg-bg border-2 border-ink space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-ink">
                    <span>{isArabic ? "استقطاع تلقائي كل:" : "Auto-save every:"}</span>
                    <span className="font-extrabold text-sm text-violet">
                      {customCadenceDays} {isArabic ? "أيام" : "days"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={customCadenceDays}
                    onChange={(e) => setCustomCadenceDays(Number(e.target.value))}
                    className="w-full accent-violet cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted font-bold">
                    <span>1 {isArabic ? "يوم" : "day"}</span>
                    <span>15 {isArabic ? "يوم" : "days"}</span>
                    <span>30 {isArabic ? "يوم" : "days"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Save a bit more each time (optional) */}
            <div className="space-y-1.5 pt-2 border-t border-ink/10">
              <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-violet" />
                <span>{t("onboarding.incrementalLabel")}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { type: "none", val: 0, label: t("onboarding.incrementalFixed") },
                  { type: "fixed", val: 0.1, label: t("onboarding.incremental100") },
                  { type: "fixed", val: 0.25, label: t("onboarding.incremental250") },
                  { type: "fixed", val: 1.0, label: t("onboarding.incremental1kwd") },
                ].map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    translate="no"
                    onClick={() => {
                      setIncrementalType(opt.type as any);
                      setIncrementalValue(opt.val);
                    }}
                    className={`notranslate py-2 px-2.5 rounded-xl border-2 border-ink text-xs font-bold transition-all cursor-pointer shadow-[2px_2px_0_var(--ink)] ${
                      incrementalType === opt.type && incrementalValue === opt.val
                        ? "bg-violet text-white"
                        : "bg-surface text-ink hover:bg-bg"
                    }`}
                  >
                    <span translate="no" className="notranslate">{opt.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted">
                {t("onboarding.incrementalDesc")}
              </p>
            </div>

            {/* Allowance / Salary Day */}
            <div className="space-y-1.5 pt-2 border-t border-ink/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-ink block">
                  {t("onboarding.allowanceDayLabel")}
                </label>
                <span className="text-xs text-muted font-medium">
                  {t("onboarding.allowanceDayHint")}
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="31"
                autoComplete="off"
                enterKeyHint="next"
                value={allowanceDay}
                onChange={(e) => setAllowanceDay(Number(e.target.value))}
                className="w-full bg-bg border-2 border-ink text-ink rounded-xl px-4 py-2.5 text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-violet/30"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="btn-hard w-full py-3.5 px-6 bg-lime text-ink font-extrabold text-base shadow-[4px_4px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t("onboarding.nextAction")}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: Who keeps you honest? ── */}
        {step === 3 && (
          <form onSubmit={handleNextStep3} className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight leading-tight font-heading">
                {t("onboarding.step3Title")}
              </h1>
              <p className="text-xs sm:text-sm text-muted font-medium">
                {t("onboarding.step3Sub")}
              </p>
            </div>

            {/* Keyholder Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink block">
                {t("onboarding.keyholderNameLabel")}
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                enterKeyHint="next"
                value={keyholderName}
                onChange={(e) => setKeyholderName(e.target.value)}
                placeholder="Ahmed"
                className="w-full bg-bg border-2 border-ink text-ink placeholder:text-muted/60 rounded-xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all font-semibold"
              />
            </div>

            {/* Keyholder Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink block">
                {t("onboarding.keyholderEmailLabel")}
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                enterKeyHint="next"
                value={keyholderEmail}
                onChange={(e) => {
                  setKeyholderEmail(e.target.value);
                  if (emailSentNotice) setEmailSentNotice(null);
                }}
                placeholder={t("onboarding.keyholderEmailPlaceholder")}
                className="w-full bg-bg border-2 border-ink text-ink placeholder:text-muted/60 rounded-xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all font-semibold"
              />
              <p className="text-xs text-muted">
                {isArabic
                  ? "سنرسل بريداً إلكترونياً رسمياً لصاحبك برابط خاص ليحدد رمزه السري لحفظ انضباطك."
                  : "We'll email your keyholder a private invite to set their secret approval PIN."}
              </p>
            </div>

            {/* Relationship */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink block">
                {t("onboarding.keyholderRelLabel")}
              </label>
              <input
                type="text"
                autoComplete="off"
                enterKeyHint="done"
                value={keyholderRel}
                onChange={(e) => setKeyholderRel(e.target.value)}
                placeholder={t("onboarding.keyholderRelPlaceholder")}
                className="w-full bg-bg border-2 border-ink text-ink placeholder:text-muted/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all font-medium"
              />
            </div>

            {/* ── Keyholder Invite Link Card (Friend sets secret PIN via this link) ── */}
            <div className="p-4 sm:p-5 rounded-2xl bg-bg border-2 border-ink shadow-[3px_3px_0_var(--ink)] space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-lime border-2 border-ink flex items-center justify-center text-ink font-black text-sm shadow-[1.5px_1.5px_0_var(--ink)]">
                    🔑
                  </span>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-ink">
                      {isArabic ? "رابط دعوة حامل المفتاح الخاص" : "Private Keyholder Invite Link"}
                    </h3>
                    <p className="text-xs text-muted font-medium">
                      {isArabic ? "صاحبك يحدد رقمه السري بنفسه" : "Your friend sets their own secret PIN"}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet/15 text-violet border border-ink font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-violet" />
                  <span>{isArabic ? "خاص وسري" : "Private & Secret"}</span>
                </span>
              </div>

              {/* Explanatory callout explaining that the user will NEVER see the PIN */}
              <div className="p-3 rounded-xl bg-surface border border-ink/20 text-xs text-muted leading-relaxed font-medium">
                {isArabic ? (
                  <>
                    أرسل هذا الرابط إلى <strong className="text-ink font-bold">{keyholderName || "صاحبك"}</strong>. سيفتحه ليضع رقمه السري المكوّن من ٦ أرقام. <strong className="text-ink font-bold">أنت لن ترى رمزه أبداً</strong> حتى لا تتمكن من كسر الخزينة إلا بإذنه وموافقته!
                  </>
                ) : (
                  <>
                    Send this link to <strong className="text-ink font-bold">{keyholderName || "your keyholder"}</strong>. They will open it to set their secret 6-digit PIN. <strong className="text-ink font-bold">You will never see this PIN</strong>, keeping you honest so you cannot break the vault early without them!
                  </>
                )}
              </div>

              {/* Link Input & Copy Button */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-surface border-2 border-ink rounded-xl px-3 py-2 text-xs font-mono text-ink truncate select-all">
                  {inviteUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="btn-hard py-2 px-3.5 bg-surface text-ink font-bold text-xs shadow-[2px_2px_0_var(--ink)] hover:bg-lime flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedInvite ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-mint" />
                      <span>{isArabic ? "تم النسخ!" : "Copied!"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isArabic ? "نسخ الرابط" : "Copy Link"}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Send Email Invite Action */}
              <button
                type="button"
                disabled={sendingEmail}
                onClick={handleSendEmailInvite}
                className="btn-hard w-full py-2.5 px-4 bg-violet text-white font-extrabold text-xs sm:text-sm shadow-[2px_2px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sendingEmail ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>
                      {isArabic
                        ? `إرسال الدعوة إلى ${keyholderName || "حامل المفتاح"} عبر الإيميل`
                        : `Send Email Invite to ${keyholderName || "Keyholder"}`}
                    </span>
                  </>
                )}
              </button>

              {emailSentNotice && (
                <div className="p-3 rounded-xl bg-lime/30 border-2 border-ink text-ink font-bold text-xs flex items-center gap-2 shadow-[2px_2px_0_var(--ink)]">
                  <CheckCircle2 className="w-4 h-4 text-ink shrink-0" />
                  <span>{emailSentNotice}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="btn-hard w-full py-3.5 px-6 bg-lime text-ink font-extrabold text-base shadow-[4px_4px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t("onboarding.nextAction")}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 4: Add your card ── */}
        {step === 4 && (
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight leading-tight font-heading">
                {t("onboarding.step4Title")}
              </h1>
              <p className="text-xs sm:text-sm text-muted font-medium">
                {t("onboarding.step4Sub")}
              </p>
            </div>

            {savedCard ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-bg border-2 border-ink shadow-[2px_2px_0_var(--ink)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-lime border-2 border-ink flex items-center justify-center text-ink shadow-[2px_2px_0_var(--ink)]">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-ink">
                          {savedCard.brand} •••• {savedCard.last4}
                        </h3>
                        <p className="text-xs text-mint flex items-center gap-1.5 mt-0.5 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Saved as default payment method</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSavedCard(null)}
                      className="text-xs text-muted hover:text-ink underline font-bold cursor-pointer"
                    >
                      Change card
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCreateVault}
                  className="btn-hard w-full py-3.5 px-6 bg-lime text-ink font-extrabold text-base shadow-[4px_4px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{t("onboarding.finishAction")}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <StripeCardForm
                userName={currentUser?.name}
                userEmail={currentUser?.email}
                onSuccess={(card) => {
                  setSavedCard(card);
                  handleCreateVault();
                }}
                onSkip={handleCreateVault}
                submitLabel={t("onboarding.finishAction")}
                skipLabel={t("onboarding.skipCard")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
