import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth/recovery/find-account")({
  head: () => ({ meta: [{ title: "Find Your Opexnal Account" }] }),
  component: FindAccountPage,
});

function FindAccountPage() {
  return (
    <section className="w-full space-y-5 text-white">
      <Link to="/auth/recovery" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Recovery
      </Link>
      <header className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/10 text-violet-300"><Search className="h-6 w-6" /></div>
        <h1 className="text-2xl font-bold">Find your Opexnal account</h1>
        <p className="text-sm text-gray-400">Use the username or original email address connected to your account.</p>
      </header>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-gray-300">
        For privacy, Opexnal does not display account details or confirm whether an identifier belongs to an account on this screen. Submit a recovery request to the support team instead.
      </div>
      <Link to="/auth/recovery" className="flex h-11 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold hover:bg-violet-500">Continue to account recovery</Link>
      <p className="flex items-start gap-2 text-xs text-gray-500"><ShieldCheck className="h-4 w-4 shrink-0" /> Never enter your password or one-time code into a recovery request.</p>
    </section>
  );
}
