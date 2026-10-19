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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface border border-line rounded-card p-6 sm:p-8 shadow-card space-y-6">
        {/* Brand Icon & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-raised border border-line mx-auto flex items-center justify-center shadow-violetSubtle">
            <Lock className="w-6 h-6 text-accent" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            {t("auth.signupTitle")}
          </h1>
          <p className="text-sm text-muted">
            {t("auth.signupSubtitle")}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-coral/10 border border-coral/30 text-coral text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields: First Name, Email, Password */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. First Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text block">
              {t("auth.nameLabel")}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("auth.namePlaceholder")}
                className="w-full bg-raised border border-line text-text placeholder:text-muted/40 rounded-xl ps-10 pe-4 py-3 text-sm focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 transition-all"
              />
              <User className="w-4 h-4 text-muted absolute inset-y-0 start-3 my-auto pointer-events-none" />
            </div>
          </div>

          {/* 2. Email */}
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

          {/* 3. Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text block">
              {t("auth.passwordLabel")}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-raised border border-line text-text placeholder:text-muted/40 rounded-xl ps-10 pe-4 py-3 text-sm focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 transition-all font-mono"
              />
              <Lock className="w-4 h-4 text-muted absolute inset-y-0 start-3 my-auto pointer-events-none" />
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="pt-2 space-y-1.5">
                <div className="flex items-center gap-1.5 h-1.5 w-full">
                  <div
                    className={`h-full flex-1 rounded-full transition-colors ${
                      strength.level >= 1 ? strength.color : "bg-line"
                    }`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full transition-colors ${
                      strength.level >= 2 ? strength.color : "bg-line"
                    }`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full transition-colors ${
                      strength.level >= 3 ? strength.color : "bg-line"
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Password Strength</span>
                  <span className={`font-semibold ${strength.textColor}`}>
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
            className="w-full tactile-btn py-3.5 px-6 rounded-btn bg-accent text-accent-foreground font-extrabold text-sm shadow-limeGlow hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
            ) : (
              <>
                <span>{t("auth.signupAction")}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Login */}
        <div className="pt-4 border-t border-line text-center text-xs text-muted">
          <span>{t("auth.hasAccount")} </span>
          <Link
            href="/login"
            className="font-bold text-accent hover:underline ms-1 inline-flex items-center"
          >
            {t("nav.login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
