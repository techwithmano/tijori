"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Zap,
  CreditCard,
  ExternalLink,
  Flame,
  Clock,
  Coins,
  TrendingUp,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Share2,
  LogOut,
  Globe,
  Sparkles,
  PlusCircle,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Award,
} from "lucide-react";
import { formatKWD, cn } from "@/lib/utils";

interface ITransaction {
  _id?: string;
  amount: number;
  type: "SCHEDULED_PULL" | "SIMULATED_PULL" | "STRIPE_DEPOSIT" | "WITHDRAWAL";
  status: "SUCCESS" | "FAILED";
  note?: string;
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
  cadence: "daily" | "weekly" | "biweekly" | "monthly";
  pullAmount: number;
  allowanceDay: number;
  targetDate: string;
  status: "LOCKED" | "UNLOCK_PENDING" | "UNLOCKED";
  keyholder: IKeyholder;
  unlockToken?: string | null;
  unlockReason?: string | null;
  realityCheck?: string | null;
  transactions: ITransaction[];
}

interface IUser {
  name: string;
  email: string;
  phone?: string;
  allowanceDay: number;
  preferredLang: "en" | "ar";
}

// Bilingual Dictionary for GCC Young Adults
const DICTIONARY = {
  en: {
    brandWordmark: "Tijori",
    arabicBadge: "تِجوري",
    liveDot: "Live Protocol",
    protectedStatPrefix: "You've protected",
    protectedStatSuffix: "from impulse spending",
    salam: "Salam",
    logout: "Exit",
    newVault: "New Vault",
    simulateTuck: "⚡ Simulate Day-25 Tuck (+25 KWD)",
    quickBoost: "💳 Quick KNET / Card Boost (+20 KWD)",
    openKeyholderLink: "🔗 Open Keyholder Link ↗",
    unbrokenStreak: "Day Unbroken Streak",
    daysRemaining: "days remaining",
    targetLocked: "Time-Locked Goal",
    funded: "funded",
    currentBalance: "Current Balance",
    targetGoal: "Target Goal",
    leftToSave: "Left to Save",
    cadenceTuck: "Cadence Tuck",
    pacingTitle: "Allowance Pacing Curve (4-Week Cycle)",
    pacingSubtitle: "Calibrated to Day-25 student allowance / salary refill",
    week: "Week",
    postAllowance: "Post-Allowance Surge",
    steadyDiscipline: "Steady Discipline",
    midMonthLean: "Mid-Month Lean",
    preAllowanceCushion: "Pre-Allowance Cushion",
    disciplineTaxWarning: "5% Discipline Tax Applied on Early Break",
    disciplineTaxSub:
      "Forfeit 5% unless your designated Keyholder verifies your genuine financial emergency.",
    requestEarlyBreak: "🚨 Request Early Break",
    keyholderProtocol: "Keyholder Protocol",
    designatedGuardian: "Designated Vault Guardian",
    armedAndGuarding: "Armed & Guarding 🛡️",
    breakRequested: "Break Requested ⚠️",
    pingWhatsApp: "Ping on WhatsApp 💬",
    auditLedger: "Live Anti-Impulse Audit Ledger",
    noTransactions: "No ledger transactions recorded yet.",
    breakModalTitle: "Emergency Break Request",
    breakModalSubtitle:
      "Tijori introduces behavioral friction. You must state your excuse and face AI reality check before your Keyholder receives this link.",
    excuseLabel: "What is your emergency excuse for breaking early?",
    excusePlaceholder: "e.g. Flash sneaker drop, urgent chalet split, forgot dinner bill...",
    cancelKeepLocked: "Keep Vault Locked 🛡️",
    submitBreakRequest: "Generate Keyholder Clearance Link 🚨",
    realityCheckTitle: "Tijori AI Reality Check 🔥",
    keyholderTokenGenerated: "Single-Use Keyholder Clearance Active!",
    sendToKeyholderNotice: "Send this single-use authorization link to your Keyholder:",
    shareWhatsApp: "Share to Keyholder on WhatsApp 💬",
    openDirectly: "Open Clearance Link Directly ↗",
    done: "Close",
    loadingVault: "Synchronizing Tijori Vault Engine...",
    noVaultFound: "No active savings vault found. Launching a new vault...",
  },
  ar: {
    brandWordmark: "تِجوري",
    arabicBadge: "Tijori",
    liveDot: "بروتوكول نشط",
    protectedStatPrefix: "حَميت",
    protectedStatSuffix: "من الصرف الاندفاعي",
    salam: "مرحباً",
    logout: "تسجيل خروج",
    newVault: "خزينة جديدة",
    simulateTuck: "⚡ محاكاة اقتطاع يوم 25 (+25 د.ك)",
    quickBoost: "💳 شحن فوري عبر كي نت / بطاقة (+20 د.ك)",
    openKeyholderLink: "🔗 فتح رابط الحارس ↗",
    unbrokenStreak: "يوم التزام متواصل",
    daysRemaining: "يوم متبقي",
    targetLocked: "هدف مقفل زمنياً",
    funded: "مكتمل",
    currentBalance: "الرصيد الحالي",
    targetGoal: "المبلغ المستهدف",
    leftToSave: "المتبقي للهدف",
    cadenceTuck: "اقتطاع الدورة",
    pacingTitle: "منحنى وتيرة المكافأة (دورة 4 أسابيع)",
    pacingSubtitle: "مضبوط على موعد نزول إعانة الطلاب والرواتب في يوم 25",
    week: "الأسبوع",
    postAllowance: "طفرة بعد الإعانة",
    steadyDiscipline: "التزام مستمر",
    midMonthLean: "توفير منتصف الشهر",
    preAllowanceCushion: "تأمين ما قبل الراتب",
    disciplineTaxWarning: "ضريبة انضباط 5% تُطبق عند الكسر المبكر",
    disciplineTaxSub:
      "تخسر 5% من رصيدك إلا إذا وافق حارس الخزينة واعتمد سببك كحالة طارئة فعلية.",
    requestEarlyBreak: "🚨 طلب كسر الخزينة مبكراً",
    keyholderProtocol: "بروتوكول حارس الخزينة",
    designatedGuardian: "حارس الخزينة المعتمد",
    armedAndGuarding: "يقظ ويحمي الخزينة 🛡️",
    breakRequested: "طلب كسر معلّق ⚠️",
    pingWhatsApp: "تنبيه عبر واتساب 💬",
    auditLedger: "سجل التدقيق الحي ضد الاندفاع",
    noTransactions: "لا توجد معاملات مسجلة حتى الآن.",
    breakModalTitle: "طلب كسر الخزينة في حالة الطوارئ",
    breakModalSubtitle:
      "تِجوري يضع حاجزاً نفسياً أمام الاندفاع. يجب كتابة العذر ومواجهة تنبيه الذكاء الاصطناعي قبل إرسال الرابط لحارسك.",
    excuseLabel: "ما هو عذرك الطارئ لكسر الخزينة مبكراً؟",
    excusePlaceholder: "مثلاً: سنيكرز لقطة نزل فجأة، قطية شاليه طارئة، نسيت حساب المطعم...",
    cancelKeepLocked: "إبقاء الخزينة مقفلة 🛡️",
    submitBreakRequest: "إنشاء رابط إذن الحارس 🚨",
    realityCheckTitle: "تنبيه تِجوري الذكي ضد الصرف 🔥",
    keyholderTokenGenerated: "تم تفعيل رابط الحارس أحادي الاستخدام!",
    sendToKeyholderNotice: "أرسل رابط المصادقة أحادي الاستخدام لحارس الخزينة:",
    shareWhatsApp: "إرسال إلى الحارس عبر واتساب 💬",
    openDirectly: "فتح رابط الإذن مباشرة ↗",
    done: "إغلاق",
    loadingVault: "جاري مزامنة محرك خزينة تِجوري...",
    noVaultFound: "لم يتم العثور على خزينة نشطة. جاري إنشاء خزينة...",
  },
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [vault, setVault] = useState<IVault | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "ar">("en");

  // Interaction States
  const [pulling, setPulling] = useState(false);
  const [boosting, setBoosting] = useState(false);

  // Break Modal States
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [excuseText, setExcuseText] = useState("");
  const [submittingBreak, setSubmittingBreak] = useState(false);
  const [breakResult, setBreakResult] = useState<{
    realityCheck: string;
    token: string;
    whatsappUrl: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const t = DICTIONARY[lang];

  // Fetch live Vault & User data from MongoDB
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/vault");
      const data = await res.json();

      if (data.success && data.vault) {
        setVault(data.vault);
        if (data.user) {
          setUser(data.user);
          if (data.user.preferredLang) {
            setLang(data.user.preferredLang);
          }
        }
      } else {
        // Fallback: seed demo vault if empty
        const seedRes = await fetch("/api/seed", { method: "POST" });
        const seedData = await seedRes.json();
        if (seedData.success && seedData.vault) {
          setVault(seedData.vault);
          if (seedData.user) setUser(seedData.user);
        } else {
          setError(data.error || "Unable to fetch vault data");
        }
      }
    } catch (err: any) {
      setError(err.message || "Network error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle Stripe deposit return query parameters
  useEffect(() => {
    const depositStatus = searchParams.get("deposit");
    const amountParam = searchParams.get("amount");

    if (depositStatus === "success" && vault) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.4 },
        colors: ["#10B981", "#F59E0B", "#3B82F6", "#FFFFFF"],
      });

      // Post update to ledger if not already recorded
      const depositAmount = Number(amountParam) || 20;
      fetch(`/api/vault/${vault._id}/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: depositAmount }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.vault) {
            setVault(data.vault);
          }
        })
        .catch((e) => console.warn("Failed to record Stripe deposit:", e));

      // Clean URL params to prevent double triggers
      router.replace("/dashboard");
    }
  }, [searchParams, vault?._id]);

  // Simulate Day-25 Tuck
  const handleSimulateTuck = async () => {
    if (!vault) return;
    try {
      setPulling(true);
      const res = await fetch(`/api/vault/${vault._id}/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulate: true }),
      });
      const data = await res.json();
      if (data.success && data.vault) {
        setVault(data.vault);
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.35 },
          colors: ["#D97706", "#F59E0B", "#10B981", "#34D399"],
        });
      }
    } catch (err: any) {
      console.error("Tuck error:", err);
    } finally {
      setPulling(false);
    }
  };

  // Quick KNET / Card Boost via Stripe Checkout
  const handleStripeBoost = async () => {
    if (!vault) return;
    try {
      setBoosting(true);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaultId: vault._id, amount: 20 }),
      });
      const data = await res.json();
      if (data.success && (data.checkoutUrl || data.url)) {
        window.location.href = data.checkoutUrl || data.url;
      } else {
        alert(data.error || "Failed to initialize Stripe checkout session");
      }
    } catch (err: any) {
      alert(err.message || "Failed to launch payment checkout");
    } finally {
      setBoosting(false);
    }
  };

  // Emergency Break Request
  const handleSubmitBreakRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vault || !excuseText.trim()) return;

    try {
      setSubmittingBreak(true);
      const res = await fetch(`/api/vault/${vault._id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excuse: excuseText }),
      });
      const data = await res.json();
      if (data.success && data.vault) {
        setVault(data.vault);
        setBreakResult({
          realityCheck:
            data.realityCheck ||
            `Breaking your ${vault.title} for "${excuseText}" is an impulse slip. Let's see if ${vault.keyholder.name} agrees.`,
          token: data.token || data.vault.unlockToken || "",
          whatsappUrl: data.whatsappUrl || "",
        });
      } else {
        alert(data.error || "Failed to submit early break request");
      }
    } catch (err: any) {
      alert(err.message || "Network error submitting break request");
    } finally {
      setSubmittingBreak(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      router.push("/login");
    }
  };

  // Math & Gauges
  const percentFunded = useMemo(() => {
    if (!vault || !vault.targetAmount) return 0;
    return Math.min(100, Math.round(((vault.currentBalance || 0) / vault.targetAmount) * 100));
  }, [vault?.currentBalance, vault?.targetAmount]);

  const leftToSave = useMemo(() => {
    if (!vault) return 0;
    return Math.max(0, vault.targetAmount - (vault.currentBalance || 0));
  }, [vault?.targetAmount, vault?.currentBalance]);

  const daysRemaining = useMemo(() => {
    if (!vault?.targetDate) return 90;
    const diff = new Date(vault.targetDate).getTime() - Date.now();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [vault?.targetDate]);

  // Dynamic 4-Week Pacing Curve
  const pacingWeeks = useMemo(() => {
    const base = vault?.pullAmount || 25;
    return [
      {
        week: 1,
        title: t.postAllowance,
        amount: Math.round(base * 1.6),
        percent: 100,
        color: "from-amber-500 to-amber-600",
        timing: `Day ${vault?.allowanceDay || 25} Deposit`,
      },
      {
        week: 2,
        title: t.steadyDiscipline,
        amount: base,
        percent: 65,
        color: "from-emerald-500 to-emerald-600",
        timing: "Mid-Cadence",
      },
      {
        week: 3,
        title: t.midMonthLean,
        amount: Math.max(5, Math.round(base * 0.7)),
        percent: 45,
        color: "from-slate-400 to-slate-500",
        timing: "Social Outing Week",
      },
      {
        week: 4,
        title: t.preAllowanceCushion,
        amount: Math.max(5, Math.round(base * 0.5)),
        percent: 32,
        color: "from-rose-400 to-rose-500",
        timing: "Pre-Refill Buffer",
      },
    ];
  }, [vault?.pullAmount, vault?.allowanceDay, t]);

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-3 border-amber-500/30 border-t-amber-500 animate-spin" />
        <p className="mt-4 text-xs font-mono font-medium text-slate-500 tracking-wide">
          {t.loadingVault}
        </p>
      </div>
    );
  }

  // Error / No Vault State
  if (error || !vault) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-card text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Vault Not Loaded</h2>
        <p className="text-xs text-slate-600 mb-6">{error || t.noVaultFound}</p>
        <button
          onClick={fetchDashboardData}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reload Dashboard</span>
        </button>
      </div>
    );
  }

  const radius = 105;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentFunded / 100) * circumference;

  const keyholderPendingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/unlock/${vault.unlockToken || vault._id}`
      : `/unlock/${vault.unlockToken || vault._id}`;

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-20 selection:bg-amber-100 selection:text-amber-900"
    >
      {/* 1. TOP NAVIGATION BAR */}
      <header className="border-b border-slate-200/90 bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Wordmark + Arabic Badge + Live Status Dot */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Lock className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  {t.brandWordmark}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold font-mono">
                  {t.arabicBadge}
                </span>
              </div>
            </Link>

            {/* Live Status Dot */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span>{t.liveDot}</span>
            </div>
          </div>

          {/* Centered Shield Hero Stat: 🛡️ You've protected [totalProtected] KWD from impulse spending */}
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-900 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">
              {t.protectedStatPrefix}{" "}
              <strong className="font-extrabold font-mono text-emerald-950 text-sm">
                {formatKWD(vault.totalProtected || 0)} KWD
              </strong>{" "}
              {t.protectedStatSuffix}
            </span>
          </div>

          {/* Controls: Language Switcher + User Profile + Logout */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Language Switcher [ EN | العربية ] */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setLang("en")}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all",
                  lang === "en"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLang("ar")}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all",
                  lang === "ar"
                    ? "bg-white text-slate-900 shadow-xs font-bold font-sans"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                العربية
              </button>
            </div>

            {/* User Greeting & Log Out */}
            <div className="flex items-center gap-2 pl-1">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900">
                  {t.salam}, {user?.name ? user.name.split(" ")[0] : "Abdulrahman"}
                </span>
                <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  Day-{vault.allowanceDay || 25} Cycle
                </span>
              </div>

              <Link
                href="/create"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.newVault}</span>
              </Link>

              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 rounded-xl text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-all text-xs flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xs:inline text-[11px] font-medium">{t.logout}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Mobile Shield Stat Banner */}
        <div className="md:hidden flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {t.protectedStatPrefix}{" "}
              <strong className="font-extrabold font-mono">
                {formatKWD(vault.totalProtected || 0)} KWD
              </strong>
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
            Active Guard
          </span>
        </div>

        {/* 2. JUDGE STAGE DEMO BAR */}
        <section className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                    Judges Interactive Stage Controls
                  </h3>
                  <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                    Live Mongo Persistence
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test micro-pull cadence, card payments, and live WhatsApp peer authorization.
                </p>
              </div>
            </div>

            {/* Demo Trigger Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Button: Simulate Day-25 Tuck */}
              <button
                id="simulate-tuck-btn"
                onClick={handleSimulateTuck}
                disabled={pulling}
                className="tactile-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {pulling ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                )}
                <span>{t.simulateTuck}</span>
              </button>

              {/* Button: Quick KNET / Card Boost */}
              <button
                id="stripe-boost-btn"
                onClick={handleStripeBoost}
                disabled={boosting}
                className="tactile-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-50"
              >
                {boosting ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-600/30 border-t-slate-800 rounded-full animate-spin" />
                ) : (
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>{t.quickBoost}</span>
              </button>

              {/* Link: Open Keyholder Link (Active when UNLOCK_PENDING) */}
              {vault.status === "UNLOCK_PENDING" ? (
                <Link
                  id="open-keyholder-link"
                  href={`/unlock/${vault.unlockToken || vault._id}`}
                  target="_blank"
                  className="tactile-btn inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs shadow-xs transition-all animate-pulse"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
                  <span>{t.openKeyholderLink}</span>
                </Link>
              ) : (
                <span className="text-[11px] font-mono text-slate-400 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60 hidden sm:inline-block">
                  Keyholder link armed
                </span>
              )}
            </div>
          </div>
        </section>

        {/* 3. MAIN 2-COLUMN GRID (65% Left Vault Core / 35% Right Live Audit Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: 65% VAULT CORE (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header: Goal title, Time-lock countdown pill, and Gamified Streak Badge */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/90">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {t.targetLocked}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      &bull; {vault.cadence.toUpperCase()} PULLS
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {vault.title}
                  </h1>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Gamified Streak Badge: 🔥 [streakCount]-Day Unbroken Streak */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-200/80 text-amber-950 font-bold text-xs shadow-xs">
                    <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                    <span>
                      {vault.streakCount || 18} {t.unbrokenStreak}
                    </span>
                  </div>

                  {/* Time-lock countdown pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {daysRemaining} {t.daysRemaining}
                    </span>
                  </div>
                </div>
              </div>

              {/* PHYSICAL VAULT DIAL COMPONENT */}
              <div className="py-3 sm:py-4 flex flex-col items-center justify-center relative">
                <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 240 240">
                    <defs>
                      <linearGradient id="honeyToEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#D97706" />
                        <stop offset="50%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>

                    {/* Track ring */}
                    <circle
                      cx="120"
                      cy="120"
                      r={radius}
                      stroke="#E2E8F0"
                      strokeWidth="14"
                      fill="transparent"
                      strokeLinecap="round"
                    />

                    {/* Dynamic Gauge Stroke */}
                    <circle
                      cx="120"
                      cy="120"
                      r={radius}
                      stroke="url(#honeyToEmerald)"
                      strokeWidth="14"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  {/* Center Dial Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    {/* Animated Padlock Glyph */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center mb-1 shadow-xs transition-transform duration-300",
                        vault.status === "UNLOCK_PENDING"
                          ? "bg-rose-50 border border-rose-200 text-rose-600 animate-bounce"
                          : vault.status === "UNLOCKED"
                          ? "bg-amber-50 border border-amber-200 text-amber-600"
                          : "bg-emerald-50 border border-emerald-200 text-emerald-600"
                      )}
                    >
                      {vault.status === "UNLOCKED" ? (
                        <Unlock className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <Lock className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>

                    {/* Tabular Monetary Display */}
                    <div className="font-extrabold text-2xl sm:text-3xl font-mono text-slate-900 tracking-tight tabular-nums">
                      {formatKWD(vault.currentBalance)}
                      <span className="text-xs sm:text-sm font-semibold text-slate-500 font-sans ml-1">
                        / {formatKWD(vault.targetAmount)} KWD
                      </span>
                    </div>

                    {/* Percentage Funded */}
                    <div className="mt-1 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {percentFunded}% {t.funded}
                    </div>
                  </div>
                </div>

                {/* Sub-Metrics Cards below Dial */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-lg mt-4">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-center">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-medium block">
                      {t.currentBalance}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 font-mono mt-0.5 block tabular-nums">
                      {formatKWD(vault.currentBalance)} KWD
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-center">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-medium block">
                      {t.leftToSave}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-amber-700 font-mono mt-0.5 block tabular-nums">
                      {formatKWD(leftToSave)} KWD
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-center">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-medium block">
                      {t.cadenceTuck}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono mt-0.5 block tabular-nums">
                      +{formatKWD(vault.pullAmount)} KWD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ALLOWANCE PACING 4-WEEK BAR CHART */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <span>{t.pacingTitle}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t.pacingSubtitle}</p>
                </div>
                <div className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start font-semibold">
                  Day-{vault.allowanceDay || 25} Aligned ⚡
                </div>
              </div>

              {/* 4-Week Dynamic SVG/Visual Bars */}
              <div className="grid grid-cols-4 gap-3 sm:gap-4 items-end pt-2 pb-1">
                {pacingWeeks.map((item) => (
                  <div key={item.week} className="flex flex-col items-center group">
                    <span className="text-xs font-mono font-bold text-slate-900 mb-1.5 tabular-nums">
                      +{item.amount} KWD
                    </span>
                    <div className="w-full bg-slate-100 rounded-2xl h-28 flex items-end p-1.5 border border-slate-200/80">
                      <div
                        style={{ height: `${item.percent}%` }}
                        className={cn(
                          "w-full rounded-xl bg-gradient-to-t shadow-xs transition-all duration-700 ease-out group-hover:opacity-90",
                          item.color
                        )}
                      />
                    </div>
                    <div className="text-center mt-2.5">
                      <span className="text-[11px] font-extrabold text-slate-900 block">
                        {t.week} {item.week}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[80px] sm:max-w-none">
                        {item.title}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                        {item.timing}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FRICTION TRIGGER: 5% Discipline Tax Warning + Button */}
            <div className="p-4 sm:p-5 rounded-3xl bg-rose-50/70 border border-rose-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                    {t.disciplineTaxWarning}
                  </h4>
                  <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                    {t.disciplineTaxSub}
                  </p>
                </div>
              </div>

              <button
                id="request-break-btn"
                onClick={() => {
                  setShowBreakModal(true);
                  setBreakResult(null);
                  setExcuseText("");
                }}
                className="tactile-btn px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all shrink-0"
              >
                {t.requestEarlyBreak}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: 35% LIVE AUDIT SIDEBAR (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* KEYHOLDER PROTOCOL CARD */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/90 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                    {t.keyholderProtocol}
                  </h3>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded-full font-bold",
                    vault.status === "UNLOCK_PENDING"
                      ? "bg-rose-100 text-rose-800 border border-rose-200 animate-pulse"
                      : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  )}
                >
                  {vault.status === "UNLOCK_PENDING" ? t.breakRequested : t.armedAndGuarding}
                </span>
              </div>

              <div className="space-y-3.5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-medium block">
                    {t.designatedGuardian}
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {vault.keyholder.name}
                  </div>
                  <div className="text-xs text-slate-600 font-mono mt-0.5">
                    {vault.keyholder.phone} &bull; {vault.keyholder.relationship}
                  </div>
                </div>

                {/* Direct WhatsApp Ping Button */}
                <a
                  href={`https://wa.me/${vault.keyholder.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    `Salam ${vault.keyholder.name}! Checking in on my Tijori savings vault for "${vault.title}". Keep guarding my funds!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tactile-btn w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-slate-950" />
                  <span>{t.pingWhatsApp}</span>
                </a>
              </div>
            </div>

            {/* AUDIT & ANTI-IMPULSE LEDGER */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/90 mb-4">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                    {t.auditLedger}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {vault.transactions?.length || 0} Events
                </span>
              </div>

              {/* Transactions List */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {vault.transactions && vault.transactions.length > 0 ? (
                  vault.transactions.map((tx, idx) => {
                    const isPositive =
                      tx.type === "SCHEDULED_PULL" ||
                      tx.type === "SIMULATED_PULL" ||
                      tx.type === "STRIPE_DEPOSIT";
                    const formattedDate = new Date(tx.createdAt).toLocaleDateString(
                      lang === "ar" ? "ar-KW" : "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );

                    return (
                      <div
                        key={tx._id || idx}
                        className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">
                            {tx.note ||
                              (tx.type === "SIMULATED_PULL"
                                ? "Allowance Tuck"
                                : tx.type === "STRIPE_DEPOSIT"
                                ? "Card Deposit"
                                : tx.type === "WITHDRAWAL"
                                ? "Early Break Withdrawal"
                                : "Disciplined Micro-Pull")}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {formattedDate} &bull; {tx.type}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={cn(
                              "font-mono font-extrabold text-xs block tabular-nums",
                              isPositive ? "text-emerald-700" : "text-rose-700"
                            )}
                          >
                            {isPositive ? "+" : "-"}
                            {formatKWD(tx.amount)} KWD
                          </span>
                          <span
                            className={cn(
                              "text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase",
                              tx.status === "SUCCESS"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            )}
                          >
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400">
                    {t.noTransactions}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. EMERGENCY BREAK FRICTION MODAL */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {t.breakModalTitle}
                </h3>
                <p className="text-xs text-rose-600 font-medium font-mono">
                  Keyholder Clearance Required
                </p>
              </div>
            </div>

            {!breakResult ? (
              <form onSubmit={handleSubmitBreakRequest} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t.breakModalSubtitle}
                </p>

                {/* 5% Tax Warning */}
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold mb-0.5">5% Discipline Tax:</strong>
                    <span className="text-rose-800 leading-snug block">
                      {formatKWD(Math.round(vault.currentBalance * 0.05))} KWD will be forfeited
                      unless your Keyholder approves this request.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {t.excuseLabel}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={excuseText}
                    onChange={(e) => setExcuseText(e.target.value)}
                    placeholder={t.excusePlaceholder}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBreakModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    {t.cancelKeepLocked}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBreak}
                    className="tactile-btn flex-1 py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submittingBreak ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>{t.submitBreakRequest}</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Gemini AI Reality Check Callout */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 mb-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>{t.realityCheckTitle}</span>
                  </div>
                  <p className="text-xs text-amber-950 italic leading-relaxed font-sans">
                    &ldquo;{breakResult.realityCheck}&rdquo;
                  </p>
                </div>

                {/* Token Generated Notice */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-600 font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>{t.keyholderTokenGenerated}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {t.sendToKeyholderNotice} <strong>{vault.keyholder.name}</strong>
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-[11px] text-amber-800 break-all select-all shadow-xs flex-1">
                      {keyholderPendingUrl}
                    </div>
                    <button
                      onClick={() => copyToClipboard(keyholderPendingUrl)}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors shrink-0"
                      title="Copy link"
                    >
                      {copiedLink ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {copiedLink && (
                    <span className="text-[10px] text-emerald-600 font-mono block">
                      ✓ Copied to clipboard
                    </span>
                  )}
                </div>

                {/* Green WhatsApp Share Button */}
                <a
                  href={
                    breakResult.whatsappUrl ||
                    `https://wa.me/?text=${encodeURIComponent(
                      `Salam! I am trying to break my Tijori savings vault for "${vault.title}". My reason: "${excuseText}". Approve or block me here: ${keyholderPendingUrl}`
                    )}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tactile-btn w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/15 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4 text-slate-950" />
                  <span>{t.shareWhatsApp}</span>
                </a>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/unlock/${breakResult.token || vault.unlockToken || vault._id}`}
                    target="_blank"
                    className="tactile-btn flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs text-center border border-slate-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>{t.openDirectly}</span>
                  </Link>
                  <button
                    onClick={() => setShowBreakModal(false)}
                    className="py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                  >
                    {t.done}
                  </button>
                </div>
              </div>
            )}
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
        <div className="min-h-[75vh] flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full border-3 border-amber-500/30 border-t-amber-500 animate-spin" />
          <p className="mt-4 text-xs font-mono font-medium text-slate-500 tracking-wide">
            Loading Tijori Command Center...
          </p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
