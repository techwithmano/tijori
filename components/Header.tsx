"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";

export default function Header() {
  const pathname = usePathname();
  const { lang } = useT();
  const isArabic = lang === "ar";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNavCta, setShowNavCta] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string } | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("tijori_user");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  // Check auth status for login/dashboard link
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
            try {
              localStorage.setItem("tijori_user", JSON.stringify(data.user));
            } catch {}
            return;
          }
        }
        if (res.status === 401) {
          setUser(null);
          try {
            localStorage.removeItem("tijori_user");
          } catch {}
        }
      } catch {}
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Observer for hero CTA to hide/show the nav CTA button
  useEffect(() => {
    if (pathname !== "/") {
      setShowNavCta(true);
      return;
    }

    const heroCta = document.getElementById("hero-cta-btn");
    if (!heroCta) {
      setShowNavCta(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // If hero CTA is visible on screen, hide nav CTA; otherwise show it
        setShowNavCta(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(heroCta);
    return () => observer.disconnect();
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Do not render shared floating header on dashboard
  if (pathname === "/dashboard") {
    return null;
  }

  // Minimal header for onboarding, auth, keyholder, and unlock routes
  const isMinimal =
    pathname === "/onboarding" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname?.startsWith("/keyholder") ||
    pathname?.startsWith("/unlock");

  if (isMinimal) {
    return (
      <header className="sticky top-4 z-50 w-full px-4 sm:px-6 pointer-events-none">
        <nav
          aria-label="Main Navigation"
          className="mx-auto max-w-[1100px] w-full h-16 bg-surface border-2 border-ink rounded-full shadow-[4px_4px_0_var(--ink)] px-4 sm:px-6 flex items-center justify-between gap-3 pointer-events-auto transition-all"
        >
          <div className="shrink-0 flex items-center">
            <Logo href="/" />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <LanguageSwitcher />
          </div>
        </nav>
      </header>
    );
  }

  const isLanding = pathname === "/";

  return (
    <>
      <header className="sticky top-4 z-50 w-full px-4 sm:px-6 pointer-events-none">
        <nav
          aria-label="Main Navigation"
          className="mx-auto max-w-[1100px] w-full h-16 bg-surface border-2 border-ink rounded-full shadow-[4px_4px_0_var(--ink)] px-4 sm:px-6 flex items-center justify-between gap-3 pointer-events-auto transition-all"
        >
          {/* Start: Logo */}
          <div className="shrink-0 flex items-center">
            <Logo href="/" />
          </div>

          {/* Desktop Center Links (Smooth-scroll anchors on landing page) */}
          {isLanding ? (
            <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-bold text-ink">
              <a
                href="#how-it-works"
                className="hover:text-violet transition-colors py-1 cursor-pointer"
              >
                {isArabic ? "طريقة العمل" : "How it works"}
              </a>
              <a
                href="#trusted-person"
                className="hover:text-violet transition-colors py-1 cursor-pointer"
              >
                {isArabic ? "الشخص الموثوق" : "Trusted person"}
              </a>
              <a
                href="#why-tijori"
                className="hover:text-violet transition-colors py-1 cursor-pointer"
              >
                {isArabic ? "ليش تجوري" : "Why Tijori"}
              </a>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-6 text-sm font-bold text-ink">
              <Link href="/" className="hover:text-violet transition-colors py-1">
                {isArabic ? "الرئيسية" : "Home"}
              </Link>
            </div>
          )}

          {/* Desktop End Controls */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {/* Language toggle: 44px pill showing other language */}
            <LanguageSwitcher />

            {/* Auth States: LOGGED IN = "Dashboard". LOGGED OUT = "Try Live Demo ⚡" (zero-friction 1-click access) */}
            {user ? (
              <Link
                href="/dashboard"
                className="btn-hard bg-surface text-ink font-extrabold text-sm px-5 py-2.5 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 border-2 border-ink shadow-[2px_2px_0_var(--ink)]"
              >
                <span>{isArabic ? "لوحة التحكم" : "Dashboard"}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            ) : (
              <Link
                href="/onboarding?demo=true"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem("tijori_demo", "true");
                    localStorage.setItem("tijori_user", JSON.stringify({ id: "demo_user_101", name: "Abdulrahman" }));
                    document.cookie = "tijori_demo=true; path=/; max-age=86400; SameSite=Lax";
                  }
                }}
                className="btn-hard bg-lime text-ink font-extrabold text-sm px-5 py-2.5 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 border-2 border-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <span>{isArabic ? "تجربة الديمو ⚡" : "Try Live Demo ⚡"}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            )}
          </div>

          {/* Mobile Right Controls (< 768px): Language + Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={isArabic ? "فتح القائمة" : "Open navigation menu"}
              className="w-10 h-10 rounded-full bg-surface border-2 border-ink shadow-[2px_2px_0_var(--ink)] flex items-center justify-center text-ink hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </nav>
      </header>

      {/* Full-screen Mobile Navigation Sheet */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-md flex flex-col justify-between p-6 md:hidden animate-in fade-in duration-200"
        >
          {/* Top Bar inside Sheet */}
          <div className="flex items-center justify-between">
            <Logo href="/" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label={isArabic ? "إغلاق القائمة" : "Close navigation menu"}
              className="w-11 h-11 rounded-full bg-surface border-2 border-ink shadow-[2px_2px_0_var(--ink)] flex items-center justify-center text-ink hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Links with big touch targets (min 48px) */}
          <div className="flex flex-col gap-4 py-8">
            {isLanding && (
              <>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[48px] flex items-center text-xl font-extrabold text-ink px-4 rounded-2xl bg-surface border-2 border-ink shadow-[2px_2px_0_var(--ink)]"
                >
                  {isArabic ? "طريقة العمل" : "How it works"}
                </a>
                <a
                  href="#trusted-person"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[48px] flex items-center text-xl font-extrabold text-ink px-4 rounded-2xl bg-surface border-2 border-ink shadow-[2px_2px_0_var(--ink)]"
                >
                  {isArabic ? "الشخص الموثوق" : "Trusted person"}
                </a>
                <a
                  href="#why-tijori"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[48px] flex items-center text-xl font-extrabold text-ink px-4 rounded-2xl bg-surface border-2 border-ink shadow-[2px_2px_0_var(--ink)]"
                >
                  {isArabic ? "ليش تجوري" : "Why Tijori"}
                </a>
              </>
            )}
          </div>

          {/* Bottom CTAs (48px+ touch targets) */}
          <div className="space-y-3 pb-6">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-hard w-full min-h-[50px] bg-surface text-ink font-extrabold text-base flex items-center justify-center border-2 border-ink shadow-[2px_2px_0_var(--ink)]"
              >
                {isArabic ? "لوحة التحكم" : "Dashboard"}
              </Link>
            ) : (
              <Link
                href="/onboarding?demo=true"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("tijori_demo", "true");
                    localStorage.setItem("tijori_user", JSON.stringify({ id: "demo_user_101", name: "Abdulrahman" }));
                    document.cookie = "tijori_demo=true; path=/; max-age=86400; SameSite=Lax";
                  }
                }}
                className="btn-hard w-full min-h-[50px] bg-lime text-ink font-extrabold text-base flex items-center justify-center gap-2 border-2 border-ink shadow-[3px_3px_0_var(--ink)]"
              >
                <span>{isArabic ? "تجربة الديمو الحية ⚡" : "Try Live Demo ⚡"}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
