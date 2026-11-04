import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { ShieldCheck, Lock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in & Security — Opexnal" },
      {
        name: "description",
        content:
          "Create your Opexnal account or securely sign in to connect with people and creators.",
      },
      { property: "og:title", content: "Sign in & Security — Opexnal" },
      {
        property: "og:description",
        content: "Create your Opexnal account or securely sign in.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AuthLayout,
});

export function AuthLayout() {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center overflow-hidden bg-[#09090d] px-4 py-7 font-sans text-white selection:bg-fuchsia-500/30 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute -right-28 top-1/4 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.055),transparent_55%)]" />
      </div>

      <header className="z-10 flex w-full max-w-md flex-col items-center text-center">
        <Link
          to="/"
          className="group mb-3 inline-flex items-center justify-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
        >
          <img
            src="/branding/opexnal-logo.webp"
            alt="Opexnal — Connect, Create, Grow"
            className="h-24 w-auto max-w-full object-contain transition duration-200 group-hover:scale-[1.02] group-hover:opacity-90 sm:h-28"
            fetchPriority="high"
          />
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-[11px] font-medium text-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Security-first account access</span>
        </div>
      </header>

      <main className="z-10 my-auto flex w-full max-w-md flex-col items-center py-7 sm:py-9">
        <section className="w-full rounded-[28px] border border-white/10 bg-[#111116]/95 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.48)] backdrop-blur-xl sm:p-7">
          <div className="mb-5 flex items-center justify-center gap-2 text-xs font-medium text-gray-400">
            <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
            <span>Your space to connect and create</span>
          </div>
          <Outlet />
        </section>
      </main>

      <footer className="z-10 w-full max-w-md space-y-4 border-t border-white/10 pt-5 text-center text-[11px] text-gray-500">
        <nav aria-label="Account help" className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          <Link to="/auth/login" className="transition hover:text-white">
            Log In
          </Link>
          <Link to="/auth/signup" className="transition hover:text-white">
            Sign Up
          </Link>
          <Link to="/auth/forgot-password" className="transition hover:text-white">
            Forgot Password
          </Link>
          <Link to="/auth/recovery" className="transition hover:text-white">
            Account Recovery
          </Link>
          <Link to="/auth/help" className="transition hover:text-white">
            Account Help
          </Link>
          <Link to="/help" className="transition hover:text-white">
            Help
          </Link>
        </nav>
        <p className="flex items-center justify-center gap-1.5 text-[10px] leading-relaxed text-gray-600">
          <Lock className="h-3 w-3 shrink-0" />
          <span>
            Never share your password or verification codes. Use only the official Opexnal sign-in
            page.
          </span>
        </p>
      </footer>
    </div>
  );
}
