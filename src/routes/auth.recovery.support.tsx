import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth/recovery/support")({
  head: () => ({ meta: [{ title: "Account Support — Opexnal" }] }),
  component: RecoverySupportPage,
});

function RecoverySupportPage() {
  return (
    <section className="w-full space-y-5 text-white">
      <Link to="/auth/recovery" className="text-xs text-gray-400 hover:text-white">
        <ArrowLeft className="mr-1 inline h-4 w-4" /> Back to Recovery
      </Link>
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Request account support</h1>
        <p className="text-sm text-gray-400">
          Follow these steps to report an account-access problem.
        </p>
      </header>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-300">
        <li>Open the secure recovery request form.</li>
        <li>Enter your Opexnal username or original account email.</li>
        <li>Choose the issue and add only non-sensitive details.</li>
        <li>Keep your private ticket ID to track the request.</li>
      </ol>
      <div className="rounded-xl border border-amber-400/20 p-4 text-xs text-amber-100">
        <AlertTriangle className="mr-1 inline h-4 w-4" />
        Never submit passwords, OTPs, payment details, identity documents, or
        selfies. A request does not automatically restore account access.
      </div>
      <Link
        to="/auth/recovery"
        className="block rounded-xl bg-violet-600 p-3 text-center text-sm font-semibold"
      >
        Open secure support request
      </Link>
    </section>
  );
}
