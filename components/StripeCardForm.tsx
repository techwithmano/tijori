"use client";

import React, { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CreditCard, Lock, AlertCircle, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import TestCardHelper from "@/components/TestCardHelper";

interface StripeCardFormProps {
  onSuccess: (card: { brand: string; last4: string }) => void;
  onSkip?: () => void;
  submitLabel?: string;
  skipLabel?: string;
  userName?: string;
  userEmail?: string;
}

function InnerCardForm({
  onSuccess,
  onSkip,
  submitLabel = "Save Card & Link Vault",
  skipLabel = "Skip for now",
  userName,
  userEmail,
}: {
  onSuccess: (card: { brand: string; last4: string }) => void;
  onSkip?: () => void;
  submitLabel?: string;
  skipLabel?: string;
  userName?: string;
  userEmail?: string;
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 rounded-2xl bg-surface border-2 border-ink shadow-[2px_2px_0_var(--ink)]">
        <PaymentElement
          options={{
            layout: "tabs",
            defaultValues: {
              billingDetails: {
                name: (userName || "").trim() || "Test User",
                email: (userEmail || "").trim() || undefined,
              },
            },
            fields: {
              billingDetails: {
                address: "never",
              },
            },
          }}
        />
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-coral/20 border-2 border-ink text-ink text-sm font-bold flex items-center gap-2 shadow-[2px_2px_0_var(--ink)]">
          <AlertCircle className="w-4 h-4 text-coral shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-2 pt-2">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="btn-hard w-full py-4 rounded-full bg-lime text-ink font-extrabold text-base shadow-[4px_4px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-ink" />
              <span>Saving Card...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-ink" />
              <span>{submitLabel}</span>
            </>
          )}
        </button>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={loading}
            className="w-full py-3 text-sm text-muted hover:text-ink font-bold transition-colors cursor-pointer"
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
  userName,
  userEmail,
}: StripeCardFormProps) {
  const { lang } = useT();
  const isArabic = lang === "ar";
  const [clientSecret, setClientSecret] = useState<string | null>(null);
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

        const pubKey = data.publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (pubKey && !pubKey.includes("placeholder")) {
          setStripePromise(loadStripe(pubKey));
        } else {
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

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-violet" />
        <p className="text-sm font-medium">Securing connection to Stripe...</p>
      </div>
    );
  }

  // Fallback view when publishable key is not set or Elements cannot load
  if (initError || !stripePromise || !clientSecret) {
    return (
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="w-full lg:w-72 shrink-0 order-first lg:order-last">
          <TestCardHelper userName={userName} userEmail={userEmail} />
        </div>

        <div className="flex-1 w-full space-y-4">
          <div className="p-6 rounded-2xl bg-surface border-2 border-ink space-y-4 shadow-[4px_4px_0_var(--ink)]">
            <div className="flex items-center gap-3 text-ink">
              <div className="w-10 h-10 rounded-xl bg-lime border-2 border-ink flex items-center justify-center text-ink shadow-[2px_2px_0_var(--ink)]">
                <CreditCard className="w-5 h-5 text-ink" />
              </div>
              <h4 className="font-extrabold text-base text-ink font-heading">
                {isArabic ? "ربط البطاقة البنكية التلقائية" : "Automated Card Deduction"}
              </h4>
            </div>

            <p className="text-sm text-muted font-medium leading-relaxed">
              {isArabic
                ? "يتم ربط بطاقتك بأمان للاستقطاع التلقائي في مواعيد التوفير المحددة لحماية أهدافك من الصرف اللحظي."
                : "Link your debit or credit card securely for automatic recurring micro-savings to protect your goals from impulse urges."}
            </p>
          </div>

          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="w-full py-3 text-xs sm:text-sm text-muted hover:text-ink font-bold transition-colors cursor-pointer"
            >
              {skipLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      {/* TestCardHelper: displayed beside (desktop) or above (phone), never covering the Stripe form */}
      <div className="w-full lg:w-72 shrink-0 order-first lg:order-last">
        <TestCardHelper userName={userName} userEmail={userEmail} />
      </div>

      <div className="flex-1 w-full">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#6B4DFF",
                colorBackground: "#FFFFFF",
                colorText: "#14102B",
                colorDanger: "#FF5A6E",
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
            userName={userName}
            userEmail={userEmail}
          />
        </Elements>
      </div>
    </div>
  );
}
