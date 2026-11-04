import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle, LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/auth/recovery/support")({
  head: () => ({ meta: [{ title: "Account Support — Opexnal" }] }),
  component: RecoverySupportPage,
});

function RecoverySupportPage() {
  return (
    <section className="w-full space-y-5 text-white">
      <Link to="/auth/recovery" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to Recovery</Link>
      <header className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-rose-400/25 bg-rose-500/10 text-rose-300"><LifeBuoy className="h-6 w-6" /></div>
        <h1 className="text-2xl font-bold">Request account support</h1>
        <p className="text-sm text-gray-400">Tell Opexnal support which account-access problem you are facing.</p>
      </header>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-300">
        <li>Open the secure recovery request form.</li>
        <li>Enter your Opexnal username or original account email.</li>
        <li>Select the issue and provide only non-sensitive context.</li>
        <li>Keep the private tracking ID to check the request status.</li>
      </ol>
      <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-xs leading-relaxed text-amber-100/90">
        <div className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Do not send secrets</div>
        Never enter passwords, OTPs, payment details, government ID numbers, identity documents, or selfies. A submitted request is not an account approval and does not automatically restore access.
      </div>
      <Link to="/auth/recovery" className="flex h-11 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold hover:bg-violet-500">Open secure support request</Link>
    </section>
  );
}
