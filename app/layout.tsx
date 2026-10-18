import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Shield, Sparkles, Lock, PlusCircle } from "lucide-react";

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

        {/* Global Navigation Header */}
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
