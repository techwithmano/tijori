"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Lock,
  Unlock,
  CreditCard,
  ExternalLink,
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Copy,
  LogOut,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { formatKWD, formatDate, cn } from "@/lib/utils";
import { formatKwd } from "@/lib/money";
import GoalTitle from "@/components/GoalTitle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BrandLogo from "@/components/BrandLogo";
import { useT } from "@/lib/i18n";
import StripeCardForm from "@/components/StripeCardForm";
import {
  FRIEND_FEE_PCT,
  SOLO_FEE_PCT,
  FRIEND_RETURN_PCT,
  SOLO_RETURN_PCT,
} from "@/lib/config";

interface ITransaction {
  _id?: string;
  amount: number;
  type: string;
  status: string;
  note?: string;
  stripePaymentIntentId?: string;
  createdAt: string | Date;
}

interface IKeyholder {
  name: string;
  phone: string;
  relationship: string;
}

interface IVault {
  _id: string;
  userId?: string;
  title: string;
  targetAmount: number;
  currentBalance: number;
  totalProtected: number;
  streakCount: number;
  denialsCount?: number;
  cadence: "daily" | "weekly" | "biweekly" | "monthly" | "custom";
  customCadenceDays?: number;
  incrementalSavingsType?: "none" | "fixed" | "percentage";
  incrementalSavingsValue?: number;
  pullAmount: number;
  allowanceDay: number;
  targetDate: string;
  nextPullAt?: string | Date;
  needsAttention?: boolean;
  needsAttentionReason?: string | null;
  status: "LOCKED" | "UNLOCK_PENDING" | "UNLOCKED";
  keyholder: IKeyholder;
  unlockToken?: string | null;
  unlockReason?: string | null;
  realityCheck?: string | null;
  transactions: ITransaction[];
}

interface IUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  allowanceDay: number;
  cardBrand?: string | null;
  cardLast4?: string | null;
  hasPaymentMethod?: boolean;
}

function getHumanLedgerTitle(tx: { note?: string; type: string; amount?: number }, isArabic: boolean): string {
  const note = tx.note || "";
  if (note.includes("Weekend saver micro-pull") || note.includes("Scheduled auto-pull") || note.includes("Scheduled save") || note.includes("Allowance Tuck")) {
    return isArabic ? "توفير أسبوعي" : "Weekly save";
  }
  if (note.includes("Emergency self-break executed") || note.includes("You broke the vault")) {
    return isArabic ? "كسرت الخزينة (استرجاع ٨٥٪)" : "You broke the vault (85% returned)";
  }
  if (note.includes("penalty fee") || note.includes("Emergency fee") || note.includes("Early release fee")) {
    return isArabic ? "رسوم طوارئ (١٥٪)" : "Emergency fee (15%)";
  }
  if (tx.type === "SCHEDULED_PULL" || tx.type === "SIMULATED_PULL") {
    return isArabic ? "توفير أسبوعي" : "Weekly save";
  }
  if (tx.type === "BREAK_REFUND") {
    return isArabic ? "كسرت الخزينة (استرجاع ٨٥٪)" : "You broke the vault (85% returned)";
  }
  if (tx.type === "DISCIPLINE_FEE") {
    return isArabic ? "رسوم طوارئ (١٥٪)" : "Emergency fee (15%)";
  }
  if (tx.type === "TOP_UP" || tx.type === "STRIPE_DEPOSIT") {
    return isArabic ? "إيداع بالبطاقة" : "Card Deposit";
  }
  if (tx.type === "BREAK_DENIED") {
    return isArabic ? "تم رفض الكسر وبقي القفل" : "Break rejected (funds locked)";
  }
  return note || (isArabic ? "حركة توفير" : "Vault activity");
}

