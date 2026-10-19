"use client";

import React from "react";
import { useT } from "@/lib/i18n";

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { lang, setLang } = useT();
  const nextLang = lang === "en" ? "ar" : "en";
  const displayLabel = lang === "en" ? "عربي" : "EN";

  return (
    <button
      type="button"
      onClick={() => setLang(nextLang)}
      aria-label={lang === "en" ? "Switch to Arabic" : "Switch to English"}
      className={`h-[44px] min-w-[64px] px-4 rounded-full bg-surface border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all inline-flex items-center justify-center font-bold text-ink shrink-0 select-none ${className}`}
    >
      <span className="font-arabic text-[16px] leading-[1.4]">
        {displayLabel}
      </span>
    </button>
  );
}
