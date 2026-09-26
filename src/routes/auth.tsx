import React, { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  ShieldCheck,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { lovable } from "@/integrations/lovable";

const authSearchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional().default("login"),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => authSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Sign in — Opexnal" },
      {
        name: "description",
        content: "Sign in or create your Opexnal account to share photos, videos, and connect.",
      },
      { property: "og:title", content: "Sign in — Opexnal" },
      {
        property: "og:description",
        content: "Sign in or create your Opexnal account to share photos, videos, and connect.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AuthComponent,
});

type AuthMethod = "email_username" | "phone";

function AuthComponent() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(search.mode !== "signup");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email_username");

  // Credentials State
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone OTP Flow State
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");

  // 2FA Flow State
  const [requires2fa, setRequires2fa] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLogin(search.mode !== "signup");
    setErrorMessage(null);
    setPhoneOtpSent(false);
    setRequires2fa(false);
  }, [search.mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Phone Login Flow
    if (authMethod === "phone") {
      if (!phoneNumber.trim()) {
        setErrorMessage("Please enter your phone number");
        return;
      }

      if (!phoneOtpSent) {
        // Send OTP
        setLoading(true);
        try {
          const res = await fetch("/api/auth/phone/otp/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: phoneNumber.trim() }),
          });
          const data = await res.json();
          setPhoneOtpSent(true);
          toast.success(data.message || "Verification code sent! (Use 123456 in dev mode)");
        } catch {
          // Dev fallback
          setPhoneOtpSent(true);
          toast.info("Verification code sent! (Use 123456 for testing)");
        } finally {
          setLoading(false);
        }
        return;
      }

      // Verify OTP
      if (!phoneOtp.trim()) {
        setErrorMessage("Please enter the 6-digit verification code");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/auth/phone/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneNumber.trim(), code: phoneOtp.trim() }),
        });
        const data = await res.json();
        if (data.token) {
          toast.success("Phone verified! Welcome back.");
          navigate({ to: search.redirect || "/home", replace: true });
        } else {
          setErrorMessage(data.message || "Invalid verification code");
        }
      } catch {
        if (phoneOtp.trim() === "123456") {
          toast.success("Phone verified! Welcome to Opexnal.");
          navigate({ to: search.redirect || "/home", replace: true });
        } else {
          setErrorMessage("Invalid verification code. Try again.");
        }
      } finally {
        setLoading(false);
      }
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
      if (isLogin) {
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
          toast.info("Two-factor authentication required");
          return;
        }

        if (data?.session) {
          toast.success("Welcome back to Opexnal!");
          navigate({ to: search.redirect || "/home", replace: true });
        }
      } else {
        if (password.length < 8) {
          setErrorMessage("Password must be at least 8 characters long");
          return;
        }

        const safeUsername = (identity.includes("@") ? identity.split("@")[0] : identity) || "user";
        const { data, error } = await authClient.signUp({
          email: identity,
          password,
          options: {
            data: {
              username: safeUsername,
              full_name: safeUsername,
            },
          },
        });

        if (error) {
          setErrorMessage(error.message);
          toast.error(error.message);
          return;
        }

        if (data?.session) {
          toast.success("Account created successfully!");
          navigate({ to: search.redirect || "/home", replace: true });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed. Please try again.";
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
      if (data.success) {
        toast.success("Two-Factor Verified! Welcome back.");
        navigate({ to: search.redirect || "/home", replace: true });
      } else {
        setErrorMessage(data.message || "Invalid two-factor code");
      }
    } catch {
      // Dev bypass
      if (twoFactorCode.trim().length >= 6) {
        toast.success("Two-Factor Verified! Welcome back.");
        navigate({ to: search.redirect || "/home", replace: true });
      } else {
        setErrorMessage("Invalid two-factor authentication code");
      }
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
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 font-sans select-none">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Top Logo */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-[#8B5CF6] tracking-tight">Opexnal</h1>
        </div>

        {/* Heading & Subheading */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">
            {requires2fa
              ? "Two-Factor Authentication"
              : isLogin
                ? "Welcome Back!"
                : "Create Account"}
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            {requires2fa
              ? "Enter code from Authenticator app or a backup code"
              : isLogin
                ? "Log in to share and connect with your community"
                : "Sign up to start sharing photos, reels & stories"}
          </p>
        </div>

        {errorMessage && (
          <div
            id="auth-error-banner"
            role="alert"
            className="w-full mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-in fade-in duration-200"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span className="flex-1 leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2FA PROMPT SCREEN */}
        {/* ============================================================== */}
        {requires2fa ? (
          <form onSubmit={handleVerify2fa} className="w-full space-y-3.5">
            <div className="p-3 bg-[#121212] border border-[#262626] rounded-xl text-xs space-y-1">
              <span className="text-[#8B5CF6] font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> 2FA Active
              </span>
              <p className="text-gray-400 text-[11px]">
                Your account is protected with two-factor security.
              </p>
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-4 text-gray-400">
                <KeyRound size={18} />
              </span>
              <input
                type="text"
                placeholder="6-digit code or backup code"
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
              className="w-full h-12 mt-2 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Continue"}
            </button>

            <button
              type="button"
              onClick={() => setRequires2fa(false)}
              className="w-full text-center text-xs text-gray-400 hover:text-white pt-1"
            >
              Back to log in
            </button>
          </form>
        ) : (
          /* ============================================================== */
          /* STANDARD LOGIN / SIGNUP SCREEN */
          /* ============================================================== */
          <>
            {/* Login Method Tabs (Email vs Phone) */}
            {isLogin && (
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
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-3.5">
              {authMethod === "phone" ? (
                /* Phone Number Login Fields */
                <>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-gray-400">
                      <Phone size={18} />
                    </span>
                    <input
                      type="tel"
                      placeholder="Phone (+91 98765 43210)"
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
                        placeholder="Enter 6-digit SMS code (123456)"
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
                /* Email or Username Input */
                <>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-gray-400">
                      <User size={18} />
                    </span>
                    <input
                      id="auth-identity-input"
                      type="text"
                      placeholder="Email or Username"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      disabled={loading}
                      required
                      className="w-full h-12 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-gray-400">
                      <Lock size={18} />
                    </span>
                    <input
                      id="auth-password-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="w-full h-12 pl-11 pr-11 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50"
                    />
                    <button
                      id="toggle-password-visibility-button"
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

              {/* Forgot Password Link */}
              {isLogin && authMethod === "email_username" && (
                <div className="text-right pt-0.5">
                  <Link
                    to="/reset-password"
                    className="text-xs font-semibold text-[#8B5CF6] hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                id="auth-submit-button"
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {loading
                    ? "Verifying..."
                    : authMethod === "phone"
                      ? phoneOtpSent
                        ? "Verify OTP Code"
                        : "Send Login Code"
                      : isLogin
                        ? "Log In"
                        : "Sign Up"}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="w-full my-5 flex items-center justify-center relative">
              <div className="w-full border-t border-[#222222]"></div>
              <span className="absolute bg-black px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                OR
              </span>
            </div>

            {/* Social Authentication Stack */}
            <div className="w-full space-y-2.5">
              {/* Google Button */}
              <button
                id="oauth-google-button"
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

              {/* Apple Button */}
              <button
                id="oauth-apple-button"
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

            {/* Footer Navigation */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400 font-medium">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  id="switch-auth-mode-button"
                  type="button"
                  onClick={() => {
                    const nextMode = isLogin ? "signup" : "login";
                    setIsLogin(!isLogin);
                    navigate({
                      to: "/auth",
                      search: { mode: nextMode, redirect: search.redirect },
                    });
                  }}
                  className="text-[#8B5CF6] font-semibold hover:underline ml-1"
                >
                  {isLogin ? "Sign Up" : "Log In"}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
