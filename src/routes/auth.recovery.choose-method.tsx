import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, ShieldAlert, Smartphone } from "lucide-react";

export const Route = createFileRoute("/auth/recovery/choose-method")({
  head: () => ({ meta: [{ title: "Choose a Recovery Method — Opexnal" }] }),
  component: ChooseRecoveryMethodPage,
});

function ChooseRecoveryMethodPage() {
  return (
    <section className="w-full space-y-5 text-white">
      <Link to="/auth/recovery" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to Recovery</Link>
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Choose a recovery method</h1>
        <p className="text-sm text-gray-400">Only methods connected to a live, configured service can verify access.</p>
      </header>
      <Link to="/auth/forgot-password" className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-violet-400/40">
        <Mail className="h-5 w-5 shrink-0 text-violet-300" />
        <span><strong className="block text-sm">Email password reset</strong><span className="mt-1 block text-xs text-gray-400">Request a reset link using your registered email address.</span></span>
      </Link>
      <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
        <Smartphone className="h-5 w-5 shrink-0 text-amber-200" />
        <span><strong className="block text-sm text-amber-100">Phone verification unavailable</strong><span className="mt-1 block text-xs text-amber-100/70">A real SMS delivery provider and server verification endpoint are not configured, so no phone OTP can be sent or verified.</span></span>
      </div>
      <Link to="/auth/recovery/support" className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-violet-400/40">
        <ShieldAlert className="h-5 w-5 shrink-0 text-rose-300" />
        <span><strong className="block text-sm">I cannot use my recovery email</strong><span className="mt-1 block text-xs text-gray-400">Send an account access request for manual support review.</span></span>
      </Link>
    </section>
  );
}
