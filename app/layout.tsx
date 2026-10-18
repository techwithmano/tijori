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
    <html lang="en" className="dark">
      <body className="bg-tijori-bg text-slate-100 min-h-screen flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
        {/* Ambient Top Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        {/* Dynamic Global or Keyholder Navigation Header */}
        <Header />

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
          {children}
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-tijori-border/60 py-6 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tijori (تِجوري) &bull; Built with Next.js, Stripe, Mongoose & Gemini 2.5 Flash</span>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              Currency: KWD (Kuwaiti Dinar) &bull; GCC Banking Friction Layer
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
