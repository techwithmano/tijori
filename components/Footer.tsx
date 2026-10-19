"use client";

import React from "react";
import { usePathname } from "next/navigation";

import { useT } from "@/lib/i18n";

export default function Footer() {
  const pathname = usePathname();
  const { t, lang } = useT();
  const isArabic = lang === "ar";

  // Landing page has its own dedicated 3-link footer per Task 4 specs
  if (pathname === "/") {
    return null;
  }

  return (
    <footer className="border-t border-line py-5 text-center text-xs text-muted bg-surface/60 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isArabic ? (
            <span className="font-extrabold text-text">تِجوري | Tijori</span>
          ) : (
            <span className="font-extrabold text-text">Tijori | تِجوري</span>
          )}
          <span className="text-muted/40">&bull;</span>
          <span className="text-muted">
            {isArabic ? "محرك التوفير ضد الصرف اللحظي" : "Anti-Impulse Micro-Savings"}
          </span>
        </div>
        <div className="text-xs text-muted tabular-nums">
          {isArabic ? "د.ك (KWD) • الكويت والخليج العربي" : "KWD (د.ك) • Kuwait & GCC"}
        </div>
      </div>
    </footer>
  );
}
