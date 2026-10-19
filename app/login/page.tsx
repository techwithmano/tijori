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
      <div className="w-full max-w-md bg-surface border border-line rounded-card p-6 sm:p-8 shadow-card space-y-6">
        {/* Brand Icon & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-raised border border-line mx-auto flex items-center justify-center shadow-violetSubtle">
            <Lock className="w-6 h-6 text-accent" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            {t("auth.loginTitle")}
          </h1>
          <p className="text-sm text-muted">
            {t("auth.loginSubtitle")}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-coral/10 border border-coral/30 text-coral text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Real Login Form (No Demo) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
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

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text block">
                {t("auth.passwordLabel")}
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted hover:text-accent transition-colors"
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
                className="w-full bg-raised border border-line text-text placeholder:text-muted/40 rounded-xl ps-10 pe-4 py-3 text-sm focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 transition-all font-mono"
              />
              <Lock className="w-4 h-4 text-muted absolute inset-y-0 start-3 my-auto pointer-events-none" />
            </div>
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
                <span>{t("auth.loginAction")}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Sign Up */}
        <div className="pt-4 border-t border-line text-center text-xs text-muted">
          <span>{t("auth.noAccount")} </span>
          <Link
            href="/signup"
            className="font-bold text-accent hover:underline ms-1 inline-flex items-center"
          >
            {t("nav.signup")}
          </Link>
        </div>
      </div>
    </div>
  );
}
