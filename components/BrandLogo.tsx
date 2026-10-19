"use client";

import React from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n";

interface BrandLogoProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

export default function BrandLogo({
  href = "/",
  size = "md",
  showTagline = true,
  className = "",
}: BrandLogoProps) {
  const { t, lang } = useT();
  const isArabic = lang === "ar";

  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-9 h-9 sm:w-10 sm:h-10",
    lg: "w-11 h-11 sm:w-12 sm:h-12",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl sm:text-2xl",
  };

  const Content = (
    <div className={`flex items-center gap-2.5 sm:gap-3 group select-none ${className}`}>
      {/* Custom Geometric Tijori Vault Mark (Not a generic stock lock) */}
      <div
        className={`${iconSizes[size]} rounded-2xl bg-gradient-to-br from-surface to-raised border border-line flex items-center justify-center shrink-0 shadow-violetSubtle group-hover:border-accent/50 group-hover:shadow-limeGlow transition-all duration-200`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-accent transition-transform duration-300 group-hover:rotate-45"
        >
          {/* Heavy Vault Outer Ring */}
          <circle
            cx="16"
            cy="16"
            r="12"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="opacity-90"
          />
          {/* Inner Dial Track */}
          <circle
            cx="16"
            cy="16"
            r="7.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="2 3"
            className="opacity-50"
          />
          {/* 4 Precision Dial Bolts */}
          <circle cx="16" cy="4" r="1.3" fill="currentColor" />
          <circle cx="16" cy="28" r="1.3" fill="currentColor" />
          <circle cx="4" cy="16" r="1.3" fill="currentColor" />
          <circle cx="28" cy="16" r="1.3" fill="currentColor" />
          {/* Center Vault Spindle Hub with Glow */}
          <circle cx="16" cy="16" r="2.8" fill="currentColor" />
          <circle cx="16" cy="16" r="1.2" fill="#13121A" />
        </svg>
      </div>

      {/* Brand Wordmark: Beside each other with sleek divider (no brackets, no pill badge) */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          {isArabic ? (
            <>
              <span
                className={`font-black tracking-tight text-text group-hover:text-accent transition-colors font-sans ${textSizes[size]}`}
              >
                تِجوري
              </span>
              <span className="text-line font-light text-sm select-none">|</span>
              <span
                className={`font-extrabold tracking-tight text-muted group-hover:text-text transition-colors text-sm sm:text-base`}
              >
                Tijori
              </span>
            </>
          ) : (
            <>
              <span
                className={`font-extrabold tracking-tight text-text group-hover:text-accent transition-colors ${textSizes[size]}`}
              >
                Tijori
              </span>
              <span className="text-line font-light text-sm select-none">|</span>
              <span
                className={`font-black tracking-tight text-muted group-hover:text-text transition-colors text-sm sm:text-base font-sans`}
              >
                تِجوري
              </span>
            </>
          )}
        </div>

        {showTagline && (
          <p className="text-[11px] sm:text-xs text-muted -mt-0.5 tracking-normal">
            {t("common.appTagline")}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl">
        {Content}
      </Link>
    );
  }

  return Content;
}
