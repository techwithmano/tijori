"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, Mail, ArrowLeft, MessageSquare, CheckCircle2 } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface border border-line rounded-card p-6 sm:p-8 shadow-card space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-raised border border-line mx-auto flex items-center justify-center shadow-violetSubtle">
            <Lock className="w-6 h-6 text-accent" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            {t("auth.forgotPasswordTitle")}
          </h1>
          <p className="text-sm text-muted">
            {t("auth.forgotPasswordDesc")}
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-mint/10 border border-mint/30 text-mint text-xs flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Request Logged</p>
                <p className="text-muted leading-relaxed">
                  If an account exists for <span className="font-mono text-text">{email}</span>, our team will assist you via your registered WhatsApp contact.
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full tactile-btn py-3 px-6 rounded-btn bg-raised hover:bg-surface border border-line text-text font-bold text-xs flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{t("auth.backToLogin")}</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text block">
                {t("auth.emailLabel")}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  className="w-full bg-raised border border-line text-text placeholder:text-muted/40 rounded-xl ps-10 pe-4 py-3 text-sm focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 transition-all font-mono"
                />
                <Mail className="w-4 h-4 text-muted absolute inset-y-0 start-3 my-auto pointer-events-none" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-raised border border-line text-xs text-muted leading-relaxed flex items-start gap-2.5">
              <MessageSquare className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>{t("auth.forgotPasswordNotice")}</span>
            </div>

            <button
              type="submit"
              className="w-full tactile-btn py-3.5 px-6 rounded-btn bg-accent text-accent-foreground font-extrabold text-sm shadow-limeGlow hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>Submit Request</span>
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs font-semibold text-muted hover:text-text transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{t("auth.backToLogin")}</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
