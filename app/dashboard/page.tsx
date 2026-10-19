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
import GoalTitle from "@/components/GoalTitle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";
import StripeCardForm from "@/components/StripeCardForm";

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
  cadence: "daily" | "weekly" | "biweekly" | "monthly";
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

function DashboardContent() {
  const router = useRouter();
  const { t, lang } = useT();
  const isArabic = lang === "ar";

  const [vault, setVault] = useState<IVault | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

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
          if (vaultData.success && vaultData.vault) {
            setVault(vaultData.vault);
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

      setVault(data.vault);
      setTopUpSuccess(data.message || t("dashboard.topUpSuccess"));
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#C6FF3D", "#7C5CFF", "#3DFFB0", "#FFFFFF"],
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
          keyholderName: vault.keyholder?.name || "Fahad",
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
        setVault(data.vault);
        setUnlockUrl(data.unlockUrl || "");
        setWhatsappUrl(data.whatsappUrl || "");
        setBreakStep("share");
      } else {
        alert(data.error || "Failed to submit clearance request");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create request");
    } finally {
      setSubmittingBreak(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 text-text">
        <div className="w-12 h-12 rounded-full border-3 border-line border-t-accent animate-spin" />
        <p className="text-sm font-mono text-muted tracking-wide">
          {isArabic ? "جاري مزامنة بيانات الخزينة..." : "Syncing Tijori Vault..."}
        </p>
      </div>
    );
  }

  // Empty State: New User with 0 Vaults
  if (!vault) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <header className="border-b border-line bg-surface/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-surface border border-line flex items-center justify-center shadow-violetSubtle">
                <Lock className="w-5 h-5 text-accent" />
              </div>
              <span className="font-extrabold text-lg text-text">Tijori</span>
            </Link>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <button
                onClick={handleLogout}
                className="py-1.5 px-3 rounded-btn bg-surface hover:bg-raised border border-line text-xs font-medium text-muted hover:text-text transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isArabic ? "خروج" : "Log out"}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-raised border border-line mx-auto flex items-center justify-center shadow-violetSubtle">
            <Lock className="w-8 h-8 text-accent" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
              {t("dashboard.emptyState.title")}
            </h1>
            <p className="text-sm text-muted max-w-md mx-auto">
              {t("dashboard.emptyState.subtitle")}
            </p>
          </div>
          <Link
            href="/onboarding"
            className="tactile-btn inline-flex items-center gap-2 px-8 py-3.5 rounded-btn bg-accent text-accent-foreground font-extrabold text-sm shadow-limeGlow"
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
    : isArabic ? "فهد" : "Fahad";

  const isPendingBreak = vault.status === "UNLOCK_PENDING";

  // Sorted Transactions (Newest first, real timestamps)
  const sortedTransactions = [...(vault.transactions || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Proportional 4-Week Pacing Bars (renders full height immediately)
  const basePull = vault.pullAmount || 25;
  const pacingWeeks = [
    { week: 1, label: isArabic ? "الأسبوع ١" : "Week 1", amount: Math.round(basePull * 1.5), note: isArabic ? "أول الشهر" : "Salary Tuck" },
    { week: 2, label: isArabic ? "الأسبوع ٢" : "Week 2", amount: basePull, note: isArabic ? "توفير دوري" : "Auto-Save" },
    { week: 3, label: isArabic ? "الأسبوع ٣" : "Week 3", amount: basePull, note: isArabic ? "توفير دوري" : "Auto-Save" },
    { week: 4, label: isArabic ? "الأسبوع ٤" : "Week 4", amount: Math.max(5, Math.round(basePull * 0.4)), note: isArabic ? "حصة أمان" : "Buffer" },
  ];
  const maxPacingAmount = Math.max(...pacingWeeks.map((w) => w.amount), 1);

  // Next Save formatted string
  const nextDateFormatted = vault.nextPullAt
    ? formatDate(vault.nextPullAt, lang)
    : isArabic ? "الأحد القادم" : "Sunday";

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-accent/20 selection:text-accent pb-16">
      {/* ── 1. TOP BAR: Greeting + Language Switcher + Avatar ── */}
      <header className="border-b border-line bg-surface/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Greeting */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-surface border border-line flex items-center justify-center shadow-violetSubtle group-hover:border-accent/40 transition-colors">
                <Lock className="w-4 h-4 text-accent" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-text">Tijori</span>
            </Link>

            {user && (
              <div className="flex items-center gap-1.5 ms-2 ps-3 border-s border-line text-xs font-semibold text-text">
                <span className="text-muted">{isArabic ? "حيّاك،" : "Salam,"}</span>
                <span className="font-bold">{user.name.split(" ")[0]}</span>
              </div>
            )}
          </div>

          {/* Right: Language Switcher + Saved Card + Avatar */}
          <div className="flex items-center gap-3">
            {/* Card chip */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-btn bg-raised border border-line text-xs text-muted">
              <CreditCard className="w-3.5 h-3.5 text-accent" />
              <span>
                {user?.cardLast4 ? (
                  `${user.cardBrand || "Visa"} •••• ${user.cardLast4}`
                ) : (
                  <button onClick={() => setShowCardModal(true)} className="text-accent hover:underline">
                    {t("dashboard.linkCard")}
                  </button>
                )}
              </span>
            </div>

            <LanguageSwitcher />

            {/* Avatar & Logout */}
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-full bg-accent text-accent-foreground font-extrabold text-xs flex items-center justify-center shadow-limeGlow"
                title={user?.name}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                className="p-2 rounded-btn bg-surface hover:bg-raised border border-line text-muted hover:text-text transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN DASHBOARD CONTAINER (Phone-First, Desktop 2-Column) ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ATTENTION REQUIRED BANNER (if charge failed) */}
        {vault.needsAttention && (
          <div className="p-4 rounded-2xl bg-coral/10 border border-coral/30 text-coral flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-coral/20 border border-coral/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-coral" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-text">
                  {t("dashboard.needsAttentionBanner")}
                </h4>
                <p className="text-xs text-coral/90 mt-0.5">
                  {vault.needsAttentionReason || "Card charge failed. Please update your card."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCardModal(true)}
              className="py-2 px-4 rounded-btn bg-coral text-white font-bold text-xs shrink-0 self-end sm:self-center"
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
                "rounded-[28px] p-6 sm:p-8 transition-all relative overflow-hidden border shadow-card",
                isPendingBreak
                  ? "bg-coral/10 border-coral/50 shadow-coralGlow"
                  : "bg-surface border-line shadow-violetSubtle"
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
                  <span className="text-xs font-mono font-bold bg-coral/20 px-2.5 py-0.5 rounded-btn">
                    {isArabic ? "طلب كسر معلّق" : "Clearance Pending"}
                  </span>
                </div>
              )}

              {/* Card Header: Goal Title & Small Flame Streak Counter */}
              <div className="flex items-center justify-between gap-3 pb-6 border-b border-line/60">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-text tracking-tight">
                    <GoalTitle title={vault.title} />
                  </h1>
                  <p className="text-xs text-muted mt-0.5">
                    {isArabic ? "حارس القفل:" : "Guarded by"} {vault.keyholder?.name}
                  </p>
                </div>

                {/* Flame Streak Counter */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-raised border border-line text-accent font-extrabold text-xs font-mono shadow-sm">
                  <Flame className="w-4 h-4 text-accent fill-accent" />
                  <span>
                    {vault.streakCount || 0} {isArabic ? "يوم التزام" : "days"}
                  </span>
                </div>
              </div>

              {/* 3D VAULT DIAL (Smaller, Center Hero with huge saved amount) */}
              <div className="py-8 flex flex-col items-center justify-center relative select-none">
                {/* SVG Progress Dial */}
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 280 280">
                    <defs>
                      <linearGradient id="limeDialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7C5CFF" />
                        <stop offset="100%" stopColor="#C6FF3D" />
                      </linearGradient>
                      <linearGradient id="coralDialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF5C7A" />
                        <stop offset="100%" stopColor="#FFA07A" />
                      </linearGradient>
                    </defs>

                    {/* Dark Steel Outer Track */}
                    <circle
                      cx="140"
                      cy="140"
                      r="120"
                      stroke="#1E1B2B"
                      strokeWidth="14"
                      fill="transparent"
                      strokeLinecap="round"
                    />

                    {/* Neon Progress Arc */}
                    <circle
                      cx="140"
                      cy="140"
                      r="120"
                      stroke={isPendingBreak ? "url(#coralDialGradient)" : "url(#limeDialGradient)"}
                      strokeWidth="14"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 120}
                      strokeDashoffset={2 * Math.PI * 120 * (1 - percentFunded / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>

                  {/* Center Hub & Huge Numbers */}
                  <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#12101E] via-[#171524] to-[#1E1B2E] border border-line/80 flex flex-col items-center justify-center text-center p-6 shadow-inner">
                    <span className="text-xs text-muted font-medium mb-1">
                      {isArabic ? "المبلغ المحفوظ" : "Saved so far"}
                    </span>

                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="text-4xl sm:text-5xl font-black text-text tracking-tight tabular-nums">
                        {formatKWD(vault.currentBalance)}
                      </span>
                      <span className="text-sm font-bold text-accent">
                        {isArabic ? "د.ك" : "KWD"}
                      </span>
                    </div>

                    <span className="text-xs text-muted mt-2 font-mono">
                      {isArabic ? "الهدف:" : "Goal:"} {formatKWD(vault.targetAmount)} ({percentFunded}%)
                    </span>
                  </div>
                </div>

                {/* One Status Line Under the Dial */}
                <div className="mt-4 text-center">
                  <p className="text-xs sm:text-sm text-muted font-medium flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    <span>
                      {isArabic
                        ? `التوفير القادم: ${formatKWD(vault.pullAmount)} د.ك في ${nextDateFormatted}`
                        : `Next save: ${formatKWD(vault.pullAmount)} KWD on ${nextDateFormatted}`}
                    </span>
                  </p>
                </div>
              </div>

              {/* Real Denials Pill (Only shown if real denials exist in DB) */}
              {(vault.denialsCount ?? 0) > 0 && (
                <div className="pt-2 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-btn bg-raised border border-line text-xs text-muted">
                    <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                    <span>
                      {isArabic
                        ? `تم تجنب ${vault.denialsCount} محاولات كسر (${formatKWD(vault.totalProtected)} د.ك محمية)`
                        : `${vault.denialsCount} breaks avoided (${formatKWD(vault.totalProtected)} KWD protected)`}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* ── TWO ACTIONS ONLY BELOW HERO ── */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Primary Lime: Add money */}
              <button
                type="button"
                onClick={() => setShowTopUpModal(true)}
                className="tactile-btn w-full sm:flex-1 py-4 px-6 rounded-btn bg-accent text-accent-foreground font-extrabold text-sm sm:text-base shadow-limeGlow flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                <span>{t("dashboard.addMoneyAction")}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>

              {/* Secondary Ghost: I need to break it */}
              <button
                type="button"
                onClick={() => {
                  setBreakStep("reason");
                  setReasonText("");
                  setShowBreakSheet(true);
                }}
                className="w-full sm:flex-1 py-4 px-6 rounded-btn border border-line bg-surface hover:bg-raised text-muted hover:text-text font-bold text-sm sm:text-base transition-colors flex items-center justify-center gap-2"
              >
                <span>{t("dashboard.breakAction")}</span>
              </button>
            </div>
          </div>

          {/* ── RIGHT COLUMN (lg:col-span-5): WEEKLY PACING + LEDGER ── */}
          <div className="lg:col-span-5 space-y-6">
            {/* WEEKLY PACING: Clean 4-bar chart rendering at full height immediately */}
            <div className="bg-surface border border-line rounded-card p-6 shadow-card space-y-4">
              <div>
                <h3 className="font-extrabold text-base text-text">
                  {t("dashboard.pacingTitle")}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {t("dashboard.pacingSubtitle")}
                </p>
              </div>

              {/* 4 Clean Proportional Bars */}
              <div className="h-36 pt-4 flex items-end justify-between gap-3 px-2 border-b border-line pb-3">
                {pacingWeeks.map((w, idx) => {
                  const barHeightPercent = Math.max(
                    18,
                    Math.round((w.amount / maxPacingAmount) * 100)
                  );
                  const isCurrentWeek = idx === 0;

                  return (
                    <div key={w.week} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      {/* Amount above bar */}
                      <span className="text-xs font-mono font-bold text-muted tabular-nums">
                        {w.amount}
                      </span>

                      {/* Bar (Renders at full height immediately, NO delayed animation) */}
                      <div className="w-full max-w-[48px] bg-raised rounded-t-xl overflow-hidden flex flex-col justify-end h-24">
                        <div
                          style={{ height: `${barHeightPercent}%` }}
                          className={cn(
                            "w-full rounded-t-xl transition-none",
                            isCurrentWeek
                              ? "bg-accent shadow-limeGlow"
                              : "bg-violet/70"
                          )}
                        />
                      </div>

                      {/* Label below bar */}
                      <span className="text-xs text-muted font-medium">
                        {w.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACTIVITY LEDGER: Simple list, newest first, real timestamps, no clipped rows */}
            <div className="bg-surface border border-line rounded-card p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h3 className="font-extrabold text-base text-text">
                  {t("dashboard.recentActivity")}
                </h3>
                <span className="text-xs font-mono text-muted">
                  {sortedTransactions.length} {isArabic ? "حركات" : "entries"}
                </span>
              </div>

              {sortedTransactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted">
                  {t("dashboard.noActivity")}
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-3 pe-1 scrollbar-thin">
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
                        className="p-3 rounded-2xl bg-raised/70 border border-line flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-text">
                            {tx.note || tx.type.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted font-mono">
                            {formatDate(tx.createdAt, lang)}
                          </p>
                        </div>

                        <div className="text-end shrink-0">
                          <span
                            className={cn(
                              "font-mono font-extrabold text-xs sm:text-sm tabular-nums",
                              isCredit
                                ? "text-accent"
                                : isDebit
                                ? "text-coral"
                                : "text-muted"
                            )}
                          >
                            {isCredit ? "+" : isDebit ? "-" : ""}
                            {formatKWD(tx.amount)} {isArabic ? "د.ك" : "KWD"}
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

                {/* Plain 1-Sentence Discipline Fee Notice */}
                <div className="p-3.5 rounded-2xl bg-raised border border-line text-xs text-muted leading-relaxed">
                  {t("dashboard.breakSheetFeeNotice")}
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder={t("dashboard.reasonPlaceholder")}
                    className="w-full px-4 py-3 rounded-2xl bg-bg border border-line focus:border-accent text-sm text-text placeholder:text-muted/60 resize-none outline-hidden"
                  />
                  <div className="flex justify-between text-xs text-muted font-mono">
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
                    className="tactile-btn flex-1 py-3.5 px-5 rounded-btn bg-accent text-accent-foreground font-extrabold text-sm shadow-limeGlow"
                  >
                    {t("dashboard.keepLockedBtn")}
                  </button>

                  {/* Secondary: Send to Keyholder */}
                  <button
                    type="button"
                    disabled={reasonText.trim().length < 10 || loadingRoast}
                    onClick={handleFetchRoast}
                    className="flex-1 py-3.5 px-5 rounded-btn border border-line bg-surface hover:bg-raised text-text font-bold text-sm disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                  >
                    {loadingRoast ? (
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    ) : (
                      <span>
                        {isArabic
                          ? `أرسل لـ ${keyholderFirstName}`
                          : `Send to ${keyholderFirstName}`}
                      </span>
                    )}
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
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#201830] to-[#161226] border border-violet/40 shadow-violetSubtle relative">
                  <blockquote className="text-sm sm:text-base text-text font-semibold italic leading-relaxed">
                    &ldquo;{roastText}&rdquo;
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
                      ? `تم إنشاء رابط الفتح ذو الاستخدام الواحد. أرسل الرسالة لفهد عبر واتساب ليقرر.`
                      : `Your single-use clearance link is ready. Send it to ${keyholderFirstName} on WhatsApp for his decision.`}
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
                    className="w-full py-3 px-4 rounded-btn border border-line bg-surface hover:bg-raised text-xs text-muted hover:text-text font-mono flex items-center justify-center gap-2 transition-colors"
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
                      "py-2.5 rounded-btn font-mono font-bold text-xs border transition-colors",
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
                    step="0.05"
                    min="1"
                    placeholder="e.g. 25"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-btn bg-bg border border-line focus:border-accent text-sm text-text font-mono outline-hidden"
                  />
                  <span className="absolute end-4 top-3 text-xs text-muted font-bold">
                    {isArabic ? "د.ك" : "KWD"}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
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
          <div className="w-full max-w-md bg-surface border border-line rounded-[28px] p-6 sm:p-8 space-y-6 shadow-2xl relative">
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
