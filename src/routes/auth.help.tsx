import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, ShieldAlert, Mail, Search, LockKeyhole } from "lucide-react";

export const Route = createFileRoute("/auth/help")({
  head: () => ({
    meta: [
      { title: "Account Help — Opexnal" },
      { name: "description", content: "Choose the right Opexnal sign-in, password, or account recovery path." },
    ],
  }),
  component: AccountHelpPage,
});

function AccountHelpPage() {
  return (
    <div className="w-full space-y-4">
      <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-xs text-gray-400 transition hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Login
      </Link>

      <header className="space-y-1 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/10 text-violet-300">
          <Search className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-white">How can we help?</h2>
        <p className="text-xs text-gray-400">Choose the option that best matches your Opexnal account issue.</p>
      </header>

      <nav aria-label="Account help topics" className="space-y-2">
        <Link to="/auth/forgot-password" className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-violet-400/40 hover:bg-white/[0.06]">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white">I forgot my password</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-gray-400">Request a password reset using the email registered to your account.</span>
          </span>
        </Link>

        <Link to="/auth/recovery" className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-violet-400/40 hover:bg-white/[0.06]">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white">My account may be hacked</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-gray-400">Submit a support request for unauthorized access or suspicious changes.</span>
          </span>
        </Link>

        <Link to="/auth/recovery" className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-violet-400/40 hover:bg-white/[0.06]">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white">I lost access to my email or phone</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-gray-400">Submit an account recovery request with your username or original account email.</span>
          </span>
        </Link>

        <Link to="/auth/recovery" className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-violet-400/40 hover:bg-white/[0.06]">
          <Search className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white">Find or track my recovery request</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-gray-400">Use your private recovery ticket ID to check its current status.</span>
          </span>
        </Link>
        <Link to="/auth/recovery/find-account" className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-violet-400/40 hover:bg-white/[0.06]">
          <Search className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
          <span className="min-w-0"><span className="block text-sm font-semibold text-white">Find my account</span><span className="mt-0.5 block text-xs leading-relaxed text-gray-400">Learn how to identify the account without exposing private account details.</span></span>
        </Link>
        <Link to="/auth/recovery/choose-method" className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-violet-400/40 hover:bg-white/[0.06]">
          <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
          <span className="min-w-0"><span className="block text-sm font-semibold text-white">Choose a recovery method</span><span className="mt-0.5 block text-xs leading-relaxed text-gray-400">See which verification methods are currently available.</span></span>
        </Link>
        <Link to="/auth/recovery/methods" className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-violet-400/40 hover:bg-white/[0.06]">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
          <span className="min-w-0"><span className="block text-sm font-semibold text-white">Recovery methods</span><span className="mt-0.5 block text-xs leading-relaxed text-gray-400">Review the current email and phone recovery limitations.</span></span>
        </Link>
        <Link to="/auth/recovery/support" className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-violet-400/40 hover:bg-white/[0.06]">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
          <span className="min-w-0"><span className="block text-sm font-semibold text-white">Request account support</span><span className="mt-0.5 block text-xs leading-relaxed text-gray-400">Read the secure support steps before filing a recovery case.</span></span>
        </Link>
      </nav>

      <aside className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-xs leading-relaxed text-amber-100/90">
        <div className="mb-1 flex items-center gap-2 font-semibold text-amber-200">
          <LockKeyhole className="h-4 w-4" />
          Protect your account
        </div>
        Opexnal support will never ask you to share your password or one-time verification code in this form. Do not upload identity documents or selfies here. A recovery request is not an automatic account approval.
      </aside>

      <p className="text-center text-xs text-gray-500">
        Still need to sign in? <Link to="/auth/login" className="font-semibold text-violet-300 hover:underline">Return to login</Link>
      </p>
    </div>
  );
}
