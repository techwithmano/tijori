"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Lock, PlusCircle } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const isKeyholderView = pathname?.startsWith("/unlock");

  if (isKeyholderView) {
    return (
      <header className="border-b border-tijori-border/80 bg-tijori-bg/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Clean Tijori Gold Shield logo with text "TIJORI SECURITY CLEARANCE" */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield className="w-5 h-5 text-gray-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-xs sm:text-sm tracking-wider text-white font-mono">
                TIJORI SECURITY CLEARANCE
              </span>
              <p className="text-[10px] text-amber-400 font-mono">
                Protected Peer Protocol
              </p>
            </div>
          </div>

          {/* Right: Pulsing green badge "256-Bit Single-Use Channel" */}
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
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
    <header className="border-b border-tijori-border bg-tijori-bg/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
            <Lock className="w-5 h-5 text-gray-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-amber-400 transition-colors">
                Tijori
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                تِجوري
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-1 font-mono">
              GCC Anti-Impulse Protocol
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-all shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>New Vault</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Shield className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">Keyholder Active</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
