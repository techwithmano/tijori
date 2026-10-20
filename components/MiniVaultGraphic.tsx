"use client";

import React, { useEffect, useState } from "react";
import { Lock, KeyRound, Check } from "lucide-react";

interface MiniVaultGraphicProps {
  step: 1 | 2 | 3;
  isArabic: boolean;
}

export default function MiniVaultGraphic({ step, isArabic }: MiniVaultGraphicProps) {
  // Step 2 animated counter state: 0 -> 25 -> 50 -> 75
  const [counterVal, setCounterVal] = useState(0);

  useEffect(() => {
    if (step === 2) {
      setCounterVal(0);
      const timer1 = setTimeout(() => setCounterVal(25), 250);
      const timer2 = setTimeout(() => setCounterVal(50), 650);
      const timer3 = setTimeout(() => setCounterVal(75), 1050);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [step]);

  return (
    <div className="w-full max-w-[380px] bg-surface border-2 border-ink rounded-[28px] shadow-[6px_6px_0_var(--ink)] p-5 sm:p-6 flex flex-col items-center justify-between min-h-[420px] select-none transition-all duration-300">
      {/* ── TOP: Dynamic Step Tag (Normal document flow, no absolute overlap) ── */}
      <div className="w-full min-h-[72px] flex items-center justify-center">
        {step === 1 && (
          <div className="w-full bg-lime border-2 border-ink rounded-2xl p-3.5 shadow-[3px_3px_0_var(--ink)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-ink/70">
                  {isArabic ? "هدف التوفير" : "Saving Goal"}
                </div>
                <div className="text-base font-extrabold text-ink font-heading leading-tight">
                  {isArabic ? "سفرة اليابان" : "Japan Summer Trip"}
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-surface border-2 border-ink font-extrabold text-xs text-ink shrink-0 shadow-[1px_1px_0_var(--ink)]">
                {isArabic ? "٥٠٠ د.ك" : "500 KWD"}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full bg-violet text-white border-2 border-ink rounded-2xl p-3 shadow-[3px_3px_0_var(--ink)] animate-in fade-in zoom-in-95 duration-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-lime">
              <span>{isArabic ? "إيداع تلقائي" : "Auto-deposited"}</span>
              <span className="flex items-center gap-1 text-xs bg-lime/20 px-2 py-0.5 rounded-full border border-lime/40 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-lime animate-ping" />
                {isArabic ? "+٢٥ د.ك أسبوعياً" : "+25 KWD weekly"}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-0.5">
              <span className="text-xl font-extrabold text-white font-heading">
                {isArabic ? `${counterVal} د.ك` : `${counterVal}.000 KWD`}
              </span>
              <span className="text-xs font-extrabold text-white/80">
                {counterVal}% {isArabic ? "مكتمل" : "saved"}
              </span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="w-full bg-coral text-white border-2 border-ink rounded-2xl p-3 shadow-[3px_3px_0_var(--ink)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white text-ink border-2 border-ink flex items-center justify-center font-extrabold text-sm shadow-[1px_1px_0_var(--ink)] shrink-0">
                  A
                </div>
                <div>
                  <div className="text-xs font-bold text-white/90">
                    {isArabic ? "المفتاح بيد رفيقك" : "Key held by"}
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold text-white font-heading leading-tight">
                    {isArabic ? "أحمد المطوع" : "Ahmed Al-Mutawa"}
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-lime border-2 border-ink flex items-center justify-center text-ink shadow-[1px_1px_0_var(--ink)] shrink-0 animate-bounce">
                <KeyRound className="w-4 h-4 text-ink" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MIDDLE: 16px Gap (my-4) + Vault Graphic with min-height 220px ── */}
      <div className="w-56 h-56 min-h-[224px] rounded-[28px] bg-violet border-2 border-ink shadow-[4px_4px_0_var(--ink)] relative flex items-center justify-center transition-transform duration-300 my-4 shrink-0">
        {/* 4 Corner Bolts */}
        <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 rounded-full bg-white border border-ink" />
        <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 rounded-full bg-white border border-ink" />
        <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 rounded-full bg-white border border-ink" />
        <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 rounded-full bg-white border border-ink" />

        {/* 2 Hinges on Left */}
        <div className="absolute -left-2 top-10 w-2.5 h-7 rounded-sm bg-white border border-ink" />
        <div className="absolute -left-2 bottom-10 w-2.5 h-7 rounded-sm bg-white border border-ink" />

        {/* 1 Locking Bar on Right */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-2.5 h-6 rounded-sm bg-white border border-ink" />

        {/* Vault Door */}
        <div className="w-44 h-44 rounded-2xl bg-[#886BFF] border-2 border-ink relative flex flex-col items-center justify-center overflow-hidden">
          {/* Wheel Handle with Lime Base */}
          <div className="relative flex items-center justify-center mb-1">
            {/* Lime disc */}
            <div className="w-20 h-20 rounded-full bg-lime border-2 border-ink flex items-center justify-center shadow-[1px_1px_0_var(--ink)]">
              {/* Progress Ring in Step 2 */}
              {step === 2 && (
                <svg className="absolute inset-0 w-20 h-20 -rotate-90 pointer-events-none">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="#14102B"
                    strokeWidth="4"
                    strokeDasharray="213"
                    strokeDashoffset={213 - (213 * counterVal) / 100}
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
              )}

              {/* 4-Spoke Chrome Wheel */}
              <div
                className={`w-14 h-14 rounded-full border-[5px] border-white shadow-inner relative flex items-center justify-center transition-transform duration-700 ${
                  step === 2 ? "rotate-90" : step === 3 ? "rotate-180" : "rotate-0"
                }`}
              >
                {/* 4 Spokes */}
                <div className="absolute w-full h-1 bg-white border-y border-ink/40" />
                <div className="absolute h-full w-1 bg-white border-x border-ink/40" />
                {/* Center Hub */}
                <div className="w-4 h-4 rounded-full bg-white border border-ink z-10" />
              </div>
            </div>
          </div>

          {/* Keyhole Plate below Wheel */}
          <div className="w-8 h-9 rounded-lg bg-lime border-2 border-ink flex flex-col items-center justify-center shadow-[1px_1px_0_var(--ink)] mt-1">
            <div className="w-2 h-2 rounded-full bg-ink" />
            <div className="w-1.5 h-2.5 bg-ink -mt-0.5 rounded-b-sm" />
          </div>
        </div>
      </div>

      {/* ── BOTTOM: Status Tag Pill ── */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-bg border-2 border-ink text-xs font-bold text-ink shadow-[1px_1px_0_var(--ink)] shrink-0">
        {step === 1 && (
          <>
            <span className="w-2 h-2 rounded-full bg-lime" />
            <span>{isArabic ? "الخطوة ١: تحديد الهدف" : "Step 1: Goal Setup"}</span>
          </>
        )}
        {step === 2 && (
          <>
            <span className="w-2 h-2 rounded-full bg-violet animate-pulse" />
            <span>{isArabic ? "الخطوة ٢: استقطاع بالميعاد" : "Step 2: On-Schedule Saves"}</span>
          </>
        )}
        {step === 3 && (
          <>
            <Lock className="w-3 h-3 text-coral" />
            <span>{isArabic ? "الخطوة ٣: القفل بيد رفيقك" : "Step 3: Friend Holds Key"}</span>
          </>
        )}
      </div>
    </div>
  );
}
