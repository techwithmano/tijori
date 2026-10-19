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
      <div className="w-full max-w-md card-hard bg-surface p-6 sm:p-8 shadow-[4px_4px_0_var(--ink)] space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-lime border-2 border-ink mx-auto flex items-center justify-center shadow-[2px_2px_0_var(--ink)]">
            <Lock className="w-6 h-6 text-ink" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-heading">
            {t("auth.forgotPasswordTitle")}
          </h1>
          <p className="text-sm text-muted font-medium">
            {t("auth.forgotPasswordDesc")}
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-mint/20 border-2 border-ink text-ink text-xs flex items-start gap-3 shadow-[2px_2px_0_var(--ink)]">
              <CheckCircle2 className="w-5 h-5 text-mint shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">Request Logged</p>
                <p className="text-muted leading-relaxed">
                  If an account exists for <span className="font-mono text-ink font-bold">{email}</span>, our team will assist you via your registered WhatsApp contact.
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="btn-hard w-full py-3.5 px-6 bg-surface hover:bg-bg border-2 border-ink text-ink font-extrabold text-sm flex items-center justify-center gap-2 shadow-[2px_2px_0_var(--ink)] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{t("auth.backToLogin")}</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink block">
                {t("auth.emailLabel")}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  className="w-full bg-bg border-2 border-ink text-ink placeholder:text-muted/60 rounded-xl ps-10 pe-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all font-medium"
                />
                <Mail className="w-4 h-4 text-muted absolute inset-y-0 start-3 my-auto pointer-events-none" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-bg border-2 border-ink/20 text-xs text-muted leading-relaxed flex items-start gap-2.5">
              <MessageSquare className="w-4 h-4 text-violet shrink-0 mt-0.5" />
              <span>{t("auth.forgotPasswordNotice")}</span>
            </div>

            <button
              type="submit"
              className="btn-hard w-full py-3.5 px-6 bg-lime text-ink font-extrabold text-base shadow-[4px_4px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              <span>Submit Request</span>
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs font-bold text-violet hover:underline inline-flex items-center gap-1.5"
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
