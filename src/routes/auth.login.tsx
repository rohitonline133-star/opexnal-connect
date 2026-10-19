import React, { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Phone,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { lovable } from "@/integrations/lovable";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>) => loginSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Log In — Opexnal" },
      {
        name: "description",
        content: "Log in to your Opexnal account to access feeds and messages.",
      },
    ],
  }),
  component: LoginPage,
});

type AuthMethod = "email_username" | "phone";

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [authMethod, setAuthMethod] = useState<AuthMethod>("email_username");
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone OTP Flow State
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");

  // 2FA Challenge State
  const [requires2fa, setRequires2fa] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Phone OTP is not wired to a real SMS provider. Never accept the mock endpoint as authentication.
    if (authMethod === "phone") {
      setErrorMessage("Phone OTP login is not configured with a real SMS provider. Use your registered email and password.");
      return;
    }

    // 2. Email / Username Login Flow
    const identity = emailOrUsername.trim();
    if (!identity) {
      setErrorMessage("Please enter your email or username");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await authClient.signInWithPassword({
        email: identity,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        toast.error(error.message);
        return;
      }

      if (data?.requires2fa) {
        setRequires2fa(true);
        setPendingUserId(data.user?.id || null);
        toast.info("Two-factor authentication required for this account");
        return;
      }

      if (data?.session) {
        toast.success("Signed in successfully! Welcome to Opexnal.");
        navigate({ to: search.redirect || "/home", replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication error";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode.trim()) {
      setErrorMessage("Please enter your 6-digit TOTP code or backup code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingUserId, token: twoFactorCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Two-Factor Verified! Welcome back.");
        navigate({ to: search.redirect || "/home", replace: true });
      } else {
        setErrorMessage(data.error || "Invalid authentication code");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid two-factor authentication code";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    setErrorMessage(null);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + (search.redirect || "/home"),
      });

      if (result?.error) {
        const msg = result.error.message || `Failed to authenticate with ${provider}`;
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      if (result?.redirected) return;

      const { data } = await authClient.getUser();
      if (data?.user) {
        toast.success("Signed in successfully!");
        navigate({ to: search.redirect || "/home", replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to connect with ${provider}`;
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div className="w-full">
      {/* Back button */}
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">
          {requires2fa ? "Two-Factor Verification" : "Welcome Back"}
        </h2>
        <p className="text-xs text-gray-400 font-medium">
          {requires2fa
            ? "Enter code from your Authenticator app or a single-use backup code"
            : "Log in with your email, username or registered phone"}
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="w-full mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <span className="flex-1 leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {requires2fa ? (
        <form onSubmit={handleVerify2fa} className="w-full space-y-3.5">
          <div className="p-3 bg-[#121212] border border-[#262626] rounded-xl text-xs space-y-1">
            <span className="text-[#8B5CF6] font-semibold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> 2FA Security Challenge
            </span>
            <p className="text-gray-400 text-[11px]">
              This account requires a one-time verification token.
            </p>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">
              <KeyRound size={18} />
            </span>
            <input
              type="text"
              placeholder="6-digit code or ABCD-1234 backup code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              disabled={loading}
              autoFocus
              required
              className="w-full h-12 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition font-mono tracking-wider"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Continue"}
          </button>

          <button
            type="button"
            onClick={() => setRequires2fa(false)}
            className="w-full text-center text-xs text-gray-400 hover:text-white pt-1"
          >
            Cancel and return to password login
          </button>
        </form>
      ) : (
        <>
          {/* Method selector */}
          <div className="flex w-full bg-[#121212] border border-[#262626] p-1 rounded-xl mb-4 gap-1">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("email_username");
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                authMethod === "email_username"
                  ? "bg-[#262626] text-white shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Email / Username
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("phone");
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                authMethod === "phone"
                  ? "bg-[#262626] text-white shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Phone Number
            </button>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-3.5">
            {authMethod === "phone" ? (
              <>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-400">
                    <Phone size={18} />
                  </span>
                  <input
                    type="tel"
                    placeholder="Phone number (+91 98765 43210)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading || phoneOtpSent}
                    required
                    className="w-full h-12 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-60"
                  />
                </div>

                {phoneOtpSent && (
                  <div className="relative flex items-center animate-in fade-in duration-200">
                    <span className="absolute left-4 text-gray-400">
                      <KeyRound size={18} />
                    </span>
                    <input
                      type="text"
                      placeholder="Enter 6-digit SMS code"
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value)}
                      disabled={loading}
                      autoFocus
                      required
                      className="w-full h-12 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition font-mono"
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-400">
                    <User size={18} />
                  </span>
                  <input
                    id="login-identity-input"
                    type="text"
                    placeholder="Email or Username"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full h-12 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50"
                  />
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-400">
                    <Lock size={18} />
                  </span>
                  <input
                    id="login-password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full h-12 pl-11 pr-11 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-gray-400 hover:text-white transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </>
            )}

            {/* Forgot password link */}
            {authMethod === "email_username" && (
              <div className="flex justify-between items-center text-xs pt-0.5">
                <Link
                  to="/auth/recovery"
                  className="text-gray-400 hover:text-white hover:underline transition"
                >
                  Lost Access / Hacked?
                </Link>
                <Link
                  to="/auth/forgot-password"
                  className="font-semibold text-[#8B5CF6] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            )}

            <button
              id="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {loading
                  ? "Authenticating..."
                  : authMethod === "phone"
                    ? phoneOtpSent
                      ? "Verify Code & Log In"
                      : "Send Login Code"
                    : "Log In"}
              </span>
            </button>
          </form>

          {/* Social Sign-in stack */}
          <div className="w-full my-5 flex items-center justify-center relative">
            <div className="w-full border-t border-[#222222]"></div>
            <span className="absolute bg-black px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              OR
            </span>
          </div>

          <div className="w-full space-y-2.5">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={oauthLoading !== null || loading}
              className="w-full h-11 bg-white text-black font-semibold text-xs rounded-xl flex items-center justify-center space-x-2.5 hover:bg-gray-100 transition active:scale-[0.99] disabled:opacity-50"
            >
              {oauthLoading === "google" ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuth("apple")}
              disabled={oauthLoading !== null || loading}
              className="w-full h-11 bg-white text-black font-semibold text-xs rounded-xl flex items-center justify-center space-x-2.5 hover:bg-gray-100 transition active:scale-[0.99] disabled:opacity-50"
            >
              {oauthLoading === "apple" ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.54c.63-.78 1.07-1.85.95-2.93-.93.04-2.07.62-2.73 1.39-.59.68-1.11 1.78-.97 2.84 1.05.08 2.12-.52 2.75-1.3" />
                </svg>
              )}
              <span>Continue with Apple</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 font-medium">
              Don't have an account?{" "}
              <Link
                to="/auth/signup"
                search={{ redirect: search.redirect }}
                className="text-[#8B5CF6] font-semibold hover:underline ml-1"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
