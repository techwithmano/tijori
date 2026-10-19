"use client";

import React from "react";
import { useT, Language } from "@/lib/i18n";

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { lang, setLang } = useT();

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center rounded-btn bg-surface border border-line p-1 text-xs font-semibold shadow-xs transition-colors ${className}`}
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`px-3 py-1 rounded-btn transition-all duration-150 tactile-btn ${
          lang === "en"
            ? "bg-raised text-accent border border-line font-bold shadow-violetSubtle"
            : "text-muted hover:text-text hover:bg-raised/40"
        }`}
      >
        EN
      </button>

      <span className="text-line px-0.5 select-none" aria-hidden="true">
        |
      </span>

      <button
        type="button"
        onClick={() => setLang("ar")}
        aria-pressed={lang === "ar"}
        className={`px-3 py-1 rounded-btn transition-all duration-150 tactile-btn font-sans ${
          lang === "ar"
            ? "bg-raised text-accent border border-line font-bold shadow-violetSubtle"
            : "text-muted hover:text-text hover:bg-raised/40"
        }`}
      >
        عربي
      </button>
    </div>
  );
}
