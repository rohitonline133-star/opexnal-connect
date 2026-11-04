import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, Smartphone } from "lucide-react";

export const Route = createFileRoute("/auth/recovery/methods")({
  head: () => ({ meta: [{ title: "Recovery Methods — Opexnal" }] }),
  component: RecoveryMethodsPage,
});

function RecoveryMethodsPage() {
  return (
    <section className="w-full space-y-5 text-white">
      <Link to="/auth/recovery" className="text-xs text-gray-400 hover:text-white">
        <ArrowLeft className="mr-1 inline h-4 w-4" /> Back to Recovery
      </Link>
      <h1 className="text-center text-2xl font-bold">Recovery methods</h1>
      <div className="space-y-3 rounded-xl border border-white/10 p-4">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-violet-300" />
          <p className="text-xs text-gray-300">
            Email verification and password reset require a configured mail service.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <Smartphone className="h-5 w-5 text-gray-400" />
          <p className="text-xs text-gray-300">
            SMS recovery is inactive until a real provider and server-side OTP verification are
            configured.
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        This screen does not save or verify contact details. Those settings need authenticated
        backend support first.
      </p>
      <Link
        to="/auth/forgot-password"
        className="block rounded-xl border border-white/10 p-3 text-center text-sm"
      >
        Continue with email password reset
      </Link>
    </section>
  );
}
