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

/**
 * Resolves the public base URL of the application from incoming Next.js requests.
 * Safely handles Vercel deployments, custom domains, and local dev.
 */
export function getRequestOrigin(req: {
  headers: { get: (name: string) => string | null };
  nextUrl?: { origin: string };
}): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const host = req.headers.get("host");
  if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    const proto = host.includes("vercel.app") ? "https" : forwardedProto;
    return `${proto}://${host}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  return req.nextUrl?.origin || "http://localhost:3000";
}

