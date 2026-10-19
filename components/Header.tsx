"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Lock, PlusCircle, LogOut, User, ArrowRight, ShieldCheck } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";

interface UserSession {
  id: string;
  name: string;
  email: string;
  allowanceDay?: number;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang } = useT();
  const isKeyholderView = pathname?.startsWith("/unlock");

  const [user, setUser] = useState<UserSession | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    }
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Skip global header on landing page, dashboard, and unlock pages which have dedicated clean layouts
  if (pathname === "/" || pathname === "/dashboard" || pathname?.startsWith("/unlock")) {
    return null;
  }

  // Keyholder View Header
  if (isKeyholderView) {
    return (
      <header className="border-b border-line bg-surface/90 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-surface border border-line flex items-center justify-center shadow-violetSubtle">
              <Lock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-text block">
                {lang === "ar" ? "قرار حامل المفتاح" : "Keyholder Decision"}
              </span>
              <p className="text-xs text-muted font-medium">
                {lang === "ar" ? "تأكيد عبر واتساب" : "Guarded via WhatsApp"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-btn bg-raised border border-line text-xs font-semibold text-text shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-mint"></span>
              </span>
              <span className="text-xs text-muted">
                {lang === "ar" ? "مفتاح نشط" : "Active Key"}
              </span>
            </div>

            <LanguageSwitcher />
          </div>
        </div>
      </header>
    );
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const firstName = user?.name ? user.name.split(" ")[0] : "Friend";

  return (
    <header className="border-b border-line bg-surface/90 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-surface border border-line flex items-center justify-center shadow-violetSubtle group-hover:border-accent/40 transition-colors">
            <Lock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-text group-hover:text-accent transition-colors">
                Tijori
              </span>
              <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-btn bg-raised border border-line text-muted font-medium font-sans">
                تِجوري
              </span>
            </div>
            <p className="text-xs text-muted -mt-0.5">
              {t("common.appTagline")}
            </p>
          </div>
        </Link>

        {/* Navigation State: Logged-in vs Logged-out */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {user ? (
            /* Logged-In State: Avatar Menu + User Details + Logout */
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-btn bg-raised hover:bg-surface border border-line transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 text-accent font-extrabold text-xs flex items-center justify-center">
                  {initials}
                </div>
                <div className="flex flex-col text-start">
                  <span className="text-xs font-bold text-text leading-tight">
                    {firstName}
                  </span>
                  <span className="text-xs text-muted leading-tight">
                    {t("nav.dashboard")}
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                title={t("nav.logout")}
                className="tactile-btn p-2 rounded-btn text-muted hover:text-text hover:bg-raised border border-line transition-all text-xs flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-semibold">
                  {t("nav.logout")}
                </span>
              </button>
            </div>
          ) : (
            /* Logged-Out State: Log In + Sign Up (No redundant button on active page) */
            <div className="flex items-center gap-1.5 sm:gap-2">
              {pathname !== "/login" && (
                <Link
                  href="/login"
                  className="tactile-btn px-3 sm:px-4 py-1.5 sm:py-2 rounded-btn text-xs font-semibold text-text bg-raised hover:bg-surface border border-line transition-all"
                >
                  {t("nav.login")}
                </Link>
              )}

              {pathname !== "/signup" && (
                <Link
                  href="/signup"
                  className="tactile-btn px-3 sm:px-4 py-1.5 sm:py-2 rounded-btn text-xs font-extrabold text-accent-foreground bg-accent hover:brightness-105 shadow-limeGlow transition-all"
                >
                  {t("nav.signup")}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
