"use client";

import React from "react";

/**
 * Japanese Flag SVG badge
 * Clean white disc with precision crimson circle and subtle border
 * Avoids Windows Chromium regional indicator "JP" text fallback
 */
export function JapanFlagIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-white border border-slate-200/90 shadow-2xs overflow-hidden shrink-0 align-middle ${className}`}
      title="Japan"
      aria-label="Japan"
    >
      <svg viewBox="0 0 32 32" className="w-full h-full">
        <rect width="32" height="32" fill="#FFFFFF" />
        <circle cx="16" cy="16" r="8.5" fill="#E11D48" />
      </svg>
    </span>
  );
}

interface GoalTitleProps {
  title: string;
  className?: string;
  iconClassName?: string;
}

/**
 * GoalTitle: Renders savings goal titles with crisp SVG flag icons
 * when regional emojis are detected, preventing the Windows "JP" text fallback bug.
 */
export default function GoalTitle({ title, className = "", iconClassName = "w-5 h-5" }: GoalTitleProps) {
  if (!title) return null;

  // Clean out regional indicator flag emojis or raw 'JP' suffixes
  const isJapan = /Japan|🇯🇵|\bJP\b/i.test(title);
  const cleanTitle = title
    .replace(/🇯🇵/g, "")
    .replace(/\bJP\b$/i, "")
    .trim();

  return (
    <span className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
      <span>{cleanTitle}</span>
      {isJapan && <JapanFlagIcon className={iconClassName} />}
    </span>
  );
}
