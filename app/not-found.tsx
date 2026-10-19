import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-surface border border-line rounded-card p-8 sm:p-10 shadow-card text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-raised border border-line mx-auto flex items-center justify-center shadow-violetSubtle">
          <ShieldAlert className="w-8 h-8 text-coral" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-mono font-bold text-coral uppercase tracking-wider">
            404 • Not Found
          </p>
          <h1 className="text-3xl font-extrabold text-text tracking-tight">
            Vault Not Found
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            This page doesn&apos;t exist, may have expired, or was locked away permanently.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="tactile-btn py-3 px-6 rounded-btn bg-accent text-accent-foreground font-extrabold text-sm shadow-limeGlow hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>
          <Link
            href="/"
            className="tactile-btn py-3 px-6 rounded-btn bg-raised hover:bg-surface border border-line text-text font-bold text-sm flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
