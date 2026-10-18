import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Shield, Sparkles, Lock, PlusCircle } from "lucide-react";

import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Tijori (تِجوري) | Anti-Impulse Micro-Savings & Keyholder Protocol",
  description:
    "Behavioral anti-impulse micro-savings web platform for GCC youth. Automated recurring micro-pulls with time-locked vaults and peer social friction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-tijori-bg text-tijori-primary min-h-screen flex flex-col selection:bg-amber-500/20 selection:text-amber-900">
        {/* Ambient Top Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        {/* Dynamic Global or Keyholder Navigation Header */}
        <Header />

        {/* Main Content Area */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-slate-600 font-medium">Tijori (تِجوري) &bull; Behavioral Anti-Impulse Micro-Savings Protocol</span>
            </div>
            <div className="font-mono text-[11px] text-slate-500">
              Currency: KWD (Kuwaiti Dinar) &bull; GCC Banking Friction Layer
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
