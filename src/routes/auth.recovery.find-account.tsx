import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth/recovery/find-account")({
  head: () => ({ meta: [{ title: "Find Your Opexnal Account" }] }),
  component: FindAccountPage,
});

function FindAccountPage() {
  return (
    <section className="w-full space-y-5 text-white">
      <Link to="/auth/recovery" className="text-xs text-gray-400 hover:text-white">
        <ArrowLeft className="mr-1 inline h-4 w-4" /> Back to Recovery
      </Link>
      <header className="space-y-2 text-center">
        <Search className="mx-auto h-8 w-8 text-violet-300" />
        <h1 className="text-2xl font-bold">Find your Opexnal account</h1>
        <p className="text-sm text-gray-400">
          Use your username or original account email.
        </p>
      </header>
      <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-300">
        For privacy, this page does not reveal whether an account exists. Submit
        a recovery request to support instead.
      </p>
      <Link
        to="/auth/recovery"
        className="block rounded-xl bg-violet-600 p-3 text-center text-sm font-semibold"
      >
        Continue to account recovery
      </Link>
      <p className="text-xs text-gray-500">
        <ShieldCheck className="mr-1 inline h-4 w-4" />
        Never enter your password or one-time code here.
      </p>
    </section>
  );
}
