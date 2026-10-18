"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, Lock, PlusCircle, LayoutDashboard, LogOut, User, Sparkles } from "lucide-react";

interface UserSession {
  id: string;
  name: string;
  email: string;
  allowanceDay: number;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isKeyholderView = pathname?.startsWith("/unlock");

  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (pathname === "/" || pathname === "/dashboard") {
    return null;
  }

  if (isKeyholderView) {
    return (
      <header className="border-b border-slate-200/90 bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Clean Tijori Gold Shield logo with text "TIJORI KEYHOLDER CLEARANCE • 256-Bit Channel" */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Shield className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-xs sm:text-sm tracking-wider text-slate-900 font-mono">
                TIJORI KEYHOLDER CLEARANCE • 256-Bit Channel
              </span>
              <p className="text-[10px] text-amber-700 font-mono font-medium">
                Protected Peer Protocol
              </p>
            </div>
          </div>

          {/* Right: Pulsing green badge "🛡️ Live WhatsApp Verification" */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide">
              🛡️ Live WhatsApp Verification
            </span>
          </div>
        </div>
      </header>
    );
  }

  // Auth pages (/login, /register): Clean brand mark and auth link only
  if (pathname === "/login" || pathname === "/register") {
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

          <nav className="flex items-center gap-2">
            <Link
              href={pathname === "/login" ? "/register" : "/login"}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all shadow-xs"
            >
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>{pathname === "/login" ? "Register" : "Sign In"}</span>
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  const firstName = user?.name ? user.name.split(" ")[0] : "Abdulrahman";

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

        {/* User Session Greeting & Actions */}
        <nav className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900">
                  Salam, {firstName}
                </span>
                <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  Day-{user.allowanceDay || 25} Cycle
                </span>
              </div>

              {pathname !== "/create" && (
                <Link
                  href="/create"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden xs:inline">New Vault</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-all text-xs flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] font-medium">Exit</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span>Log In</span>
              </Link>

              {pathname !== "/create" && (
                <Link
                  href="/create"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5 fill-slate-950" />
                  <span>New Vault</span>
                </Link>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
