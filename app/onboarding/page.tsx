"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Shield,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Lock,
  HeartHandshake,
  Calendar,
  Smartphone,
  KeyRound,
  Coins,
  TrendingUp,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { formatKWD } from "@/lib/utils";
import StripeCardForm from "@/components/StripeCardForm";

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

  // Step 3: Keyholder
  const [keyholderName, setKeyholderName] = useState("Ahmed");
  const [keyholderPhone, setKeyholderPhone] = useState("");
  const [keyholderRel, setKeyholderRel] = useState("Best Friend");
  const [keyholderPin, setKeyholderPin] = useState("123456");

  // Phone Validation: Kuwait mobile numbers are 8 digits
  const validatePhone = (num: string): boolean => {
    const cleaned = num.replace(/\s+/g, "").replace(/^\+965/, "");
    return /^[569]\d{7}$/.test(cleaned) || cleaned.length === 8;
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
      setError(isArabic ? "يرجى كتابة اسم حامل المفتاح." : "Please enter your Keyholder's name.");
      return;
    }
    if (!keyholderPhone.trim() || !validatePhone(keyholderPhone)) {
      setError(t("onboarding.phoneValidation"));
      return;
    }
    if (!/^\d{6}$/.test(keyholderPin)) {
      setError(isArabic ? "رمز PIN لحامل المفتاح يجب أن يكون 6 أرقام." : "Keyholder PIN must be exactly 6 digits.");
      return;
    }
    setStep(4);
  };

  const handleCreateVault = async () => {
    setLoading(true);
    setError(null);

    const cleanedPhone = keyholderPhone.replace(/\s+/g, "");
    const formattedPhone = cleanedPhone.startsWith("+")
      ? cleanedPhone
      : `+965 ${cleanedPhone}`;

    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: goalName.trim(),
          targetAmount: Number(targetAmount),
          pullAmount: Number(pullAmount),
          cadence: cadence === "custom" ? "weekly" : cadence,
          customCadenceDays: cadence === "custom" ? customCadenceDays : undefined,
          incrementalSavingsType: incrementalType,
          incrementalSavingsValue: incrementalType !== "none" ? incrementalValue : 0,
          allowanceDay: Number(allowanceDay) || 25,
          keyholderPin: keyholderPin.trim() || "123456",
          keyholder: {
            name: keyholderName.trim(),
            phone: formattedPhone,
            relationship: keyholderRel.trim() || "Friend",
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
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

  const progressPercentage = (step / 4) * 100;

  return (
    <div className="min-h-[85vh] flex flex-col justify-center max-w-2xl mx-auto px-4 py-8">
      {/* Top Header & Progress Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as any) : 1))}
                className="inline-flex items-center gap-1 text-muted hover:text-ink font-bold transition-colors me-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t("onboarding.backAction")}</span>
              </button>
            )}
            <span className="font-extrabold text-ink">
              {t("onboarding.stepCount", { current: step, total: 4 })}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime border-2 border-ink text-xs font-bold text-ink shadow-[2px_2px_0_var(--ink)]">
            <Lock className="w-3.5 h-3.5 text-ink" />
            <span>
              {isArabic ? "إعداد خزينة تِجوري" : "Anti-Impulse Vault Setup"}
            </span>
          </div>
        </div>

        {/* Neobrutalist Progress Bar */}
        <div className="w-full h-3 bg-surface rounded-full overflow-hidden border-2 border-ink shadow-[2px_2px_0_var(--ink)]">
          <div
            className="h-full bg-lime border-e-2 border-ink transition-all duration-300 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Card */}
      <div className="card-hard bg-surface p-6 sm:p-10 shadow-[4px_4px_0_var(--ink)] space-y-8">
        {error && (
          <div className="p-3.5 rounded-xl bg-coral/20 border-2 border-ink text-ink font-bold text-xs flex items-center gap-2 shadow-[2px_2px_0_var(--ink)]">
            <AlertCircle className="w-4 h-4 text-coral shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── STEP 1: What are you saving for? ── */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight leading-tight font-heading">
                {t("onboarding.step1Title")}
              </h1>
              <p className="text-sm sm:text-base text-muted font-medium">
                {t("onboarding.step1Sub")}
              </p>
            </div>

            {/* Quick-Pick Chips */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted block">
                {isArabic ? "اقتراحات سريعة:" : "Quick suggestions:"}
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
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border-2 border-ink transition-all cursor-pointer shadow-[2px_2px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 ${
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
            <div className="space-y-2">
              <label className="text-xs font-bold text-ink block">
                {t("onboarding.goalNameLabel")}
              </label>
              <input
                type="text"
                required
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder={t("onboarding.goalNamePlaceholder")}
                className="w-full bg-bg border-2 border-ink text-ink placeholder:text-muted/60 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all font-semibold"
              />
            </div>

            {/* Target Amount Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-ink block">
                {t("onboarding.targetAmountLabel")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full bg-bg border-2 border-ink text-ink placeholder:text-muted/60 rounded-xl px-4 py-3.5 text-2xl font-extrabold tabular-nums pe-20 focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all font-heading"
                />
                <span className="absolute inset-y-0 end-4 flex items-center text-sm font-extrabold text-ink pointer-events-none">
                  {isArabic ? "د.ك" : "KWD"}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn-hard w-full py-4 px-6 bg-lime text-ink font-extrabold text-base shadow-[4px_4px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 pt-3 cursor-pointer"
            >
              <span>{t("onboarding.nextAction")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>
        )}

        {/* ── STEP 2: Flexible Pacing ── */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight leading-tight font-heading">
                {t("onboarding.step2Title")}
              </h1>
              <p className="text-sm sm:text-base text-muted font-medium">
                {isArabic
                  ? "تحكّم في وتيرة الادخار وسرعته حسب ميزانيتك وموعد راتبك."
                  : "Customize cadence, frequency, and micro-savings according to your budget."}
              </p>
            </div>

            {/* Amount Per Tuck */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-ink block">
                {t("onboarding.pullAmountLabel")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  required
                  value={pullAmount}
                  onChange={(e) => setPullAmount(e.target.value)}
                  className="w-full bg-bg border-2 border-ink text-ink placeholder:text-muted/60 rounded-xl px-4 py-3.5 text-2xl font-extrabold tabular-nums pe-20 focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all font-heading"
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
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border-2 border-ink transition-all tabular-nums cursor-pointer shadow-[2px_2px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 ${
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

            {/* Cadence Selector: Daily, Weekly, Bi-weekly, Monthly, Custom */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-ink block">
                {isArabic ? "وتيرة الاستقطاع:" : "Savings Frequency:"}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                    className={`p-3 rounded-2xl border-2 border-ink text-start space-y-0.5 transition-all cursor-pointer shadow-[2px_2px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 ${
                      cadence === item.id
                        ? "bg-lime text-ink"
                        : "bg-surface text-muted hover:text-ink"
                    }`}
                  >
                    <span className="font-black text-sm block text-ink">{item.label}</span>
                    <span className="text-[11px] text-muted block font-medium">{item.desc}</span>
                  </button>
                ))}
              </div>

              {/* Custom Cadence Slider */}
              {cadence === "custom" && (
                <div className="p-4 rounded-2xl bg-bg border-2 border-ink space-y-2 mt-2">
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
                  <div className="flex justify-between text-[10px] text-muted font-bold">
                    <span>1 {isArabic ? "يوم" : "day"}</span>
                    <span>15 {isArabic ? "يوم" : "days"}</span>
                    <span>30 {isArabic ? "يوم" : "days"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Incremental Savings (Micro-scaling) */}
            <div className="space-y-2 pt-2 border-t-2 border-ink/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-ink block flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-violet" />
                  <span>{isArabic ? "زيادة تدريجية ذكية (اختياري)" : "Incremental Savings Step (Optional)"}</span>
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { type: "none", val: 0, label: isArabic ? "ثابت" : "Fixed Amount" },
                  { type: "fixed", val: 0.1, label: "+100 fils" },
                  { type: "fixed", val: 0.25, label: "+250 fils" },
                  { type: "fixed", val: 1.0, label: "+1.0 KWD" },
                ].map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setIncrementalType(opt.type as any);
                      setIncrementalValue(opt.val);
                    }}
                    className={`py-2 px-3 rounded-xl border-2 border-ink text-xs font-bold transition-all cursor-pointer shadow-[2px_2px_0_var(--ink)] ${
                      incrementalType === opt.type && incrementalValue === opt.val
                        ? "bg-violet text-white"
                        : "bg-surface text-ink hover:bg-bg"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted">
                {isArabic
                  ? "يزيد مبلغ التوفير تلقائياً بمقدار بسيط مع كل إيداع لرفع وتيرة التوفير بدون مجهود."
                  : "Slightly scales up each tuck to accelerate your savings streak over time."}
              </p>
            </div>

            {/* Allowance / Salary Day */}
            <div className="space-y-2 pt-2 border-t-2 border-ink/10">
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
                value={allowanceDay}
                onChange={(e) => setAllowanceDay(Number(e.target.value))}
                className="w-full bg-bg border-2 border-ink text-ink rounded-xl px-4 py-3 text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-violet/30"
              />
            </div>

            <button
              type="submit"
              className="btn-hard w-full py-4 px-6 bg-lime text-ink font-extrabold text-base shadow-[4px_4px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 pt-3 cursor-pointer"
            >
              <span>{t("onboarding.nextAction")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>
        )}

        {/* ── STEP 3: Who keeps you honest? ── */}
        {step === 3 && (
          <form onSubmit={handleNextStep3} className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight leading-tight font-heading">
                {t("onboarding.step3Title")}
              </h1>
              <p className="text-sm sm:text-base text-muted font-medium">
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
                value={keyholderName}
                onChange={(e) => setKeyholderName(e.target.value)}
                placeholder="Ahmed"
                className="w-full bg-bg border-2 border-ink text-ink placeholder:text-muted/60 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all font-semibold"
              />
            </div>

            {/* Keyholder WhatsApp Number with +965 default */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink block">
                {t("onboarding.keyholderPhoneLabel")}
              </label>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-4 rounded-xl bg-bg border-2 border-ink text-xs font-extrabold text-ink font-mono select-none">
                  +965
                </span>
                <input
                  type="tel"
                  required
                  value={keyholderPhone}
                  onChange={(e) => setKeyholderPhone(e.target.value)}
                  placeholder={t("onboarding.keyholderPhonePlaceholder")}
                  className="flex-1 bg-bg border-2 border-ink text-ink placeholder:text-muted/60 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all font-mono font-bold"
                />
              </div>
              <p className="text-xs text-muted">
                {isArabic
                  ? "رقم واتساب كويتي صالح (٨ أرقام). تُرسل له طلبات الإذن بكسر الخزينة."
                  : "Must be an active Kuwait WhatsApp number. Single-use unlock requests are sent here."}
              </p>
            </div>

            {/* Keyholder 6-Digit Authorization PIN */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-bg border-2 border-ink shadow-[2px_2px_0_var(--ink)]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-violet" />
                  <span>{isArabic ? "رمز PIN المعتمد لحامل المفتاح (٦ أرقام)" : "Keyholder 6-Digit Approval PIN"}</span>
                </label>
                <span className="text-[10px] bg-lime px-2 py-0.5 rounded-full border border-ink font-bold text-ink">
                  {isArabic ? "حماية مضاعفة" : "High Security"}
                </span>
              </div>
              <input
                type="text"
                maxLength={6}
                value={keyholderPin}
                onChange={(e) => setKeyholderPin(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full bg-surface border-2 border-ink text-ink font-mono font-extrabold tracking-widest text-lg rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet/30 text-center"
              />
              <p className="text-[11px] text-muted">
                {isArabic
                  ? `يقوم ${keyholderName || "أحمد"} بإدخال هذا الرمز للموافقة على فك القفل مع خصم ٥٪ فقط كرسوم تشغيل.`
                  : `${keyholderName || "Ahmed"} must enter this PIN to authorize an unlock with only a 5% handling fee.`}
              </p>
            </div>

            {/* Relationship */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink block">
                {t("onboarding.keyholderRelLabel")}
              </label>
              <input
                type="text"
                value={keyholderRel}
                onChange={(e) => setKeyholderRel(e.target.value)}
                placeholder={t("onboarding.keyholderRelPlaceholder")}
                className="w-full bg-bg border-2 border-ink text-ink placeholder:text-muted/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              className="btn-hard w-full py-4 px-6 bg-lime text-ink font-extrabold text-base shadow-[4px_4px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 pt-3 cursor-pointer"
            >
              <span>{t("onboarding.nextAction")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>
        )}

        {/* ── STEP 4: Add your card ── */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight leading-tight font-heading">
                {t("onboarding.step4Title")}
              </h1>
              <p className="text-sm sm:text-base text-muted font-medium">
                {t("onboarding.step4Sub")}
              </p>
            </div>

            {savedCard ? (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-bg border-2 border-ink shadow-[2px_2px_0_var(--ink)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-lime border-2 border-ink flex items-center justify-center text-ink shadow-[2px_2px_0_var(--ink)]">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-ink">
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
                  className="btn-hard w-full py-4 px-6 bg-lime text-ink font-extrabold text-base shadow-[4px_4px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
