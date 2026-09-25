import React, { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

function AuthComponent() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(search.mode !== "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLogin(search.mode !== "signup");
    setErrorMessage(null);
  }, [search.mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = emailOrPhone.trim();
    if (!email) {
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
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          toast.error(error.message);
          return;
        }

        if (data?.session) {
          toast.success("Welcome back to Opexnal!");
          const target = search.redirect || "/home";
          navigate({ to: target, replace: true });
        }
      } else {
        if (password.length < 6) {
          setErrorMessage("Password must be at least 6 characters long");
          return;
        }

        const username = email.includes("@") ? email.split("@")[0] : email;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              full_name: username,
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
          const target = search.redirect || "/home";
          navigate({ to: target, replace: true });
        } else if (data?.user && !data?.session) {
          toast.info("Please check your email inbox to confirm your account.");
          setIsLogin(true);
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

      if (result?.redirected) {
        return;
      }

      const { data } = await supabase.auth.getUser();
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
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">
            {isLogin ? "Welcome Back!" : "Create Account"}
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            {isLogin ? "Login to continue" : "Sign up to get started"}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3.5">
          {/* Email or Phone Input */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">
              <User size={18} />
            </span>
            <input
              id="auth-identity-input"
              type="text"
              placeholder="Email or Username"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
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

          {/* Forgot Password Link */}
          {isLogin && (
            <div className="text-right pt-0.5">
              <Link
                to="/reset-password"
                className="text-xs font-semibold text-[#8B5CF6] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          )}

          {/* Primary Gradient Action Button */}
          <button
            id="auth-submit-button"
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>
              {loading
                ? isLogin
                  ? "Logging in..."
                  : "Creating account..."
                : isLogin
                  ? "Log In"
                  : "Sign Up"}
            </span>
          </button>
        </form>

        {/* Divider */}
        <div className="w-full my-6 flex items-center justify-center relative">
          <div className="w-full border-t border-[#222222]"></div>
          <span className="absolute bg-black px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            OR
          </span>
        </div>

        {/* Social Authentication Stack */}
        <div className="w-full space-y-3">
          {/* Google Button */}
          <button
            id="oauth-google-button"
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={oauthLoading !== null || loading}
            className="w-full h-12 bg-white text-black font-semibold text-sm rounded-xl flex items-center justify-center space-x-2.5 hover:bg-gray-100 transition active:scale-[0.99] disabled:opacity-50"
          >
            {oauthLoading === "google" ? (
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            className="w-full h-12 bg-white text-black font-semibold text-sm rounded-xl flex items-center justify-center space-x-2.5 hover:bg-gray-100 transition active:scale-[0.99] disabled:opacity-50"
          >
            {oauthLoading === "apple" ? (
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            ) : (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.54c.63-.78 1.07-1.85.95-2.93-.93.04-2.07.62-2.73 1.39-.59.68-1.11 1.78-.97 2.84 1.05.08 2.12-.52 2.75-1.3" />
              </svg>
            )}
            <span>Continue with Apple</span>
          </button>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 text-center">
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
      </div>
    </div>
  );
}
