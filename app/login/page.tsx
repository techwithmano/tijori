"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useT();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Check if user already has an active vault
        try {
          const vaultRes = await fetch("/api/vault");
          const vaultData = await vaultRes.json();
          if (vaultData.success && vaultData.vault) {
            router.push("/dashboard");
          } else {
            router.push("/onboarding");
          }
        } catch {
          router.push("/dashboard");
        }
        router.refresh();
      } else {
        setError(data.error || "Invalid email or password. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card-hard bg-surface p-6 sm:p-8 shadow-[4px_4px_0_var(--ink)] space-y-6">
        {/* Brand Icon & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-lime border-2 border-ink mx-auto flex items-center justify-center shadow-[2px_2px_0_var(--ink)]">
            <Lock className="w-6 h-6 text-ink" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-heading">
            {t("auth.loginTitle")}
          </h1>
          <p className="text-sm text-muted font-medium">
            {t("auth.loginSubtitle")}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-coral/20 border-2 border-ink text-ink font-bold text-xs flex items-center gap-2 shadow-[2px_2px_0_var(--ink)]">
            <AlertCircle className="w-4 h-4 text-coral shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Real Login Form (No Demo) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
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

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink block">
                {t("auth.passwordLabel")}
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted hover:text-violet transition-colors font-semibold"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>
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
                <span>{t("auth.loginAction")}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Sign Up */}
        <div className="pt-4 border-t-2 border-ink/10 text-center text-xs text-muted">
          <span>{t("auth.noAccount")} </span>
          <Link
            href="/signup"
            className="font-bold text-violet hover:underline ms-1 inline-flex items-center"
          >
            {t("nav.signup")}
          </Link>
        </div>
      </div>
    </div>
  );
}
