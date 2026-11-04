import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, Smartphone } from "lucide-react";

export const Route = createFileRoute("/auth/recovery/choose-method")({
  head: () => ({ meta: [{ title: "Choose a Recovery Method — Opexnal" }] }),
  component: ChooseRecoveryMethodPage,
});

function ChooseRecoveryMethodPage() {
  return (
    <section className="w-full space-y-5 text-white">
      <Link to="/auth/recovery" className="text-xs text-gray-400 hover:text-white">
        <ArrowLeft className="mr-1 inline h-4 w-4" /> Back to Recovery
      </Link>
      <h1 className="text-center text-2xl font-bold">Choose a recovery method</h1>
      <Link
        to="/auth/forgot-password"
        className="flex items-start gap-3 rounded-xl border border-white/10 p-4"
      >
        <Mail className="h-5 w-5 text-violet-300" />
        <span>
          <strong className="block text-sm">Email password reset</strong>
          <span className="text-xs text-gray-400">
            Request a reset link using your registered email.
          </span>
        </span>
      </Link>
      <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 p-4">
        <Smartphone className="h-5 w-5 text-amber-200" />
        <span className="text-xs text-amber-100">
          Phone OTP is unavailable until a real SMS provider and server endpoint
          are configured.
        </span>
      </div>
      <Link
        to="/auth/recovery/support"
        className="block rounded-xl border border-white/10 p-4 text-sm"
      >
        I cannot use my recovery email — request support
      </Link>
    </section>
  );
}
