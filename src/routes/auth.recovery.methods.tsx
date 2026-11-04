import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, ShieldCheck, Smartphone } from "lucide-react";

export const Route = createFileRoute("/auth/recovery/methods")({
  head: () => ({ meta: [{ title: "Recovery Methods — Opexnal" }] }),
  component: RecoveryMethodsPage,
});

function RecoveryMethodsPage() {
  return (
    <section className="w-full space-y-5 text-white">
      <Link to="/auth/recovery" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to Recovery</Link>
      <header className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 text-emerald-300"><ShieldCheck className="h-6 w-6" /></div>
        <h1 className="text-2xl font-bold">Recovery methods</h1>
        <p className="text-sm text-gray-400">Manage recovery options only after they are verified by Opexnal.</p>
      </header>
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start gap-3"><Mail className="h-5 w-5 shrink-0 text-violet-300" /><div><strong className="text-sm">Email</strong><p className="mt-1 text-xs text-gray-400">Email verification and password-reset delivery require a configured mail service.</p></div></div>
        <div className="flex items-start gap-3"><Smartphone className="h-5 w-5 shrink-0 text-gray-400" /><div><strong className="text-sm">Phone</strong><p className="mt-1 text-xs text-gray-400">SMS recovery is not active until a real SMS provider and server-side OTP verification are configured.</p></div></div>
      </div>
      <p className="text-xs leading-relaxed text-gray-500">This screen does not save, change, or verify contact details. It will only become an account setting when the authenticated backend can securely store and verify those changes.</p>
      <Link to="/auth/forgot-password" className="flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold hover:bg-white/[0.08]">Continue with email password reset</Link>
    </section>
  );
}
