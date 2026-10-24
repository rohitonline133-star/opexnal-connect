import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { ShieldCheck, Lock } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in & Security — Opexnal" },
      {
        name: "description",
        content: "Secure authentication, login, signup and account protection for Opexnal.",
      },
      { property: "og:title", content: "Sign in & Security — Opexnal" },
      {
        property: "og:description",
        content: "Secure authentication, login, signup and account protection for Opexnal.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AuthLayout,
});

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between items-center px-4 py-8 font-sans selection:bg-[#8B5CF6]/30">
      {/* Top Header / Branding */}
      <header className="w-full max-w-md flex flex-col items-center">
        <Link to="/" className="group flex items-center gap-2 mb-2 focus:outline-none">
          <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#D946EF] bg-clip-text text-transparent group-hover:opacity-90 transition">
            Opexnal
          </span>
        </Link>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Opexnal Zero-Trust Account Security</span>
        </div>
      </header>

      {/* Main Auth Content Screen */}
      <main className="w-full max-w-md my-auto flex flex-col items-center py-6">
        <Outlet />
      </main>

      {/* Footer Navigation & Security Guarantees */}
      <footer className="w-full max-w-md text-center space-y-3 pt-6 border-t border-[#1f1f1f] text-[11px] text-gray-500">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link to="/auth/login" className="hover:text-gray-300 transition">
            Log In
          </Link>
          <Link to="/auth/signup" className="hover:text-gray-300 transition">
            Sign Up
          </Link>
          <Link to="/auth/forgot-password" className="hover:text-gray-300 transition">
            Forgot Password
          </Link>
          <Link to="/auth/recovery" className="hover:text-gray-300 transition">
            Account Recovery
          </Link>
          <Link to="/auth/sessions" className="hover:text-gray-300 transition">
            Sessions
          </Link>
          <Link to="/auth/2fa" className="hover:text-gray-300 transition">
            2FA
          </Link>
          <Link to="/help" className="hover:text-gray-300 transition">
            Help
          </Link>
        </div>
        <p className="flex items-center justify-center gap-1 text-[10px] text-gray-600">
          <Lock className="w-3 h-3" />
          <span>TLS Encrypted • Never share your password or OTP verification codes</span>
        </p>
      </footer>
    </div>
  );
}
