"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, User, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function SignUpPage() {
  const router = useRouter();
  const { t, lang } = useT();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple, elegant password strength calculation
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: "", color: "bg-line" };
    if (password.length < 6) {
      return {
        level: 1,
        label: t("auth.strengthTooShort"),
        color: "bg-coral",
        textColor: "text-coral",
      };
    }
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (password.length >= 10 && hasLetters && (hasNumbers || hasSpecial)) {
      return {
        level: 3,
        label: t("auth.strengthStrong"),
        color: "bg-mint",
        textColor: "text-mint",
      };
    }

    if (password.length >= 8 && (hasLetters || hasNumbers)) {
      return {
        level: 2,
        label: t("auth.strengthFair"),
        color: "bg-amber-400",
        textColor: "text-amber-400",
      };
    }

    return {
      level: 1,
      label: t("auth.strengthWeak"),
      color: "bg-coral",
      textColor: "text-coral",
    };
  }, [password, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill out all required fields.");
      return;
    }

    if (password.length < 6) {
      setError(t("auth.strengthTooShort"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Go straight to onboarding as required
        router.push("/onboarding");
        router.refresh();
      } else {
        setError(data.error || "Failed to create account. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 pb-12 pt-[calc(var(--nav-h)+24px)]">
      <div className="w-full max-w-md card-hard bg-surface p-6 sm:p-8 shadow-[4px_4px_0_var(--ink)] space-y-6">
        {/* Brand Icon & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-lime border-2 border-ink mx-auto flex items-center justify-center shadow-[2px_2px_0_var(--ink)]">
            <Lock className="w-6 h-6 text-ink" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-heading">
            {t("auth.signupTitle")}
          </h1>
          <p className="text-sm text-muted font-medium">
            {t("auth.signupSubtitle")}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-coral/20 border-2 border-ink text-ink font-bold text-xs flex items-center gap-2 shadow-[2px_2px_0_var(--ink)]">
            <AlertCircle className="w-4 h-4 text-coral shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields: First Name, Email, Password */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. First Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              {t("auth.nameLabel")}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("auth.namePlaceholder")}
                className="w-full bg-bg border-2 border-ink text-ink placeholder:text-muted/60 rounded-xl ps-10 pe-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all font-medium"
              />
              <User className="w-4 h-4 text-muted absolute inset-y-0 start-3 my-auto pointer-events-none" />
            </div>
          </div>

          {/* 2. Email */}
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

          {/* 3. Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              {t("auth.passwordLabel")}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg border-2 border-ink text-ink placeholder:text-muted/60 rounded-xl ps-10 pe-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all font-medium"
              />
              <Lock className="w-4 h-4 text-muted absolute inset-y-0 start-3 my-auto pointer-events-none" />
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="pt-2 space-y-1.5">
                <div className="flex items-center gap-1.5 h-2 w-full">
                  <div
                    className={`h-full flex-1 rounded-full border border-ink transition-colors ${
                      strength.level >= 1 ? strength.color : "bg-bg"
                    }`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full border border-ink transition-colors ${
                      strength.level >= 2 ? strength.color : "bg-bg"
                    }`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full border border-ink transition-colors ${
                      strength.level >= 3 ? strength.color : "bg-bg"
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted font-medium">Password Strength</span>
                  <span className={`font-bold ${strength.textColor}`}>
                    {strength.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button (Lime) */}
          <button
            type="submit"
            disabled={loading}
            className="btn-hard w-full py-3.5 px-6 bg-lime text-ink font-extrabold text-base shadow-[4px_4px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{t("auth.signupAction")}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Login */}
        <div className="pt-4 border-t-2 border-ink/10 text-center text-xs text-muted">
          <span>{t("auth.hasAccount")} </span>
          <Link
            href="/login"
            className="font-bold text-violet hover:underline ms-1 inline-flex items-center"
          >
            {t("nav.login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
