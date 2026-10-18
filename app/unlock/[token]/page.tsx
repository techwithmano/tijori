"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Coins,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatKWD } from "@/lib/utils";
import GoalTitle from "@/components/GoalTitle";

interface VaultData {
  _id: string;
  title: string;
  targetAmount: number;
  currentBalance: number;
  pullAmount: number;
  cadence: string;
  status: "LOCKED" | "UNLOCK_PENDING" | "UNLOCKED";
  keyholder: {
    name: string;
    phone: string;
    relationship: string;
  };
  unlockReason?: string;
  breakExcuse?: string;
  realityCheck?: string;
  unlockToken?: string | null;
  totalProtected?: number;
  targetDate: string;
}

export default function KeyholderTokenUnlockPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const unwrappedParams = use(params);
  const token = unwrappedParams.token;

  const [vault, setVault] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<"APPROVE" | "DENY" | null>(null);
  const [actionDone, setActionDone] = useState<"APPROVE" | "DENY" | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchVaultByToken = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/unlock/${token}`);
      const data = await res.json();
      if (data.success && data.vault) {
        setVault(data.vault);
      } else {
        setError(data.error || "This single-use link has already been used or is expired.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load Keyholder Protocol link.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaultByToken();
  }, [token]);

  const handleDecision = async (action: "APPROVE" | "DENY") => {
    try {
      setProcessingAction(action);
      setActionMessage(null);

      const res = await fetch(`/api/unlock/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (data.success && data.vault) {
        setVault(data.vault);
        setActionDone(action);

        if (action === "DENY") {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#10B981", "#F59E0B", "#34D399", "#FFFFFF"],
          });
          setActionMessage(
            `Hero move! You blocked the impulse break and preserved ${formatKWD(
              data.vault.currentBalance
            )} KWD in savings.`
          );
        } else {
          setActionMessage("Emergency withdrawal approved. The single-use link has been burned.");
        }
      } else {
        setError(data.error || "Failed to execute decision. Link may have already been used.");
      }
    } catch (err: any) {
      setError(err.message || "Network error occurred.");
    } finally {
      setProcessingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
        <p className="mt-4 text-xs font-mono text-slate-500">
          Verifying Single-Use Keyholder Security Token...
        </p>
      </div>
    );
  }

  // Token already used, expired or invalid
  if (error || !vault) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl border border-rose-200 text-center shadow-card">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7 text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Single-Use Link Inactive</h2>
        <p className="text-xs text-slate-600 leading-relaxed mb-6">
          {error || "This authorization link has already been used to make a decision or has expired."}
        </p>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-mono mb-6 leading-relaxed">
          Security Protocol: Tokenized single-use links are permanently invalidated after decision execution to prevent unauthorized or repeated withdrawals.
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-xl text-slate-800 border border-slate-200 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Tijori Dashboard</span>
        </Link>
      </div>
    );
  }

  const percentFunded = Math.min(
    100,
    Math.round(((vault.currentBalance || 0) / (vault.targetAmount || 1)) * 100)
  );

  const writtenReason =
    vault.unlockReason || vault.breakExcuse || "No excuse provided. Just feeling the urge to spend.";

  const guardianFirstName = vault.keyholder?.name ? vault.keyholder.name.split(" ")[0] : "Fahad";
  const applicantFirstName = "Abdulrahman";

  return (
    <div className="max-w-md mx-auto pt-2 pb-8 px-3.5">
      {/* Human Headline Header */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold mb-1.5 shadow-2xs">
          <ShieldAlert className="w-3 h-3 text-amber-600" />
          <span>Anti-Impulse Safeguard</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
          {guardianFirstName}, {applicantFirstName} wants to break his vault.
        </h1>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Salam, <strong className="text-slate-900 font-semibold">{vault.keyholder.name}</strong> ({vault.keyholder.relationship}).
          Your friend chose you as the sole guardian of his savings discipline.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-card relative overflow-hidden">
        {/* Status Indicator Bar */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            {vault.status === "UNLOCK_PENDING" ? (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </span>
            ) : vault.status === "LOCKED" ? (
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            )}
            <span className="text-[11px] font-bold text-slate-800">
              {vault.status === "UNLOCK_PENDING"
                ? "Break Request Active"
                : vault.status === "LOCKED"
                ? "Vault Locked & Safe"
                : "Vault Unlocked"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Single-Use Active</span>
          </div>
        </div>

        {/* Goal & Balance Card */}
        <div className="my-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Target Savings Goal</div>
            <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
              <GoalTitle title={vault.title} />
            </div>
            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
              <Coins className="w-3 h-3" />
              <span>
                {formatKWD(vault.currentBalance)} / {formatKWD(vault.targetAmount)} KWD ({percentFunded}%)
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-500 font-medium">Funds At Stake</div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {formatKWD(vault.currentBalance)} KWD
            </div>
          </div>
        </div>

        {/* User's EXACT Written Reason */}
        <div className="mb-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-1">
            <HelpCircle className="w-3 h-3 text-amber-600" />
            <span>{applicantFirstName}&apos;s Stated Excuse:</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-amber-200/80 text-xs italic text-slate-800 leading-relaxed shadow-2xs">
            &ldquo;{writtenReason}&rdquo;
          </div>
        </div>

        {/* AI Reality Check Roast Card */}
        {vault.realityCheck && (
          <div className="mb-3 p-3 rounded-2xl bg-rose-50/90 border border-rose-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-800 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              <span>Tijori AI Reality Check 🔥</span>
            </div>
            <p className="text-xs text-rose-950 font-medium leading-relaxed">
              {vault.realityCheck}
            </p>
          </div>
        )}

        {/* Action Message Feedback */}
        {actionMessage && (
          <div
            className={`mb-3 p-3 rounded-2xl border text-xs flex items-center gap-2 ${
              actionDone === "DENY"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Decision Action Buttons */}
        {!actionDone ? (
          <div className="space-y-2 pt-1">
            <button
              onClick={() => handleDecision("DENY")}
              disabled={processingAction !== null}
              className="tactile-btn w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {processingAction === "DENY" ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>Deny & Protect Vault 🛡️</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-500">
              Blocks early withdrawal, increments protected savings, and permanently burns this link.
            </p>

            <button
              onClick={() => handleDecision("APPROVE")}
              disabled={processingAction !== null}
              className="tactile-btn w-full py-2.5 px-4 rounded-xl bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-slate-300 hover:border-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 mt-1"
            >
              {processingAction === "APPROVE" ? (
                <div className="w-3.5 h-3.5 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" />
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Approve Early Release</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-xs text-slate-700 font-medium">
              Decision executed. This single-use security link has been permanently burned.
            </div>
          </div>
        )}
      </div>

      <div className="text-center mt-3">
        <p className="text-[11px] text-slate-400">
          Protected by Tijori Keyholder Verification &bull; Single-Use Link
        </p>
      </div>
    </div>
  );
}
