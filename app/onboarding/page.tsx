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
  Plane,
  Car,
  Coins,
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

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCard, setSavedCard] = useState<{ brand: string; last4: string } | null>(null);

  // Step 1: Goal & Target
  const [goalName, setGoalName] = useState("Japan Summer Trip");
  const [targetAmount, setTargetAmount] = useState<number | string>(500);

  // Step 2: Amount & Frequency
  const [pullAmount, setPullAmount] = useState<number | string>(25);
  const [cadence, setCadence] = useState<"weekly" | "monthly">("weekly");
  const [allowanceDay, setAllowanceDay] = useState<number>(25);

  // Step 3: Keyholder
  const [keyholderName, setKeyholderName] = useState("");
  const [keyholderPhone, setKeyholderPhone] = useState("");
  const [keyholderRel, setKeyholderRel] = useState("Best Friend");

  // Phone Validation: Kuwait mobile numbers are 8 digits
  const validatePhone = (num: string): boolean => {
    const cleaned = num.replace(/\s+/g, "").replace(/^\+965/, "");
    return /^[569]\d{7}$/.test(cleaned) || cleaned.length === 8;
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!goalName.trim()) {
      setError("Please enter what you are saving for.");
      return;
    }
    if (!targetAmount || Number(targetAmount) <= 0) {
      setError("Please enter a valid target amount.");
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pullAmount || Number(pullAmount) <= 0) {
      setError("Please enter a valid auto-save amount.");
      return;
    }
    setStep(3);
  };

  const handleNextStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!keyholderName.trim()) {
      setError("Please enter your Keyholder's name.");
      return;
    }
    if (!keyholderPhone.trim() || !validatePhone(keyholderPhone)) {
      setError(t("onboarding.phoneValidation"));
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
          cadence,
          allowanceDay: Number(allowanceDay) || 25,
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
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as any) : 1))}
                className="inline-flex items-center gap-1 text-muted hover:text-text font-bold transition-colors me-2"
              >
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{t("onboarding.backAction")}</span>
              </button>
            )}
            <span className="font-semibold text-text">
              {t("onboarding.stepCount", { current: step, total: 4 })}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-btn bg-raised border border-line text-xs font-semibold text-accent">
            <Lock className="w-3 h-3" />
            <span>Anti-Impulse Vault Setup</span>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full h-1.5 bg-raised rounded-full overflow-hidden border border-line">
          <div
            className="h-full bg-gradient-to-r from-violet to-accent transition-all duration-300 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Card Content for Steps */}
      <div className="bg-surface border border-line rounded-card p-6 sm:p-10 shadow-card space-y-8">
        {error && (
          <div className="p-3.5 rounded-xl bg-coral/10 border border-coral/30 text-coral text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* =========================================================================
            STEP 1: What are you saving for?
            ========================================================================= */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text tracking-tight leading-tight">
                {t("onboarding.step1Title")}
              </h1>
              <p className="text-sm sm:text-base text-muted">
                {t("onboarding.step1Sub")}
              </p>
            </div>

            {/* Quick-Pick Chips */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted block">Quick suggestions:</span>
              <div className="flex flex-wrap gap-2">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setGoalName(chip.defaultTitle);
                      setTargetAmount(chip.defaultAmount);
                    }}
                    className={`tactile-btn px-3.5 py-1.5 rounded-btn text-xs font-semibold border transition-all ${
                      goalName === chip.defaultTitle
                        ? "bg-raised border-accent text-accent shadow-violetSubtle"
                        : "bg-surface border-line text-muted hover:text-text hover:bg-raised/50"
                    }`}
                  >
                    {t(`onboarding.${chip.labelKey}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Title Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text block">
                {t("onboarding.goalNameLabel")}
              </label>
              <input
                type="text"
                required
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder={t("onboarding.goalNamePlaceholder")}
                className="w-full bg-raised border border-line text-text placeholder:text-muted/40 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 transition-all font-medium"
              />
            </div>

            {/* Target Amount Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text block">
                {t("onboarding.targetAmountLabel")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full bg-raised border border-line text-text placeholder:text-muted/40 rounded-xl px-4 py-3.5 text-2xl font-extrabold tabular-nums pe-20 focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 transition-all"
                />
                <span className="absolute inset-y-0 end-4 flex items-center text-sm font-bold text-accent pointer-events-none">
                  KWD
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full tactile-btn py-4 px-6 rounded-btn bg-accent text-accent-foreground font-extrabold text-sm shadow-limeGlow hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 pt-3"
            >
              <span>{t("onboarding.nextAction")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>
        )}

        {/* =========================================================================
            STEP 2: How much, how often?
            ========================================================================= */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text tracking-tight leading-tight">
                {t("onboarding.step2Title")}
              </h1>
              <p className="text-sm sm:text-base text-muted">
                {t("onboarding.step2Sub")}
              </p>
            </div>

            {/* Amount Per Tuck */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text block">
                {t("onboarding.pullAmountLabel")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  required
                  value={pullAmount}
                  onChange={(e) => setPullAmount(e.target.value)}
                  className="w-full bg-raised border border-line text-text placeholder:text-muted/40 rounded-xl px-4 py-3.5 text-2xl font-extrabold tabular-nums pe-20 focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 transition-all"
                />
                <span className="absolute inset-y-0 end-4 flex items-center text-sm font-bold text-accent pointer-events-none">
                  KWD
                </span>
              </div>

              {/* Quick amount chips */}
              <div className="flex gap-2 pt-1">
                {[10, 20, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPullAmount(amt)}
                    className={`tactile-btn px-3 py-1 rounded-btn text-xs font-bold border tabular-nums ${
                      Number(pullAmount) === amt
                        ? "bg-raised border-accent text-accent"
                        : "bg-surface border-line text-muted hover:text-text"
                    }`}
                  >
                    {amt} KWD
                  </button>
                ))}
              </div>
            </div>

            {/* Cadence Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text block">
                {t("onboarding.cadenceLabel")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCadence("weekly")}
                  className={`p-4 rounded-xl border text-start space-y-1 transition-all tactile-btn ${
                    cadence === "weekly"
                      ? "bg-raised border-accent text-text shadow-violetSubtle"
                      : "bg-surface border-line text-muted hover:border-violet/40"
                  }`}
                >
                  <span className="font-extrabold text-sm block text-text">Weekly</span>
                  <span className="text-xs text-muted block">Every 7 days quietly</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCadence("monthly")}
                  className={`p-4 rounded-xl border text-start space-y-1 transition-all tactile-btn ${
                    cadence === "monthly"
                      ? "bg-raised border-accent text-text shadow-violetSubtle"
                      : "bg-surface border-line text-muted hover:border-violet/40"
                  }`}
                >
                  <span className="font-extrabold text-sm block text-text">Monthly</span>
                  <span className="text-xs text-muted block">Day-25 deposit tuck</span>
                </button>
              </div>
            </div>

            {/* Allowance / Salary Day (optional) */}
            <div className="space-y-2 pt-1 border-t border-line">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text block">
                  {t("onboarding.allowanceDayLabel")}
                </label>
                <span className="text-xs text-muted">
                  {t("onboarding.allowanceDayHint")}
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="31"
                value={allowanceDay}
                onChange={(e) => setAllowanceDay(Number(e.target.value))}
                className="w-full bg-raised border border-line text-text rounded-xl px-4 py-3 text-sm font-semibold tabular-nums focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
              />
            </div>

            <button
              type="submit"
              className="w-full tactile-btn py-4 px-6 rounded-btn bg-accent text-accent-foreground font-extrabold text-sm shadow-limeGlow hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 pt-3"
            >
              <span>{t("onboarding.nextAction")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>
        )}

        {/* =========================================================================
            STEP 3: Who keeps you honest?
            ========================================================================= */}
        {step === 3 && (
          <form onSubmit={handleNextStep3} className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text tracking-tight leading-tight">
                {t("onboarding.step3Title")}
              </h1>
              <p className="text-sm sm:text-base text-muted">
                {t("onboarding.step3Sub")}
              </p>
            </div>

            {/* Keyholder Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text block">
                {t("onboarding.keyholderNameLabel")}
              </label>
              <input
                type="text"
                required
                value={keyholderName}
                onChange={(e) => setKeyholderName(e.target.value)}
                placeholder={t("onboarding.keyholderNamePlaceholder")}
                className="w-full bg-raised border border-line text-text placeholder:text-muted/40 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 transition-all font-medium"
              />
            </div>

            {/* Keyholder WhatsApp Number with +965 default */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text block">
                {t("onboarding.keyholderPhoneLabel")}
              </label>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-4 rounded-xl bg-raised border border-line text-xs font-bold text-accent font-mono select-none">
                  +965
                </span>
                <input
                  type="tel"
                  required
                  value={keyholderPhone}
                  onChange={(e) => setKeyholderPhone(e.target.value)}
                  placeholder={t("onboarding.keyholderPhonePlaceholder")}
                  className="flex-1 bg-raised border border-line text-text placeholder:text-muted/40 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 transition-all font-mono font-medium"
                />
              </div>
              <p className="text-xs text-muted">
                Must be an active WhatsApp number. Single-use unlock requests are sent here.
              </p>
            </div>

            {/* Relationship */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text block">
                {t("onboarding.keyholderRelLabel")}
              </label>
              <input
                type="text"
                value={keyholderRel}
                onChange={(e) => setKeyholderRel(e.target.value)}
                placeholder={t("onboarding.keyholderRelPlaceholder")}
                className="w-full bg-raised border border-line text-text placeholder:text-muted/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full tactile-btn py-4 px-6 rounded-btn bg-accent text-accent-foreground font-extrabold text-sm shadow-limeGlow hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 pt-3"
            >
              <span>{t("onboarding.nextAction")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>
        )}

        {/* =========================================================================
            STEP 4: Add your card (Real Stripe Elements with SetupIntent)
            ========================================================================= */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text tracking-tight leading-tight">
                {t("onboarding.step4Title")}
              </h1>
              <p className="text-sm sm:text-base text-muted">
                {t("onboarding.step4Sub")}
              </p>
            </div>

            {savedCard ? (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-raised border border-line space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface border border-line flex items-center justify-center text-accent">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-text">
                          {savedCard.brand} •••• {savedCard.last4}
                        </h3>
                        <p className="text-xs text-mint flex items-center gap-1.5 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Saved as default payment method</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSavedCard(null)}
                      className="text-xs text-muted hover:text-text underline"
                    >
                      Change card
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCreateVault}
                  className="w-full tactile-btn py-4 px-6 rounded-btn bg-accent text-accent-foreground font-extrabold text-sm shadow-limeGlow hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
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
