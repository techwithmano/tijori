"use client";

import React, { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CreditCard, Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

import { useT } from "@/lib/i18n";

interface StripeCardFormProps {
  onSuccess: (card: { brand: string; last4: string }) => void;
  onSkip?: () => void;
  submitLabel?: string;
  skipLabel?: string;
}

function InnerCardForm({
  onSuccess,
  onSkip,
  submitLabel = "Save Card & Link Vault",
  skipLabel = "Skip for now",
  isTestMode = true,
}: {
  onSuccess: (card: { brand: string; last4: string }) => void;
  onSkip?: () => void;
  submitLabel?: string;
  skipLabel?: string;
  isTestMode?: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const { setupIntent, error } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Failed to confirm card.");
        setLoading(false);
        return;
      }

      if (setupIntent) {
        // Save confirmed card to our backend
        const saveRes = await fetch("/api/stripe/save-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setupIntentId: setupIntent.id }),
        });
        const data = await saveRes.json();

        if (data.success) {
          onSuccess(data.card || { brand: "Visa", last4: "4242" });
        } else {
          setErrorMessage(data.error || "Failed to save payment method.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseTestCard = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/stripe/save-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useTestCard: true }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.card || { brand: "Visa", last4: "4242" });
      } else {
        setErrorMessage(data.error || "Could not attach test card.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Test card setup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {isTestMode && (
        <div className="p-3.5 rounded-xl bg-[var(--raised)] border border-[var(--line)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span>
              <strong>Test mode:</strong> use <code className="text-[var(--text)] font-mono">4242 4242 4242 4242</code>, any future date, any CVC.
            </span>
          </div>
          <button
            type="button"
            onClick={handleUseTestCard}
            disabled={loading}
            className="px-2.5 py-1 rounded-full bg-[var(--line)] hover:bg-[var(--accent)] hover:text-[var(--bg)] text-[var(--text)] transition-colors font-medium text-xs shrink-0"
          >
            Auto-fill Test Card
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-2 pt-2">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full py-4 rounded-full bg-[var(--accent)] text-[var(--bg)] font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(198,255,61,0.25)] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Card...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>{submitLabel}</span>
            </>
          )}
        </button>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={loading}
            className="w-full py-3 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            {skipLabel}
          </button>
        )}
      </div>
    </form>
  );
}

export default function StripeCardForm({
  onSuccess,
  onSkip,
  submitLabel = "Save Card & Link Vault",
  skipLabel = "Skip for now",
}: StripeCardFormProps) {
  const { lang } = useT();
  const isArabic = lang === "ar";
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(true);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/stripe/setup-intent", { method: "POST" });
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to initialize card setup.");
        }

        setClientSecret(data.clientSecret);
        setIsTestMode(data.isTestMode);

        const pubKey = data.publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (pubKey && !pubKey.includes("placeholder")) {
          setStripePromise(loadStripe(pubKey));
        } else {
          // If no valid publishable key configured yet, allow fallback test card setup
          setInitError("Stripe publishable key is not configured in .env.local");
        }
      } catch (err: any) {
        console.error("Card form init error:", err);
        setInitError(err.message || "Failed to initialize card setup.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const handleFallbackTestCard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/save-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useTestCard: true }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.card || { brand: "Visa", last4: "4242" });
      } else {
        alert(data.error || "Failed to attach test card");
      }
    } catch (e: any) {
      alert(e.message || "Test card failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-[var(--muted)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
        <p className="text-sm font-medium">Securing connection to Stripe...</p>
      </div>
    );
  }

  // Fallback view when publishable key is not set or Elements cannot load
  if (initError || !stripePromise || !clientSecret) {
    return (
      <div className="space-y-5">
        <div className="p-6 rounded-2xl bg-surface border border-line space-y-4 shadow-card">
          <div className="flex items-center gap-3 text-accent">
            <CreditCard className="w-6 h-6" />
            <h4 className="font-extrabold text-base text-text">
              {isArabic ? "ربط البطاقة البنكية التلقائية" : "Automated Card Deduction"}
            </h4>
          </div>

          <p className="text-sm text-muted leading-relaxed">
            {isArabic
              ? "يتم ربط بطاقتك بأمان للاستقطاع التلقائي في مواعيد التوفير المحددة لحماية أهدافك من الصرف اللحظي."
              : "Link your debit or credit card securely for automatic recurring micro-savings to protect your goals from impulse urges."}
          </p>

          {isTestMode && (
            <div className="p-3.5 rounded-xl bg-raised border border-line text-xs text-muted flex items-start gap-2">
              <span className="font-bold text-accent shrink-0">
                {isArabic ? "وضع التجربة:" : "Test Mode:"}
              </span>
              <span>
                {isArabic
                  ? "استخدم 4242 4242 4242 4242 مع أي تاريخ مستقبلي ورمز CVC للتجربة الفورية."
                  : "Use 4242 4242 4242 4242 with any future expiry date and CVC for instant testing."}
              </span>
            </div>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={handleFallbackTestCard}
            className="w-full py-4 rounded-btn bg-accent text-accent-foreground font-extrabold text-base hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-limeGlow disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>
              {isArabic
                ? "ربط بطاقة تجريبية (Visa •••• 4242)"
                : "Link Test Card (Visa •••• 4242)"}
            </span>
          </button>
        </div>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full py-3 text-xs sm:text-sm text-muted hover:text-text transition-colors"
          >
            {skipLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#C6FF3D",
            colorBackground: "#15131F",
            colorText: "#F5F3FF",
            colorDanger: "#FF5C7A",
            borderRadius: "16px",
          },
        },
      }}
    >
      <InnerCardForm
        onSuccess={onSuccess}
        onSkip={onSkip}
        submitLabel={submitLabel}
        skipLabel={skipLabel}
        isTestMode={isTestMode}
      />
    </Elements>
  );
}
