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
} from "lucide-react";
import { formatKWD } from "@/lib/utils";

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

  return (
    <div className="max-w-md mx-auto pt-2 pb-24 sm:pb-12 px-3 sm:px-0">
      {/* Protocol Badge Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono uppercase tracking-wider mb-2.5 shadow-xs">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>Tokenized Keyholder Protocol</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Keyholder Gatekeeper Decision
        </h1>
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
          Salam, <strong className="text-amber-800 font-semibold">{vault.keyholder.name}</strong> ({vault.keyholder.relationship}).
          Your friend chose you as the sole guardian of their savings discipline.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-card relative overflow-hidden">
        {/* Status Indicator Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            {vault.status === "UNLOCK_PENDING" ? (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
            ) : vault.status === "LOCKED" ? (
              <span className="h-3 w-3 rounded-full bg-emerald-600" />
            ) : (
              <span className="h-3 w-3 rounded-full bg-amber-500" />
            )}
            <span className="text-xs font-bold font-mono tracking-wide text-slate-800">
              {vault.status === "UNLOCK_PENDING"
                ? "BREAK REQUEST ACTIVE"
                : vault.status === "LOCKED"
                ? "VAULT LOCKED & SAFE"
                : "VAULT UNLOCKED"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 font-semibold">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Single-Use Active</span>
          </div>
        </div>

        {/* Goal & Balance Card */}
        <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-500 font-medium">Target Savings Goal</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{vault.title}</div>
            <div className="text-xs text-emerald-700 font-mono flex items-center gap-1 mt-1 font-medium">
              <Coins className="w-3.5 h-3.5" />
              <span>
                {formatKWD(vault.currentBalance)} / {formatKWD(vault.targetAmount)} KWD ({percentFunded}%)
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-slate-500 font-medium">Funds At Stake</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {formatKWD(vault.currentBalance)} KWD
            </div>
          </div>
        </div>

        {/* User's EXACT Written Reason */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Applicant&apos;s Stated Excuse:</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-amber-200/80 text-xs italic text-slate-800 leading-relaxed font-sans shadow-xs">
            &ldquo;{writtenReason}&rdquo;
          </div>
        </div>


        {/* Action Message Feedback */}
        {actionMessage && (
          <div
            className={`mb-5 p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
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
          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleDecision("DENY")}
              disabled={processingAction !== null}
              className="tactile-btn w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {processingAction === "DENY" ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-white" />
                  <span>Deny & Protect Vault 🛡️</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-500">
              Blocks early withdrawal, increments protected savings, and permanently burns this link.
            </p>

            <button
              onClick={() => handleDecision("APPROVE")}
              disabled={processingAction !== null}
              className="tactile-btn w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-slate-200 hover:border-rose-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 mb-2"
            >
              {processingAction === "APPROVE" ? (
                <div className="w-4 h-4 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" />
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Approve Early Release (Give In)</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-xs text-slate-700 font-medium">
              Decision executed. This single-use security token has been burned.
            </div>
          </div>
        )}
      </div>

      <div className="text-center mt-6">
        <p className="text-[11px] text-slate-500 font-mono">
          Tijori Security Clearance Protocol &bull; Single-Use Token Invalidation Enabled
        </p>
      </div>
    </div>
  );
}
