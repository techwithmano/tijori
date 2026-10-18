"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Lock, PlusCircle, LayoutDashboard, Sliders } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const isKeyholderView = pathname?.startsWith("/unlock");

  if (isKeyholderView) {
    return (
      <header className="border-b border-slate-200/90 bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Clean Tijori Gold Shield logo with text "TIJORI SECURITY CLEARANCE" */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Shield className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-xs sm:text-sm tracking-wider text-slate-900 font-mono">
                TIJORI SECURITY CLEARANCE
              </span>
              <p className="text-[10px] text-amber-700 font-mono font-medium">
                Protected Peer Protocol
              </p>
            </div>
          </div>

          {/* Right: Pulsing green badge "256-Bit Single-Use Channel" */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide">
              256-Bit Single-Use Channel
            </span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-slate-200/90 bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
            <Lock className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
                Tijori
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                تِجوري
              </span>
            </div>
            <p className="text-[10px] text-slate-500 -mt-1 font-mono">
              GCC Anti-Impulse Protocol
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/#simulator"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Simulator</span>
          </Link>

          <Link
            href="/dashboard"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              pathname === "/dashboard"
                ? "bg-amber-500 text-slate-950 shadow-sm font-bold"
                : "text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 transition-all shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>New Vault</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
