"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";

export default function Footer() {
  const pathname = usePathname();
  const { lang } = useT();
  const isArabic = lang === "ar";

  // Hide footer on dashboard and keyholder decision pages
  if (pathname === "/dashboard" || pathname?.startsWith("/unlock")) {
    return null;
  }

  return (
    <footer className="w-full bg-surface border-t-2 border-ink py-8 sm:py-10 px-4 sm:px-6 m-0 mt-auto">
      <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Start: Logo */}
        <Logo href="/" />

        {/* Center: Legal Links */}
        <div className="flex items-center gap-6 text-sm font-bold text-muted">
          <Link
            href="/security"
            className="hover:text-ink transition-colors py-1"
          >
            {isArabic ? "الأمان" : "Security"}
          </Link>
          <Link
            href="/privacy"
            className="hover:text-ink transition-colors py-1"
          >
            {isArabic ? "الخصوصية" : "Privacy"}
          </Link>
          <Link
            href="/terms"
            className="hover:text-ink transition-colors py-1"
          >
            {isArabic ? "الشروط" : "Terms"}
          </Link>
        </div>

        {/* End: Single Language Toggle */}
        <div className="shrink-0">
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
