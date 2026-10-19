"use client";

import React from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n";

interface LogoProps {
  href?: string;
  className?: string;
}

export default function Logo({ href = "/", className = "" }: LogoProps) {
  const { lang } = useT();
  const isArabic = lang === "ar";

  const Content = (
    <span className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {/* 40px rounded-square tile in --lime with a 2px ink border */}
      <span
        className="w-10 h-10 rounded-[12px] bg-lime border-2 border-ink flex items-center justify-center shrink-0 shadow-[2px_2px_0_var(--ink)] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none transition-all"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-ink"
        >
          {/* Keyhole: Circle + Trapezoid */}
          <circle cx="12" cy="8.5" r="3.2" fill="currentColor" />
          <path
            d="M9.8 11.2H14.2L15.3 17.6C15.4 18.1 15 18.5 14.5 18.5H9.5C9 18.5 8.6 18.1 8.7 17.6L9.8 11.2Z"
            fill="currentColor"
          />
        </svg>
      </span>

      {/* Wordmark: "Tijori" (Bricolage 800) or "تجوري" (Readex Pro 800) */}
      <span
        className={`text-2xl font-extrabold tracking-tight text-ink leading-none ${
          isArabic ? "font-arabic" : "font-heading"
        }`}
      >
        {isArabic ? "تجوري" : "Tijori"}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none">
        {Content}
      </Link>
    );
  }

  return Content;
}
