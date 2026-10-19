import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format Kuwaiti Dinar amounts (KWD / د.ك) with 3 decimal places (fils).
 */
export function formatKWD(amount: number, showDecimals: boolean = true): string {
  return new Intl.NumberFormat("en-KW", {
    minimumFractionDigits: showDecimals ? 3 : 0,
    maximumFractionDigits: showDecimals ? 3 : 2,
  }).format(amount || 0);
}

/**
 * Locale-aware date formatting.
 * Strict rule: DD/MM/YYYY for EN-KW, Arabic numerals for AR. No US MM/DD anywhere.
 */
export function formatDate(
  dateInput: string | Date | number,
  lang: "en" | "ar" = "en"
): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  if (lang === "ar") {
    return new Intl.DateTimeFormat("ar-KW", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  }

  // English Kuwait / UK format: DD/MM/YYYY
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