function DashboardContent() {
  const router = useRouter();
  const { t, lang } = useT();
  const isArabic = lang === "ar";

  const [vaults, setVaults] = useState<IVault[]>([]);
  const [selectedVaultIndex, setSelectedVaultIndex] = useState(0);
  const vault = vaults[selectedVaultIndex] || null;
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  const updateCurrentVault = (updated: IVault) => {
    setVaults((prev) => {
      const next = [...prev];
      next[selectedVaultIndex] = updated;
      return next;
    });
  };

  // Top Up Modal State (Task 3)
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(20);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [topUpSuccess, setTopUpSuccess] = useState<string | null>(null);

  // Card Modal State
  const [showCardModal, setShowCardModal] = useState(false);

  // Break Sheet States (Task 5)
  const [showBreakSheet, setShowBreakSheet] = useState(false);
  const [breakStep, setBreakStep] = useState<"reason" | "roast" | "share">("reason");
  const [reasonText, setReasonText] = useState("");
  const [roastText, setRoastText] = useState("");
  const [loadingRoast, setLoadingRoast] = useState(false);
  const [submittingBreak, setSubmittingBreak] = useState(false);
  const [unlockUrl, setUnlockUrl] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Initial Fetch
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [meRes, vaultRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/vault"),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.user) {
            setUser(meData.user);
          }
        }

        if (vaultRes.ok) {
          const vaultData = await vaultRes.json();
          if (vaultData.success) {
            if (vaultData.vaults && vaultData.vaults.length > 0) {
              setVaults(vaultData.vaults);
            } else if (vaultData.vault) {
              setVaults([vaultData.vault]);
            }
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Top Up Handler
  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vault) return;
    const finalAmount = customAmount ? parseFloat(customAmount) : topUpAmount;
    if (isNaN(finalAmount) || finalAmount <= 0) {
      setTopUpError(isArabic ? "يرجى تحديد مبلغ صالح" : "Please enter a valid amount");
      return;
    }

    try {
      setTopUpLoading(true);
      setTopUpError(null);
      setTopUpSuccess(null);

      const res = await fetch("/api/vault/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaultId: vault._id, amountKwd: finalAmount }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.requiresPaymentMethod) {
          setShowTopUpModal(false);
          setShowCardModal(true);
          return;
        }
        setTopUpError(data.error || "Top-up failed");
        return;
      }

      updateCurrentVault(data.vault);
      setTopUpSuccess(data.message || t("dashboard.topUpSuccess"));
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#CFFF3A", "#6B4DFF", "#2DE0A5", "#14102B"],
      });
      setTimeout(() => {
        setShowTopUpModal(false);
        setTopUpSuccess(null);
        setCustomAmount("");
      }, 1800);
    } catch (err: any) {
      setTopUpError(err.message || "Network error processing payment");
    } finally {
      setTopUpLoading(false);
    }
  };

  // Step 1 -> Step 2: Fetch AI Reality Check addressed to the user
  const handleFetchRoast = async () => {
    if (!vault || reasonText.trim().length < 10) return;
    try {
      setLoadingRoast(true);
      const res = await fetch("/api/ai/reality-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          excuse: reasonText.trim(),
          goal: vault.title,
          currentBalance: vault.currentBalance,
          targetAmount: vault.targetAmount,
          keyholderName: vault.keyholder?.name || "Ahmed",
          lang,
        }),
      });

      const data = await res.json();
      setRoastText(data.realityCheck || "");
      setBreakStep("roast");
    } catch {
      setRoastText(
        isArabic
          ? "يا صاحبي اذكر الله وفكر بهدفك قبل لا تطير فلوسك وتضيع تعبك!"
          : "Bro, think about your goal before blowing your savings on impulse spending!"
      );
      setBreakStep("roast");
    } finally {
      setLoadingRoast(false);
    }
  };

  // Step 2 -> Step 3: User clicks "Still sending it" -> create single-use token & open WhatsApp
  const handleConfirmBreakRequest = async () => {
    if (!vault) return;
    try {
      setSubmittingBreak(true);
      const res = await fetch(`/api/vault/${vault._id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST",
          excuse: reasonText.trim(),
          realityCheck: roastText,
          lang,
        }),
      });

      const data = await res.json();
      if (data.success && data.vault) {
        updateCurrentVault(data.vault);
        setUnlockUrl(data.unlockUrl || "");
        setWhatsappUrl(data.whatsappUrl || "");
        setBreakStep("share");
      } else {
        alert(data.error || "Failed to submit break request");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create request");
    } finally {
      setSubmittingBreak(false);
    }
  };

  // Emergency Solo Break (15% emergency fee, 85% refund)
  const handleEmergencyBreak = async () => {
    if (!vault) return;
    const confirmMsg = isArabic
      ? `هل أنت متأكد من الكسر الفوري دون موافقة رفيقك؟ سيتم اقتطاع ${SOLO_FEE_PCT}٪ رسوم طوارئ واسترداد ${SOLO_RETURN_PCT}٪.`
      : `Are you sure you want to break immediately alone? A ${SOLO_FEE_PCT}% emergency fee will be deducted (${SOLO_RETURN_PCT}% refund).`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setSubmittingBreak(true);
      const res = await fetch(`/api/vault/${vault._id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "EMERGENCY_BREAK" }),
      });
      const data = await res.json();
      if (data.success && data.vault) {
        updateCurrentVault(data.vault);
        setShowBreakSheet(false);
        alert(isArabic ? `تم كسر الخزينة بنجاح واقتطاع ${SOLO_FEE_PCT}٪ رسوم طوارئ.` : `Vault emergency broken. ${SOLO_RETURN_PCT}% refund initiated.`);
      } else {
        alert(data.error || "Failed to execute emergency break");
      }
    } catch (err: any) {
      alert(err.message || "Failed to emergency break");
    } finally {
      setSubmittingBreak(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Loading Screen (Branded Light Neobrutalist Safe)
  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center p-4 selection:bg-lime selection:text-ink">
        <div className="card-hard bg-surface p-8 max-w-sm w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-lime border-2 border-ink mx-auto flex items-center justify-center shadow-[3px_3px_0_var(--ink)] animate-bounce">
            <Lock className="w-8 h-8 text-ink stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-ink font-heading tracking-tight">Tijori</h2>
            <p className="text-xs font-bold text-muted">
              {isArabic ? "جاري مزامنة بيانات الخزينة..." : "Syncing Tijori Vault..."}
            </p>
          </div>
          <div className="w-full bg-bg border-2 border-ink rounded-full h-3 overflow-hidden p-0.5">
            <div className="bg-lime h-full rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // Empty State: New User with 0 Vaults
  if (!vault) {
    return (
      <div className="min-h-screen bg-bg text-text overflow-x-clip">
        <header className="border-b border-line bg-surface/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            <BrandLogo href="/" size="sm" showTagline={false} />
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <LanguageSwitcher />
              <button
                onClick={handleLogout}
                className="py-1.5 px-3 rounded-btn bg-surface hover:bg-raised border border-line text-xs font-medium text-muted hover:text-text transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isArabic ? "خروج" : "Log out"}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-lime border-2 border-ink mx-auto flex items-center justify-center shadow-[3px_3px_0_var(--ink)]">
            <Lock className="w-8 h-8 text-ink" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink font-heading">
              {t("dashboard.emptyState.title")}
            </h1>
            <p className="text-sm text-muted font-medium max-w-md mx-auto">
              {t("dashboard.emptyState.subtitle")}
            </p>
          </div>
          <Link
            href="/onboarding"
            className="btn-hard inline-flex items-center gap-2 px-8 py-3.5 bg-lime text-ink font-extrabold text-base shadow-[4px_4px_0_var(--ink)] cursor-pointer"
          >
            <span>{t("dashboard.emptyState.action")}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </main>
      </div>
    );
  }

  // Computed Values
  const percentFunded = Math.min(
    100,
    Math.round(((vault.currentBalance || 0) / (vault.targetAmount || 1)) * 100)
  );

  const keyholderFirstName = vault.keyholder?.name
    ? vault.keyholder.name.split(" ")[0]
    : isArabic ? "أحمد" : "Ahmed";

  const isPendingBreak = vault.status === "UNLOCK_PENDING";

  // Sorted Transactions (Newest first, real timestamps)
  const sortedTransactions = [...(vault.transactions || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Proportional Next 4 Saves Pacing (renders full height immediately)
  const basePull = Number(vault.pullAmount) || 25;
  const cadence = vault.cadence || "weekly";
  const customDays = Math.max(1, Math.min(30, Number(vault.customCadenceDays) || 7));
  const incType = vault.incrementalSavingsType || "none";
  const incVal = Number(vault.incrementalSavingsValue) || 0;

  let stepDays = 7;
  if (cadence === "daily") stepDays = 1;
  else if (cadence === "biweekly") stepDays = 14;
  else if (cadence === "monthly") stepDays = 30;
  else if (cadence === "custom") stepDays = customDays;

  const startPullDate = vault.nextPullAt ? new Date(vault.nextPullAt) : new Date();

  const nextFourSaves = Array.from({ length: 4 }).map((_, i) => {
    const pullDate = new Date(startPullDate.getTime() + i * stepDays * 24 * 60 * 60 * 1000);
    let amt = basePull;
    if (incType === "fixed") {
      amt = basePull + i * incVal;
    } else if (incType === "percentage") {
      amt = Math.round(basePull * Math.pow(1 + incVal / 100, i));
    }

    const weekday = new Intl.DateTimeFormat(isArabic ? "ar-KW" : "en-US", { weekday: "short" }).format(pullDate);
    const day = String(pullDate.getDate()).padStart(2, "0");
    const month = String(pullDate.getMonth() + 1).padStart(2, "0");
    const dateLabel = `${weekday} ${day}/${month}`;

    return {
      index: i + 1,
      date: pullDate,
      dateLabel,
      amount: amt,
    };
  });

  const maxNextAmount = Math.max(...nextFourSaves.map((s) => s.amount), 1);
  const hasSavedCard = Boolean(user?.cardLast4);

  // Next Save formatted string
  const nextDateFormatted = vault.nextPullAt
    ? formatDate(vault.nextPullAt, lang)
    : isArabic ? "الأحد القادم" : "Sunday";

  return (
    <div className="min-h-screen bg-bg text-ink selection:bg-lime selection:text-ink pb-16 overflow-x-clip">
      {/* ── 1. TOP BAR: Greeting + Language Switcher + Avatar (No mobile overflow) ── */}
      <header className="border-b-2 border-ink bg-surface/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo & Greeting */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <BrandLogo href="/" size="sm" showTagline={false} />

            {user && (
              <div className="hidden sm:flex items-center gap-1.5 ms-2 ps-3 border-s-2 border-ink/20 text-xs font-bold text-ink">
                <span className="text-muted">{isArabic ? "حيّاك،" : "Salam,"}</span>
                <span className="font-extrabold">{user.name.split(" ")[0]}</span>
              </div>
            )}
          </div>

          {/* Right: Language Switcher + Saved Card + Avatar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Card chip */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border-2 border-ink text-xs font-bold text-ink shadow-[2px_2px_0_var(--ink)]">
              <CreditCard className="w-3.5 h-3.5 text-violet" />
              <span>
                {user?.cardLast4 ? (
                  `${user.cardBrand || "Visa"} •••• ${user.cardLast4}`
                ) : (
                  <button onClick={() => setShowCardModal(true)} className="text-violet hover:underline cursor-pointer">
                    {t("dashboard.linkCard")}
                  </button>
                )}
              </span>
            </div>

            <LanguageSwitcher />

            {/* Avatar & Logout */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-lime text-ink border-2 border-ink font-extrabold text-xs flex items-center justify-center shadow-[2px_2px_0_var(--ink)]"
                title={user?.name}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                className="p-2 rounded-full bg-surface hover:bg-bg border-2 border-ink text-ink shadow-[2px_2px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN DASHBOARD CONTAINER (Phone-First, Desktop 2-Column) ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Multi-Vault Switcher (Up to 5 active vaults) */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {vaults.map((v, idx) => (
              <button
                key={v._id || idx}
                type="button"
                onClick={() => setSelectedVaultIndex(idx)}
                className={cn(
                  "px-4 py-2 rounded-full font-bold text-xs sm:text-sm border-2 border-ink transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                  selectedVaultIndex === idx
                    ? "bg-lime text-ink shadow-[2px_2px_0_var(--ink)] -translate-y-0.5"
                    : "bg-surface text-ink hover:bg-bg shadow-none"
                )}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{v.title}</span>
                <span className="text-xs opacity-80 font-bold">
                  ({formatKwd(v.currentBalance, lang)})
                </span>
              </button>
            ))}

            {vaults.length < 5 && (
              <Link
                href="/onboarding"
                className="px-4 py-2 rounded-full font-bold text-xs sm:text-sm border-2 border-dashed border-ink bg-surface text-ink hover:bg-lime/30 transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-[1px_1px_0_var(--ink)]"
              >
                <span className="font-black">+</span>
                <span>{isArabic ? "خزينة جديدة" : "New Vault"}</span>
                <span className="text-xs text-muted font-normal">
                  ({vaults.length}/5)
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* ATTENTION REQUIRED BANNER (if charge failed) */}
        {vault.needsAttention && (
          <div className="p-4 rounded-2xl bg-coral/15 border-2 border-ink text-ink flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[4px_4px_0_var(--ink)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-coral border-2 border-ink flex items-center justify-center text-white shrink-0 shadow-[2px_2px_0_var(--ink)]">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-ink">
                  {t("dashboard.needsAttentionBanner")}
                </h4>
                <p className="text-xs text-muted font-medium mt-0.5">
                  {vault.needsAttentionReason || "Card charge failed. Please update your card."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCardModal(true)}
              className="btn-hard py-2 px-4 bg-coral text-white font-bold text-xs shrink-0 self-end sm:self-center shadow-[2px_2px_0_var(--ink)] cursor-pointer"
            >
              {t("dashboard.changeCard")}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT COLUMN (lg:col-span-7): HERO VAULT CARD + ACTIONS ── */}
          <div className="lg:col-span-7 space-y-6">
            {/* VAULT HERO CARD */}
            <div
              className={cn(
                "card-hard bg-surface border-2 border-ink p-6 sm:p-8 transition-all relative overflow-hidden shadow-[4px_4px_0_var(--ink)]",
                isPendingBreak
                  ? "bg-coral/10 border-coral shadow-[4px_4px_0_var(--coral)]"
                  : "bg-surface"
              )}
            >
              {/* SINGLE PENDING STATE BANNER (Shown ONCE, not in four places) */}
              {isPendingBreak && (
                <div className="mb-6 p-3.5 rounded-2xl bg-coral/15 border border-coral/40 text-coral flex items-center justify-between gap-3 animate-pulse">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-coral shrink-0" />
                    <span className="font-extrabold text-xs sm:text-sm">
                      {isArabic
                        ? `بانتظار موافقة ${keyholderFirstName}`
                        : `Waiting on ${keyholderFirstName}`}
                    </span>
                  </div>
                  <span className="text-xs font-bold bg-coral/20 px-2.5 py-0.5 rounded-btn">
                    {isArabic ? "طلب كسر معلّق" : "Break Request Pending"}
                  </span>
                </div>
              )}

              {/* Card Header: Goal Title & Small Flame Streak Counter */}
              <div className="flex items-center justify-between gap-3 pb-6 border-b-2 border-ink/10">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight font-heading">
                    <GoalTitle title={vault.title} />
                  </h1>
                  <p className="text-xs text-muted font-medium mt-0.5">
                    {isArabic ? "المفتاح بيد:" : "Key held by"} {vault.keyholder?.name}
                  </p>
                </div>

                {/* Flame Streak Counter (Hidden when streak is 0) */}
                {(vault.streakCount ?? 0) > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sun border-2 border-ink text-ink font-extrabold text-xs shadow-[2px_2px_0_var(--ink)]">
                    <Flame className="w-4 h-4 text-ink fill-ink" />
                    <span>
                      {t("dashboard.savesInARow", { count: vault.streakCount })}
                    </span>
                  </div>
                )}
              </div>

              {/* 3D VAULT DIAL (Tactile Metallic Vault Wheel with Luminous Progress Arc) */}
              <div className="py-6 sm:py-8 flex flex-col items-center justify-center relative select-none">
                {/* Vault Wheel Container */}
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                  {/* Subtle Background Glow behind dial */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full blur-2xl pointer-events-none transition-all duration-700",
                      isPendingBreak ? "bg-coral/20" : "bg-lime/25"
                    )}
                  />

                  <svg className="w-full h-full -rotate-90 transform relative z-10" viewBox="0 0 280 280">
                    <defs>
                      <linearGradient id="limeDialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6B4DFF" />
                        <stop offset="100%" stopColor="#CFFF3A" />
                      </linearGradient>
                      <linearGradient id="coralDialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF5A6E" />
                        <stop offset="100%" stopColor="#FFD23F" />
                      </linearGradient>
                    </defs>

                    {/* Outer Bezel Rim */}
                    <circle
                      cx="140"
                      cy="140"
                      r="124"
                      stroke="#14102B"
                      strokeWidth="4"
                      fill="transparent"
                      className="opacity-90"
                    />

                    {/* Concentric Bolt Rivet Markers */}
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                      const rad = (deg * Math.PI) / 180;
                      const x = 140 + 124 * Math.cos(rad);
                      const y = 140 + 124 * Math.sin(rad);
                      return (
                        <circle
                          key={deg}
                          cx={x}
                          cy={y}
                          r="3"
                          fill="#14102B"
                          className="opacity-90"
                        />
                      );
                    })}

                    {/* Track */}
                    <circle
                      cx="140"
                      cy="140"
                      r="112"
                      stroke="#EAE4FF"
                      strokeWidth="14"
                      fill="transparent"
                      strokeLinecap="round"
                    />

                    {/* Progress Arc */}
                    <circle
                      cx="140"
                      cy="140"
                      r="112"
                      stroke={isPendingBreak ? "url(#coralDialGradient)" : "url(#limeDialGradient)"}
                      strokeWidth="14"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 112}
                      strokeDashoffset={2 * Math.PI * 112 * (1 - Math.max(0.02, percentFunded / 100))}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>

                  {/* Center Hub & Numbers */}
                  <div className="absolute inset-7 rounded-full bg-surface border-2 border-ink flex flex-col items-center justify-center text-center p-6 shadow-[4px_4px_0_var(--ink)] z-20">
                    <span className="text-xs text-muted font-bold mb-1 relative z-10">
                      {isArabic ? "المبلغ المحفوظ" : "Saved so far"}
                    </span>

                    <div className="flex items-baseline justify-center gap-1.5 relative z-10">
                      <span className="text-4xl sm:text-5xl font-black text-ink tracking-tight tabular-nums font-heading">
                        {formatKWD(vault.currentBalance)}
                      </span>
                      <span className="text-sm font-extrabold text-violet">
                        {isArabic ? "د.ك" : "KWD"}
                      </span>
                    </div>

                    <span className="text-xs text-muted mt-2 font-bold relative z-10">
                      {isArabic ? "الهدف:" : "Goal:"} {formatKwd(vault.targetAmount, lang)} ({percentFunded}%)
                    </span>
                  </div>
                </div>

                {/* Status Line Under Dial */}
                <div className="mt-4 text-center">
                  <p className="text-xs sm:text-sm text-ink font-bold flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-violet shrink-0" />
                    <span>
                      {isArabic
                        ? `التوفير القادم: ${formatKwd(vault.pullAmount, lang)} في ${nextDateFormatted}`
                        : `Next save: ${formatKwd(vault.pullAmount, lang)} on ${nextDateFormatted}`}
                    </span>
                  </p>
                </div>
              </div>

              {/* Real Denials Pill (Only shown if real denials exist in DB) */}
              {(vault.denialsCount ?? 0) > 0 && (
                <div className="pt-2 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-lime border-2 border-ink text-xs font-bold text-ink shadow-[2px_2px_0_var(--ink)]">
                    <ShieldCheck className="w-3.5 h-3.5 text-ink" />
                    <span>
                      {isArabic
                        ? `تم تجنب ${vault.denialsCount} محاولات كسر (${formatKwd(vault.totalProtected, lang)} محمية)`
                        : `${vault.denialsCount} breaks avoided (${formatKwd(vault.totalProtected, lang)} protected)`}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* ── TWO ACTIONS ONLY BELOW HERO ── */}
            <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full">
              {/* Primary Lime: Add money */}
              <button
                type="button"
                id="add-money-now-btn"
                onClick={() => setShowTopUpModal(true)}
                className="btn-hard flex-1 py-4 px-6 bg-lime text-ink font-extrabold text-base shadow-[4px_4px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t("dashboard.addMoneyAction")}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>

              {/* Secondary Ghost: I need to break it (or Pending state) */}
              <button
                type="button"
                id="break-vault-action-btn"
                disabled={isPendingBreak}
                onClick={() => {
                  if (isPendingBreak) return;
                  setBreakStep("reason");
                  setReasonText("");
                  setShowBreakSheet(true);
                }}
                className={cn(
                  "btn-hard flex-1 py-4 px-6 border-2 font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer",
                  isPendingBreak
                    ? "border-coral bg-coral/10 text-coral cursor-not-allowed opacity-90 shadow-[2px_2px_0_var(--coral)]"
                    : "border-ink bg-surface text-ink hover:bg-coral/10 hover:text-coral shadow-[4px_4px_0_var(--ink)] hover:translate-x-0.5 hover:translate-y-0.5"
                )}
              >
                <span>
                  {isPendingBreak
                    ? isArabic
                      ? "طلب الكسر بانتظار الموافقة"
                      : "Break Request Pending"
                    : t("dashboard.breakAction")}
                </span>
              </button>
            </div>
          </div>

          {/* ── RIGHT COLUMN (lg:col-span-5): WEEKLY PACING + LEDGER ── */}
          <div className="lg:col-span-5 space-y-6">
            {/* WEEKLY PACING: Clean 4-bar chart rendering at full height immediately */}
            <div className="card-hard bg-surface border-2 border-ink p-6 shadow-[4px_4px_0_var(--ink)] space-y-4">
              <div>
                <h3 className="font-extrabold text-base text-ink font-heading">
                  {t("dashboard.pacingTitle")}
                </h3>
                <p className="text-xs text-muted font-medium mt-0.5">
                  {t("dashboard.pacingSubtitle")}
                </p>
              </div>

              {/* 4 Clean Proportional Bars or Add Card Empty State */}
              {!hasSavedCard ? (
                <div className="py-6 px-4 text-center rounded-2xl bg-bg border-2 border-dashed border-ink/30 space-y-3">
                  <CreditCard className="w-8 h-8 text-muted mx-auto" />
                  <p className="text-xs text-muted font-medium">
                    {t("dashboard.noCardPacing")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCardModal(true)}
                    className="btn-hard inline-flex items-center gap-1.5 px-4 py-2 bg-lime text-ink font-extrabold text-xs shadow-[2px_2px_0_var(--ink)] cursor-pointer"
                  >
                    <span>{t("dashboard.addCardCta")}</span>
                  </button>
                </div>
              ) : (
                <div className="h-40 pt-4 flex items-end justify-between gap-2 sm:gap-3 px-1 border-b-2 border-ink/10 pb-3">
                  {nextFourSaves.map((s, idx) => {
                    const barHeightPercent = Math.max(
                      18,
                      Math.round((s.amount / maxNextAmount) * 100)
                    );
                    const isFirst = idx === 0;

                    return (
                      <div key={s.index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        {/* Amount above bar with 3 decimals */}
                        <span className="text-xs font-bold text-ink tabular-nums text-center whitespace-nowrap">
                          {formatKwd(s.amount, lang)}
                        </span>

                        {/* Bar rendered at full height immediately */}
                        <div className="w-full max-w-[48px] bg-bg border-2 border-ink rounded-t-xl overflow-hidden flex flex-col justify-end h-24">
                          <div
                            style={{ height: `${barHeightPercent}%` }}
                            className={cn(
                              "w-full rounded-t-lg transition-none",
                              isFirst ? "bg-lime" : "bg-violet"
                            )}
                          />
                        </div>

                        {/* Real Date Label below bar (DD/MM) */}
                        <span className="text-xs text-muted font-bold text-center whitespace-nowrap">
                          {s.dateLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ACTIVITY LEDGER: Simple list, newest first, real timestamps, no fake rows */}
            <div className="card-hard bg-surface border-2 border-ink p-6 shadow-[4px_4px_0_var(--ink)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-ink/10">
                <h3 className="font-extrabold text-base text-ink font-heading">
                  {t("dashboard.recentActivity")}
                </h3>
                <span className="text-xs font-bold text-muted">
                  {sortedTransactions.length} {isArabic ? "حركات" : "entries"}
                </span>
              </div>

              {sortedTransactions.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-bg border-2 border-ink mx-auto flex items-center justify-center text-muted">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-muted font-medium">
                    {t("dashboard.noActivity")}
                  </p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2.5 pe-1 scrollbar-thin">
                  {sortedTransactions.map((tx, idx) => {
                    const isCredit =
                      tx.type === "TOP_UP" ||
                      tx.type === "SCHEDULED_PULL" ||
                      tx.type === "STRIPE_DEPOSIT";
                    const isDebit =
                      tx.type === "WITHDRAWAL" ||
                      tx.type === "BREAK_REFUND" ||
                      tx.type === "DISCIPLINE_FEE";

                    return (
                      <div
                        key={tx._id || idx}
                        className="p-3 rounded-2xl bg-bg border-2 border-ink flex items-center justify-between gap-3 text-xs shadow-[1px_1px_0_var(--ink)]"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-ink">
                            {getHumanLedgerTitle(tx, isArabic)}
                          </p>
                          <p className="text-xs text-muted font-medium">
                            {formatDate(tx.createdAt, lang)}
                          </p>
                        </div>

                        <div className="text-end shrink-0">
                          <span
                            className={cn(
                              "font-extrabold text-xs sm:text-sm tabular-nums",
                              isCredit
                                ? "text-violet"
                                : isDebit
                                ? "text-coral"
                                : "text-muted"
                            )}
                          >
                            {isCredit ? "+" : isDebit ? "-" : ""}
                            {formatKwd(tx.amount, lang)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── BREAK FLOW BOTTOM SHEET / MODAL (The core of the product) ── */}
      {showBreakSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-surface border border-line rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-8 space-y-4 sm:space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowBreakSheet(false)}
              className="absolute top-5 end-5 p-2 rounded-full hover:bg-raised text-muted hover:text-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* STEP 1: Reason Input */}
            {breakStep === "reason" && (
              <div className="space-y-3.5 sm:space-y-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-btn bg-coral/15 border border-coral/30 text-coral text-xs font-bold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{t("dashboard.breakSheetTitle")}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-text">
                    {t("dashboard.reasonLabel")}
                  </h2>
                </div>

                {/* Plain 1-Sentence Fee Notice */}
                <div className="p-3.5 rounded-2xl bg-raised border border-line text-xs text-muted leading-relaxed">
                  {t("dashboard.breakSheetFeeNotice", { fee: FRIEND_FEE_PCT, keep: FRIEND_RETURN_PCT })}
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder={t("dashboard.reasonPlaceholder")}
                    className="w-full px-4 py-3 rounded-2xl bg-bg border border-line focus:border-accent text-sm text-text placeholder:text-muted/60 resize-none outline-hidden"
                  />
                  <div className="flex justify-between text-xs text-muted">
                    <span>
                      {reasonText.trim().length >= 10
                        ? isArabic ? "العذر كافي" : "Reason long enough"
                        : isArabic ? "١٠ أحرف على الأقل" : "10 characters min"}
                    </span>
                    <span>{reasonText.trim().length} / 10</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {/* Primary Lime: Keep it locked */}
                  <button
                    type="button"
                    onClick={() => setShowBreakSheet(false)}
                    className="btn-hard flex-1 py-3.5 px-5 bg-lime text-ink font-extrabold text-sm shadow-[3px_3px_0_var(--ink)] cursor-pointer"
                  >
                    {t("dashboard.keepLockedBtn")}
                  </button>

                  {/* Secondary: Send to Keyholder (Ahmed - 5% fee) */}
                  <button
                    type="button"
                    id="ask-keyholder-btn"
                    disabled={reasonText.trim().length < 10 || loadingRoast}
                    onClick={handleFetchRoast}
                    className="btn-hard flex-1 py-3.5 px-5 bg-surface text-ink font-bold text-sm disabled:opacity-40 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0_var(--ink)]"
                  >
                    {loadingRoast ? (
                      <Loader2 className="w-4 h-4 animate-spin text-violet" />
                    ) : (
                      <span>
                        {isArabic
                          ? `طلب إذن ${keyholderFirstName} (خصم ${FRIEND_FEE_PCT}%)`
                          : `Ask ${keyholderFirstName} (${FRIEND_FEE_PCT}% fee)`}
                      </span>
                    )}
                  </button>
                </div>

                {/* Option B: Emergency Solo Break (15% emergency fee, 85% refund) */}
                <div className="pt-2 border-t-2 border-ink/10">
                  <button
                    type="button"
                    id="solo-emergency-break-btn"
                    disabled={submittingBreak}
                    onClick={handleEmergencyBreak}
                    className="w-full py-3 px-4 rounded-xl border-2 border-coral bg-coral/10 hover:bg-coral/20 text-coral font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-[2px_2px_0_var(--coral)]"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-coral shrink-0" />
                    <span>
                      {isArabic
                        ? `أو كسر فوري بنفسك الآن (خصم ${SOLO_FEE_PCT}% رسوم طوارئ)`
                        : `Or break immediately alone (${SOLO_FEE_PCT}% emergency fee)`}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Intense AI Reality Check (Addressed TO THE USER) */}
            {breakStep === "roast" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-btn bg-violet/20 border border-violet/40 text-[#E3DAFC] text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span>{t("dashboard.roastHeading")}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-text">
                    {t("dashboard.roastSub")}
                  </h2>
                </div>

                {/* Intense Roast Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-surface to-raised border border-violet/40 shadow-violetSubtle relative">
                  <blockquote className="text-sm sm:text-base text-text font-semibold italic leading-relaxed" dir="auto">
                    <bdi>&ldquo;{roastText.replace(/^["“\s]+|["”\s]+$/g, "")}&rdquo;</bdi>
                  </blockquote>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {/* Primary Lime: You're right, keep it locked */}
                  <button
                    type="button"
                    onClick={() => setShowBreakSheet(false)}
                    className="tactile-btn flex-1 py-3.5 px-5 rounded-btn bg-accent text-accent-foreground font-extrabold text-sm shadow-limeGlow"
                  >
                    {t("dashboard.keepLockedRoastBtn")}
                  </button>

                  {/* Secondary Destructive: Still sending it */}
                  <button
                    type="button"
                    id="still-sending-break-btn"
                    disabled={submittingBreak}
                    onClick={handleConfirmBreakRequest}
                    className="flex-1 py-3.5 px-5 rounded-btn border border-coral/50 bg-coral/10 hover:bg-coral/20 text-coral font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                  >
                    {submittingBreak ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>{t("dashboard.stillSendingBtn")}</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Share with Keyholder via WhatsApp */}
            {breakStep === "share" && (
              <div className="space-y-4 sm:space-y-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-coral/15 border border-coral/30 flex items-center justify-center mx-auto text-coral">
                  <ShieldAlert className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-text">
                    {isArabic
                      ? `بانتظار موافقة ${keyholderFirstName}`
                      : `Waiting on ${keyholderFirstName}`}
                  </h2>
                  <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                    {isArabic
                      ? `تم إنشاء رابط الفتح ذو الاستخدام الواحد. أرسل الرسالة إلى ${keyholderFirstName} عبر واتساب ليقرر.`
                      : `Your single-use unlock link is ready. Send it to ${keyholderFirstName} on WhatsApp for their decision.`}
                  </p>
                </div>

                <div className="space-y-3">
                  {/* WhatsApp button */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tactile-btn w-full py-4 px-6 rounded-btn bg-[#25D366] hover:bg-[#20BE5B] text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-md"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>
                      {isArabic
                        ? `إرسال عبر واتساب لـ ${keyholderFirstName}`
                        : `Send WhatsApp to ${keyholderFirstName}`}
                    </span>
                  </a>

                  {/* Copy Link Button */}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(unlockUrl)}
                    className="w-full py-3 px-4 rounded-btn border border-line bg-surface hover:bg-raised text-xs text-muted hover:text-text font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>
                      {copiedLink
                        ? t("dashboard.linkCopied")
                        : t("dashboard.copyClearanceLink")}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBreakSheet(false)}
                  className="text-xs text-muted hover:text-text underline pt-1"
                >
                  {isArabic ? "الرجوع للخزينة" : "Back to Vault"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TOP UP MODAL (Task 3 Real Payments) ── */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface border border-line rounded-[28px] p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowTopUpModal(false)}
              className="absolute top-5 end-5 p-2 rounded-full hover:bg-raised text-muted hover:text-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-text">
                {t("dashboard.topUpTitle")}
              </h2>
              <p className="text-xs text-muted">
                {t("dashboard.topUpSubtitle")}
              </p>
            </div>

            {topUpError && (
              <div className="p-3.5 rounded-xl bg-coral/10 border border-coral/30 text-coral text-xs">
                {topUpError}
              </div>
            )}

            {topUpSuccess && (
              <div className="p-3.5 rounded-xl bg-accent/15 border border-accent/40 text-accent font-bold text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{topUpSuccess}</span>
              </div>
            )}

            <form onSubmit={handleTopUpSubmit} className="space-y-5">
              {/* Preset Chips */}
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setTopUpAmount(amt);
                      setCustomAmount("");
                    }}
                    className={cn(
                      "py-2.5 rounded-btn font-bold text-xs border transition-colors",
                      topUpAmount === amt && !customAmount
                        ? "bg-accent text-accent-foreground border-accent shadow-limeGlow"
                        : "bg-raised border-line text-muted hover:text-text"
                    )}
                  >
                    +{amt} {isArabic ? "د.ك" : "KWD"}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted">
                  {isArabic ? "أو اكتب مبلغ مخصص:" : "Or custom amount:"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.5"
                    placeholder="e.g. 25"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-btn bg-bg border border-line focus:border-accent text-sm text-text outline-hidden"
                  />
                  <span className="absolute end-4 top-3 text-xs text-muted font-bold">
                    {isArabic ? "د.ك" : "KWD"}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                id="confirm-topup-submit-btn"
                disabled={topUpLoading}
                className="tactile-btn w-full py-4 px-6 rounded-btn bg-accent text-accent-foreground font-extrabold text-sm shadow-limeGlow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {topUpLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>
                    {isArabic
                      ? `تأكيد إضافة ${customAmount || topUpAmount} د.ك`
                      : `Confirm Add ${customAmount || topUpAmount} KWD`}
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── CARD SETUP MODAL (Stripe Elements) ── */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-surface border border-line rounded-[28px] p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCardModal(false)}
              className="absolute top-5 end-5 p-2 rounded-full hover:bg-raised text-muted hover:text-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-text">
                {t("dashboard.linkCard")}
              </h2>
              <p className="text-xs text-muted">
                {t("dashboard.topUpSubtitle")}
              </p>
            </div>

            <StripeCardForm
              userName={user?.name}
              userEmail={user?.email}
              onSuccess={() => {
                setShowCardModal(false);
                // Refresh user state
                fetch("/api/auth/me")
                  .then((r) => r.json())
                  .then((d) => d.user && setUser(d.user));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-3 border-line border-t-accent animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
