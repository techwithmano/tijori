"use client";

import React, { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp, AlertCircle, CreditCard } from "lucide-react";
import { useT } from "@/lib/i18n";

interface TestCardHelperProps {
  userName?: string;
  userEmail?: string;
}

interface CopyRowProps {
  label: string;
  displayValue: string;
  copyValue: string;
}

function CopyRow({ label, displayValue, copyValue }: CopyRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-ink/10 last:border-b-0 text-xs">
      <span className="text-muted font-bold shrink-0">{label}</span>
      <div className="flex items-center gap-2 overflow-hidden">
        <code className="text-ink font-mono font-bold bg-bg px-2 py-0.5 rounded border border-ink/20 truncate">
          {displayValue}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${label}`}
          className="px-2.5 py-1 rounded-full bg-surface border border-ink hover:bg-lime text-ink text-xs font-extrabold flex items-center gap-1 shrink-0 transition-colors cursor-pointer shadow-[1px_1px_0_var(--ink)]"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-mint" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-muted" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * TestCardHelper component
 * 
 * Note on implementation:
 * Stripe Elements renders payment inputs inside cross-origin sandboxed iframes.
 * For browser security, parent frames cannot programmatically inject values
 * into these iframes. Therefore, quick-copy buttons are provided for fast test entry.
 */
export default function TestCardHelper({ userName }: TestCardHelperProps) {
  const { lang } = useT();
  const isArabic = lang === "ar";
  const [showDeclined, setShowDeclined] = useState(false);

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  // Render ONLY when publishable key starts with pk_test. In live mode it returns null.
  if (!publishableKey.startsWith("pk_test")) {
    return null;
  }

  const resolvedName = (userName || "").trim() || "Test User";

  return (
    <div
      data-testid="test-card-helper"
      aria-label="Test card information"
      className="card-hard bg-surface border-2 border-lime p-4 sm:p-5 rounded-2xl shadow-[4px_4px_0_var(--ink)] space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2 text-ink">
        <span className="w-2.5 h-2.5 rounded-full bg-lime border border-ink animate-pulse" />
        <h4 className="font-extrabold text-sm sm:text-base font-heading">
          {isArabic ? "وضع التجربة" : "Test mode"}
        </h4>
      </div>

      <p className="text-xs text-muted font-medium">
        {isArabic
          ? "لن يتم خصم أموال حقيقية. استخدم هذه البطاقة:"
          : "No real money moves. Use this card."}
      </p>

      {/* 5 Test Rows */}
      <div className="bg-bg/60 p-2.5 rounded-xl border border-ink/20 space-y-0.5">
        <CopyRow
          label={isArabic ? "رقم البطاقة" : "Card number"}
          displayValue="4242 4242 4242 4242"
          copyValue="4242424242424242"
        />
        <CopyRow
          label={isArabic ? "تاريخ الانتهاء" : "Expiry"}
          displayValue="12/34"
          copyValue="12/34"
        />
        <CopyRow
          label={isArabic ? "رمز الأمان" : "CVC"}
          displayValue="123"
          copyValue="123"
        />
        <CopyRow
          label={isArabic ? "الاسم على البطاقة" : "Name on card"}
          displayValue={resolvedName}
          copyValue={resolvedName}
        />
        <CopyRow
          label={isArabic ? "الرمز البريدي" : "ZIP"}
          displayValue="12345"
          copyValue="12345"
        />
      </div>

      {/* Collapsible link for declined / 3DS test cards */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowDeclined(!showDeclined)}
          className="text-xs text-muted hover:text-ink font-bold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{isArabic ? "تجربة بطاقة مرفوضة أو تحقق ثلاثي" : "Test a declined card"}</span>
          {showDeclined ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showDeclined && (
          <div className="mt-2.5 bg-bg/60 p-2.5 rounded-xl border border-ink/20 space-y-0.5 animate-in fade-in duration-200">
            <CopyRow
              label={isArabic ? "بطاقة مرفوضة" : "Decline Card"}
              displayValue="4000 0000 0000 0002"
              copyValue="4000000000000002"
            />
            <CopyRow
              label={isArabic ? "تحقق ثلاثي 3DS" : "3D Secure Card"}
              displayValue="4000 0027 6000 3184"
              copyValue="4000002760003184"
            />
          </div>
        )}
      </div>
    </div>
  );
}
