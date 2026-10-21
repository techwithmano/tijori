"use client";

import React, { useEffect } from "react";
import {
  AlertTriangle,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Info,
  X,
  Loader2,
  Lock,
} from "lucide-react";

export type DecisionModalType = "danger" | "warning" | "discipline" | "success" | "info";

export interface DecisionFinancialBreakdown {
  balanceLabel?: string;
  balanceValue: string;
  feeLabel?: string;
  feeValue: string;
  refundLabel?: string;
  refundValue: string;
}

export interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: DecisionModalType;
  title: string;
  badge?: string;
  description: React.ReactNode;
  icon?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  isConfirming?: boolean;
  hideCancel?: boolean;
  financialBreakdown?: DecisionFinancialBreakdown;
  isArabic?: boolean;
}

export default function DecisionModal({
  isOpen,
  onClose,
  type = "danger",
  title,
  badge,
  description,
  icon,
  confirmLabel,
  cancelLabel,
  onConfirm,
  isConfirming = false,
  hideCancel = false,
  financialBreakdown,
  isArabic = false,
}: DecisionModalProps) {
  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isConfirming) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isConfirming, onClose]);

  if (!isOpen) return null;

  // Default icons based on type
  const renderIcon = () => {
    if (icon) return icon;
    switch (type) {
      case "danger":
        return <Trash2 className="w-6 h-6 text-coral" />;
      case "discipline":
        return <ShieldAlert className="w-6 h-6 text-[#A05E03]" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-coral" />;
      case "success":
        return <CheckCircle2 className="w-6 h-6 text-mint" />;
      case "info":
      default:
        return <Info className="w-6 h-6 text-violet" />;
    }
  };

  // Icon container badge style
  const getIconContainerStyle = () => {
    switch (type) {
      case "danger":
      case "warning":
        return "bg-coral/15 border-2 border-coral shadow-[2px_2px_0_var(--coral)]";
      case "discipline":
        return "bg-amber-100 border-2 border-amber-500 shadow-[2px_2px_0_#D97706]";
      case "success":
        return "bg-mint/20 border-2 border-mint shadow-[2px_2px_0_var(--mint)]";
      case "info":
      default:
        return "bg-violet/15 border-2 border-violet shadow-[2px_2px_0_var(--violet)]";
    }
  };

  // Badge pill styling
  const getBadgeStyle = () => {
    switch (type) {
      case "danger":
      case "warning":
        return "bg-coral/10 text-coral border-coral/30";
      case "discipline":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "success":
        return "bg-mint/15 text-emerald-800 border-mint/40";
      case "info":
      default:
        return "bg-violet/10 text-violet border-violet/30";
    }
  };

  // Confirm button color
  const getConfirmBtnStyle = () => {
    switch (type) {
      case "danger":
      case "warning":
        return "bg-coral text-white hover:bg-[#FF3B54] border-2 border-ink shadow-[4px_4px_0_var(--ink)]";
      case "discipline":
      case "success":
        return "bg-lime text-ink hover:bg-[#BCEE28] border-2 border-ink shadow-[4px_4px_0_var(--ink)]";
      case "info":
      default:
        return "bg-violet text-white hover:bg-violet/90 border-2 border-ink shadow-[4px_4px_0_var(--ink)]";
    }
  };

  const defaultBadgeText = badge || (
    type === "danger"
      ? (isArabic ? "تأكيد إجراء لا رجعة فيه" : "Irreversible Action")
      : type === "discipline"
      ? (isArabic ? "قواعد الانضباط المالي" : "Financial Discipline Rule")
      : type === "warning"
      ? (isArabic ? "تنبيه مهم" : "Important Warning")
      : type === "success"
      ? (isArabic ? "تم الإجراء بنجاح" : "Action Completed")
      : (isArabic ? "معلومات" : "Notice")
  );

  const defaultConfirmLabel = confirmLabel || (
    hideCancel
      ? (isArabic ? "فهمت ذلك" : "Got it")
      : type === "danger"
      ? (isArabic ? "تأكيد الإجراء" : "Confirm Action")
      : (isArabic ? "متابعة" : "Continue")
  );

  const defaultCancelLabel = cancelLabel || (isArabic ? "إلغاء والتراجع" : "Cancel");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink/70 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isConfirming) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-md bg-surface border-3 border-ink rounded-3xl p-6 sm:p-7 shadow-[8px_8px_0_var(--ink)] text-ink space-y-5 animate-in zoom-in-95 duration-150 overflow-hidden text-start"
        onClick={(e) => e.stopPropagation()}
        dir={isArabic ? "rtl" : "ltr"}
      >
        {/* Top Header Row with Icon & Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getIconContainerStyle()}`}>
              {renderIcon()}
            </div>
            <div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${getBadgeStyle()}`}>
                {defaultBadgeText}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            aria-label={isArabic ? "إغلاق النافذة" : "Close dialog"}
            className="w-8 h-8 rounded-xl border-2 border-ink bg-bg hover:bg-surface text-ink flex items-center justify-center transition-all cursor-pointer shadow-[2px_2px_0_var(--ink)] disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2
            id="decision-modal-title"
            className="text-xl sm:text-2xl font-black text-ink tracking-tight font-heading leading-tight"
          >
            {title}
          </h2>
          <div className="text-xs sm:text-sm text-muted font-medium leading-relaxed">
            {description}
          </div>
        </div>

        {/* Optional Financial Breakdown Table */}
        {financialBreakdown && (
          <div className="p-4 rounded-2xl bg-bg border-2 border-ink shadow-[2px_2px_0_var(--ink)] space-y-2.5 text-xs">
            {financialBreakdown.balanceValue && (
              <div className="flex items-center justify-between font-bold text-ink">
                <span>{financialBreakdown.balanceLabel || (isArabic ? "الرصيد المحفوظ:" : "Locked Balance:")}</span>
                <span className="tabular-nums font-extrabold text-sm font-heading">{financialBreakdown.balanceValue}</span>
              </div>
            )}
            {financialBreakdown.feeValue && (
              <div className="flex items-center justify-between font-bold text-coral border-t border-ink/10 pt-2">
                <span>{financialBreakdown.feeLabel || (isArabic ? "رسوم الانضباط المستقطعة:" : "Discipline Fee:")}</span>
                <span className="tabular-nums font-extrabold text-sm font-heading">{financialBreakdown.feeValue}</span>
              </div>
            )}
            {financialBreakdown.refundValue && (
              <div className="flex items-center justify-between font-bold text-emerald-700 border-t border-ink/10 pt-2">
                <span>{financialBreakdown.refundLabel || (isArabic ? "المبلغ المسترد للبطاقة:" : "Refund to Card:")}</span>
                <span className="tabular-nums font-extrabold text-sm font-heading">{financialBreakdown.refundValue}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col-reverse sm:flex-row items-center gap-2.5">
          {!hideCancel && (
            <button
              type="button"
              disabled={isConfirming}
              onClick={onClose}
              className="btn-hard w-full sm:flex-1 py-3 px-4 bg-surface hover:bg-bg text-ink font-bold text-xs sm:text-sm border-2 border-ink shadow-[3px_3px_0_var(--ink)] transition-all cursor-pointer disabled:opacity-40"
            >
              {defaultCancelLabel}
            </button>
          )}

          <button
            type="button"
            disabled={isConfirming}
            onClick={() => {
              if (onConfirm) {
                onConfirm();
              } else {
                onClose();
              }
            }}
            className={`btn-hard w-full ${hideCancel ? "sm:w-full" : "sm:flex-1"} py-3 px-5 font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${getConfirmBtnStyle()}`}
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>{isArabic ? "جاري المعالجة..." : "Processing..."}</span>
              </>
            ) : (
              <span>{defaultConfirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
