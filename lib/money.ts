/**
 * lib/money.ts
 * One source of truth for Kuwaiti Dinar currency formatting.
 */

export function formatKwd(
  amount: number | string | null | undefined,
  lang: string = "en"
): string {
  const num = typeof amount === "number" ? amount : Number(amount) || 0;
  const formattedNumber = new Intl.NumberFormat("en-KW", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(num);

  const isArabic = lang === "ar";
  return isArabic ? `${formattedNumber} د.ك` : `${formattedNumber} KWD`;
}

export function formatNumber(
  amount: number | string | null | undefined
): string {
  const num = typeof amount === "number" ? amount : Number(amount) || 0;
  return new Intl.NumberFormat("en-KW", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(num);
}
