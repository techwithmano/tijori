"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import {
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  User as UserIcon,
  Calendar,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { useT } from "@/lib/i18n";

interface StripeCardFormProps {
  onSuccess: (card: { brand: string; last4: string }) => void;
  onSkip?: () => void;
  submitLabel?: string;
  skipLabel?: string;
  userName?: string;
  userEmail?: string;
}

export default function StripeCardForm({
  onSuccess,
  onSkip,
  submitLabel,
  skipLabel,
  userName,
  userEmail,
}: StripeCardFormProps) {
  const { lang } = useT();
  const isArabic = lang === "ar";

  // Default cardholder name
  const defaultName = (userName || "").trim() || (isArabic ? "اسم حامل البطاقة" : "Cardholder Name");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/34");
  const [cvc, setCvc] = useState("123");
  const [cardholderName, setCardholderName] = useState(defaultName);
  const [zip, setZip] = useState("12345");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Format card number with spaces every 4 digits
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  // Format expiry MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length > 2) {
      raw = raw.slice(0, 2) + "/" + raw.slice(2);
    }
    setExpiry(raw);
  };

  // Format CVC
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvc(raw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      // Submit to our backend save-card endpoint in test mode
      const res = await fetch("/api/stripe/save-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useTestCard: true,
          cardholderName: cardholderName.trim() || defaultName,
          last4: cardNumber.replace(/\s/g, "").slice(-4) || "4242",
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#CFFF3A", "#6B4DFF", "#2DE0A5", "#14102B"],
        });

        onSuccess(
          data.card || {
            brand: "Visa",
            last4: cardNumber.replace(/\s/g, "").slice(-4) || "4242",
          }
        );
      } else {
        setErrorMessage(data.error || (isArabic ? "تعذر حفظ البطاقة" : "Failed to save card"));
      }
    } catch (err: any) {
      setErrorMessage(err.message || (isArabic ? "حدث خطأ غير متوقع" : "An unexpected error occurred"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir={isArabic ? "rtl" : "ltr"}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT: Realistic Tactile Credit Card Visual ── */}
        <div className="lg:col-span-5 w-full flex flex-col items-center sm:items-start gap-4">
          <div className="w-full max-w-sm aspect-[1.586/1] rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#1C1838] via-[#14102B] to-[#2B1B54] text-white border-3 border-ink shadow-[6px_6px_0_var(--ink)] relative overflow-hidden flex flex-col justify-between select-none">
            {/* Glossy ambient glow */}
            <div className="pointer-events-none absolute -right-10 -top-10 w-44 h-44 rounded-full bg-violet/30 blur-2xl" />
            <div className="pointer-events-none absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-lime/15 blur-2xl" />

            {/* Top Row: Metallic Chip, Contactless Icon, Sandbox Pill */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Gold Card Chip */}
                <div className="w-11 h-8 rounded-lg bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 border border-amber-600/70 p-1 flex items-center justify-center shadow-inner">
                  <div className="w-full h-full border border-amber-700/40 rounded flex items-center justify-center">
                    <div className="w-3 h-2 border-t border-b border-amber-800/50" />
                  </div>
                </div>
                {/* Contactless symbol */}
                <span className="text-white/70 text-xs font-mono font-bold tracking-tighter">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M8.5 16.5a5 5 0 0 1 0-7" strokeLinecap="round" />
                    <path d="M12 19a8.5 8.5 0 0 0 0-12" strokeLinecap="round" />
                    <path d="M15.5 21.5a12 12 0 0 0 0-17" strokeLinecap="round" />
                  </svg>
                </span>
              </div>

              {/* Sandbox Badge */}
              <div className="px-2.5 py-0.5 rounded-full bg-lime/20 border border-lime text-lime font-mono text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0_rgba(0,0,0,0.5)]">
                {isArabic ? "بطاقة تجريبية" : "Test Mode"}
              </div>
            </div>

            {/* Middle Row: Live Monospace Card Number */}
            <div className="relative z-10 my-auto pt-3">
              <div className="font-mono text-lg sm:text-xl font-black tracking-widest text-white drop-shadow-sm select-all">
                {cardNumber || "4242 •••• •••• 4242"}
              </div>
            </div>

            {/* Bottom Row: Cardholder Name, Expiry, Visa Logo */}
            <div className="relative z-10 flex items-end justify-between gap-3 pt-2">
              <div className="space-y-0.5 overflow-hidden">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-white/50 block">
                  {isArabic ? "حامل البطاقة" : "CARDHOLDER"}
                </span>
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white truncate block font-heading">
                  {cardholderName || "ABDULRAHMAN HARAMAIN"}
                </span>
              </div>

              <div className="space-y-0.5 text-center shrink-0">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-white/50 block">
                  {isArabic ? "الانتهاء" : "EXPIRES"}
                </span>
                <span className="text-xs sm:text-sm font-extrabold tracking-widest text-white font-mono block">
                  {expiry || "12/34"}
                </span>
              </div>

              {/* Stylized Visa Logo */}
              <div className="shrink-0 text-white font-black italic tracking-tighter text-xl px-2 py-0.5 bg-white/10 rounded-md border border-white/20">
                VISA
              </div>
            </div>
          </div>

          {/* Security & Reassurance note */}
          <div className="w-full max-w-sm p-3.5 rounded-2xl bg-bg border-2 border-ink text-xs space-y-1.5 shadow-[2px_2px_0_var(--ink)]">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <ShieldCheck className="w-4 h-4 text-mint shrink-0" />
              <span>{isArabic ? "توثيق آمن ومعتمد من سترايب" : "Secured & Encrypted via Stripe"}</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed font-medium">
              {isArabic
                ? "لن يتم خصم أموال حقيقية في وضع التجربة. يتم حفظ البطاقة لتفعيل الاستقطاع التلقائي المنتظم لحماية أهدافك."
                : "No real money is charged during setup. Test cards enable automated micro-saves for your vault."}
            </p>
          </div>
        </div>

        {/* ── RIGHT: Pre-filled Card Inputs (Editable Form) ── */}
        <div className="lg:col-span-7 w-full">
          <form
            onSubmit={handleSubmit}
            className="card-hard bg-surface border-3 border-ink rounded-3xl p-5 sm:p-7 shadow-[6px_6px_0_var(--ink)] space-y-4"
          >
            {/* Header Tag */}
            <div className="flex items-center justify-between pb-1 border-b-2 border-ink/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-lime border-2 border-ink flex items-center justify-center text-ink shadow-[1.5px_1.5px_0_var(--ink)]">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-ink font-heading">
                    {isArabic ? "بيانات البطاقة البنكية" : "Card Information"}
                  </h3>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-lime/20 border border-lime text-ink text-xs font-bold">
                <Sparkles className="w-3 h-3 text-violet" />
                <span>{isArabic ? "معبأ مسبقاً للتجربة" : "Pre-filled Demo"}</span>
              </div>
            </div>

            {/* Field: Card Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-ink block">
                {isArabic ? "رقم البطاقة" : "Card number"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoComplete="cc-number"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="4242 4242 4242 4242"
                  className="w-full bg-bg border-2 border-ink text-ink font-mono font-bold rounded-xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all tracking-wider"
                />
                <div className="absolute end-3.5 top-3 flex items-center gap-1.5 pointer-events-none">
                  <span className="text-xs font-black italic text-violet bg-violet/10 px-1.5 py-0.5 rounded border border-violet/20">
                    VISA
                  </span>
                  <Lock className="w-3.5 h-3.5 text-muted" />
                </div>
              </div>
            </div>

            {/* Row: Expiry & CVC */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-ink flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  <span>{isArabic ? "تاريخ الانتهاء" : "Expiration"}</span>
                </label>
                <input
                  type="text"
                  required
                  autoComplete="cc-exp"
                  value={expiry}
                  onChange={handleExpiryChange}
                  placeholder="12/34"
                  className="w-full bg-bg border-2 border-ink text-ink font-mono font-bold rounded-xl px-3.5 py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all text-center tracking-wider"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-ink flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-muted" />
                  <span>{isArabic ? "رمز الأمان CVC" : "CVC"}</span>
                </label>
                <input
                  type="text"
                  required
                  autoComplete="cc-csc"
                  value={cvc}
                  onChange={handleCvcChange}
                  placeholder="123"
                  className="w-full bg-bg border-2 border-ink text-ink font-mono font-bold rounded-xl px-3.5 py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all text-center tracking-wider"
                />
              </div>
            </div>

            {/* Field: Name on card */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-ink flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-muted" />
                <span>{isArabic ? "الاسم على البطاقة" : "Cardholder name"}</span>
              </label>
              <input
                type="text"
                required
                autoComplete="cc-name"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder={isArabic ? "اسم حامل البطاقة" : "Cardholder Name"}
                className="w-full bg-bg border-2 border-ink text-ink font-bold rounded-xl px-4 py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all"
              />
            </div>

            {/* Field: ZIP / Postal Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-ink block">
                {isArabic ? "الرمز البريدي" : "ZIP / Postal code"}
              </label>
              <input
                type="text"
                autoComplete="postal-code"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="12345"
                className="w-full bg-bg border-2 border-ink text-ink font-mono font-bold rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-coral/20 border-2 border-ink text-ink text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0_var(--ink)]">
                <AlertCircle className="w-4 h-4 text-coral shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Primary Save Card Button */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                id="save-card-submit-btn"
                disabled={loading}
                className="btn-hard w-full py-4 rounded-full bg-lime text-ink font-black text-sm sm:text-base shadow-[4px_4px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-ink" />
                    <span>{isArabic ? "جاري توثيق البطاقة مع سترايب..." : "Securing with Stripe..."}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-ink" />
                    <span>{submitLabel || (isArabic ? "حفظ البطاقة وربط الخزينة" : "Save Card & Link Vault")}</span>
                  </>
                )}
              </button>

              {onSkip && (
                <button
                  type="button"
                  id="skip-card-setup-btn"
                  onClick={onSkip}
                  disabled={loading}
                  className="w-full py-2.5 text-xs sm:text-sm text-muted hover:text-ink font-bold transition-colors cursor-pointer text-center block"
                >
                  {skipLabel || (isArabic ? "تخطي الآن والبدء بالتوفير" : "Skip for now & Start Saving")}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
