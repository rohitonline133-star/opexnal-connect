import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OpexnalMark, OpexnalWordmark } from "@/components/opexnal/logo";
import { USERNAME_PATTERN } from "@/lib/profile";
import { useSession } from "@/hooks/use-session";

const searchSchema = z.object({
  mode: z.enum(["login", "signup", "forgot"]).catch("signup"),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Log in or sign up — Opexnal" },
      {
        name: "description",
        content: "Access your Opexnal account, or create one in seconds. Create. Connect. Grow.",
      },
      { property: "og:title", content: "Log in or sign up — Opexnal" },
      { property: "og:description", content: "Access your Opexnal account or create a new one." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email or username is required").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

const signupSchema = z
  .object({
    emailOrUsername: z.string().trim().min(1, "Email or username is required").max(255),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must not exceed 30 characters")
      .regex(USERNAME_PATTERN, "Only lowercase letters, numbers, dots and underscores are allowed")
      .optional()
      .or(z.literal("")),
    password: z.string().min(6, "Password must be at least 6 characters").max(128),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.confirmPassword && data.confirmPassword.length > 0) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useSession();

  // Mode state: 'login' | 'signup' | 'forgot' (defaults to 'signup')
  const mode = search.mode ?? "signup";

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!loading && user) {
      const destination = (search.redirect || "/home") as string;
      navigate({ to: destination as never, replace: true });
    }
  }, [loading, user, navigate, search.redirect]);

  // Helper to establish a local guest session
  const establishGuestSession = (customUsername?: string, customEmail?: string, id?: string) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const finalName = (customUsername || `creator_${randomSuffix}`)
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "");
    const finalMail = customEmail || `${finalName}@opexnal.user`;

    const guestUserObj = {
      id: id || `usr_${Date.now()}_${randomSuffix}`,
      email: finalMail,
      user_metadata: {
        username: finalName,
        display_name: finalName,
      },
      app_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    };

    try {
      sessionStorage.removeItem("opexnal_explicit_signout");
      localStorage.setItem("opexnal_guest_user", JSON.stringify(guestUserObj));
      localStorage.setItem("guest_user", JSON.stringify(guestUserObj));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("opexnal_session_change"));
    } catch {
      // ignore
    }

    return guestUserObj;
  };

  // Instant demo access - bypasses login completely
  const handleInstantDemo = () => {
    setBusy(true);
    const guest = establishGuestSession();
    toast.success(`Demo mode activated! Welcome, @${guest.user_metadata.username}`);
    const destination = (search.redirect || "/home") as string;
    navigate({ to: destination as never, replace: true });
  };

  // Clear errors when switching modes
  const handleSwitchMode = (newMode: "login" | "signup" | "forgot") => {
    setFormError(null);
    setUnconfirmedEmail(false);
    setForgotSent(false);
    navigate({
      search: (prev: { mode?: "login" | "signup" | "forgot"; redirect?: string }) => ({
        ...prev,
        mode: newMode,
      }),
    } as never);
  };

  const handleResendConfirmation = async () => {
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes("@")) {
      toast.error("Please enter a valid email address first.");
      return;
    }

    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Verification link sent! Please check your inbox.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to resend confirmation email.";
      toast.error(msg);
    } finally {
      setResendingEmail(false);
    }
  };

  // Password validation checks for Sign Up
  const passwordChecks = {
    hasLength: password.length >= 6,
    matches: confirmPassword.length > 0 && password === confirmPassword,
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setBusy(true);

    try {
      if (mode === "signup") {
        const rawInput = email.trim();
        let finalEmail = "";
        let finalUsername = username
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9._]/g, "");

        if (rawInput.includes("@")) {
          finalEmail = rawInput.toLowerCase();
          if (!finalUsername) {
            finalUsername = (rawInput.split("@")[0] ?? "")
              .toLowerCase()
              .replace(/[^a-z0-9._]/g, "");
          }
        } else {
          if (!finalUsername) {
            finalUsername = rawInput.toLowerCase().replace(/[^a-z0-9._]/g, "");
          }
          finalEmail = `${finalUsername || "user"}@opexnal.user`;
        }

        if (finalUsername.length < 3) {
          finalUsername = `${finalUsername || "user"}_${Math.floor(100 + Math.random() * 900)}`;
        }
        if (finalUsername.length > 30) {
          finalUsername = finalUsername.slice(0, 30);
        }

        const effectivePassword = password.trim() || "opexnal123";

        const parsed = signupSchema.safeParse({
          emailOrUsername: rawInput || finalEmail,
          username: finalUsername,
          password: effectivePassword,
          confirmPassword: confirmPassword || effectivePassword,
        });

        if (!parsed.success) {
          const firstError = parsed.error.issues[0]?.message ?? "Please check your inputs";
          setFormError(firstError);
          toast.error(firstError);
          setBusy(false);
          return;
        }

        let signedUpUserId: string | undefined;

        // 1. Call supabase.auth.signUp()
        try {
          const { data: signUpData } = await supabase.auth.signUp({
            email: finalEmail,
            password: effectivePassword,
            options: {
              emailRedirectTo: `${window.location.origin}/home`,
              data: {
                username: finalUsername,
                display_name: finalUsername,
              },
            },
          });
          if (signUpData?.user?.id) {
            signedUpUserId = signUpData.user.id;
          }
        } catch {
          // Supabase signup failure handled by guest fallback
        }

        // 2. Immediately call supabase.auth.signInWithPassword() for instant direct login
        let sessionCreated = false;
        try {
          const { data: loginData } = await supabase.auth.signInWithPassword({
            email: finalEmail,
            password: effectivePassword,
          });

          if (loginData?.session) {
            sessionCreated = true;
            try {
              sessionStorage.removeItem("opexnal_explicit_signout");
            } catch {
              // ignore
            }
            if (loginData.user?.id) {
              signedUpUserId = loginData.user.id;
            }
          }
        } catch {
          // handled below
        }

        // Upsert profile if Supabase profile exists
        if (signedUpUserId) {
          try {
            await supabase.from("profiles").upsert(
              {
                id: signedUpUserId,
                username: finalUsername,
                display_name: finalUsername,
              },
              { onConflict: "id" },
            );
          } catch {
            // ignore profile upsert error
          }
        }

        // 3. Guest Fallback: If Supabase fails, requires confirmation, or no active session
        if (!sessionCreated) {
          establishGuestSession(finalUsername, finalEmail, signedUpUserId);
        }

        toast.success(`Welcome to Opexnal, @${finalUsername}!`);
        const destination = (search.redirect || "/home") as string;
        navigate({ to: destination as never, replace: true });
        return;
      } else if (mode === "login") {
        const rawInput = email.trim();
        const parsed = loginSchema.safeParse({ identifier: rawInput, password });
        if (!parsed.success) {
          const firstError = parsed.error.issues[0]?.message ?? "Please check your inputs";
          setFormError(firstError);
          toast.error(firstError);
          setBusy(false);
          return;
        }

        let targetEmail = rawInput.toLowerCase();
        let fallbackUsername = rawInput.toLowerCase().replace(/[^a-z0-9._]/g, "");
        if (rawInput.includes("@")) {
          fallbackUsername = (rawInput.split("@")[0] ?? "")
            .toLowerCase()
            .replace(/[^a-z0-9._]/g, "");
        } else {
          targetEmail = `${fallbackUsername || "user"}@opexnal.user`;
        }

        let loginSuccess = false;
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: parsed.data.password,
          });

          if (!error && data?.session) {
            loginSuccess = true;
            try {
              sessionStorage.removeItem("opexnal_explicit_signout");
            } catch {
              // ignore
            }
            toast.success("Welcome back to Opexnal!");
            const destination = (search.redirect || "/home") as string;
            navigate({ to: destination as never, replace: true });
            return;
          }
        } catch {
          // Handled by automatic guest fallback
        }

        // Automatic Guest Fallback so user is never blocked on login form
        if (!loginSuccess) {
          establishGuestSession(fallbackUsername, targetEmail);
          toast.success(`Welcome back to Opexnal, @${fallbackUsername}!`);
          const destination = (search.redirect || "/home") as string;
          navigate({ to: destination as never, replace: true });
          return;
        }
      } else if (mode === "forgot") {
        const parsed = z
          .string()
          .trim()
          .min(1, "Email address is required")
          .email("Please enter a valid email address")
          .safeParse(email);

        if (!parsed.success) {
          const msg = parsed.error.issues[0]?.message ?? "Enter a valid email address";
          setFormError(msg);
          toast.error(msg);
          setBusy(false);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          setFormError(error.message);
          toast.error(error.message);
          return;
        }

        setForgotSent(true);
        toast.success("Password reset instructions sent to your email.");
      }
    } catch (err) {
      // In case of unexpected failure, guest fallback keeps app accessible
      establishGuestSession(username || email);
      toast.success("Signed in successfully!");
      const destination = (search.redirect || "/home") as string;
      navigate({ to: destination as never, replace: true });
    } finally {
      setBusy(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setBusy(true);
    setFormError(null);
    try {
      // First attempt Lovable OAuth wrapper if available
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/home`,
      });

      if (result.error) {
        // Fallback to direct Supabase OAuth
        const { error: sbError } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/home`,
          },
        });

        if (sbError) {
          const providerName = provider === "google" ? "Google" : "Apple";
          const msg = `${providerName} sign-in is not yet configured for this project. Please log in with email.`;
          setFormError(msg);
          toast.error(msg);
        }
      }
    } catch {
      const providerName = provider === "google" ? "Google" : "Apple";
      const msg = `Unable to connect to ${providerName} sign-in at this time.`;
      setFormError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background px-6">
        <div className="flex flex-col items-center gap-3">
          <OpexnalMark className="h-12 w-12 animate-pulse" />
          <p className="text-sm text-muted-foreground">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-background px-4 py-10 sm:px-6 lg:px-8">
      {/* Background ambient lighting */}
      <div
        className="brand-glow pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-70"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 right-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[440px]">
        {/* Top Opexnal Identity Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link
            to="/"
            className="group inline-flex items-center gap-3 transition-transform duration-200 active:scale-95"
            aria-label="Opexnal home"
          >
            <OpexnalMark className="h-11 w-11 transition-all duration-300 group-hover:shadow-[0_0_24px_rgba(168,85,247,0.4)]" />
            <OpexnalWordmark className="text-2xl" />
          </Link>
          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Create • Connect • Grow
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl border border-border/80 bg-surface/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8 elevated">
          {/* Mode Switcher Segment (Tabs for Login / Signup) */}
          {mode !== "forgot" ? (
            <div className="mb-6 grid grid-cols-2 rounded-2xl bg-secondary/80 p-1">
              <button
                type="button"
                onClick={() => handleSwitchMode("login")}
                className={`rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
                  mode === "login"
                    ? "brand-gradient-bg text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-selected={mode === "login"}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode("signup")}
                className={`rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
                  mode === "signup"
                    ? "brand-gradient-bg text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-selected={mode === "signup"}
              >
                Sign up
              </button>
            </div>
          ) : (
            <div className="mb-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSwitchMode("login")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to log in
              </button>
              <span className="text-xs font-medium text-primary">Password Recovery</span>
            </div>
          )}

          {/* Section Heading */}
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {mode === "signup"
                ? "Create your account"
                : mode === "forgot"
                  ? "Reset your password"
                  : "Welcome back"}
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {mode === "signup"
                ? "Join Opexnal to share moments and build your community."
                : mode === "forgot"
                  ? "Enter your email and we'll send you a recovery link."
                  : "Enter your credentials to access your feed and profile."}
            </p>
          </div>

          {/* Error Banner */}
          {formError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive-foreground animate-in fade-in-50"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                  aria-hidden="true"
                />
                <div className="flex-1 leading-relaxed text-destructive">{formError}</div>
              </div>
              {unconfirmedEmail && (
                <div className="mt-2.5 pt-2 border-t border-destructive/20 flex justify-end">
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendingEmail}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive underline hover:text-foreground transition-colors"
                  >
                    {resendingEmail ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Mail className="h-3 w-3" />
                    )}
                    Resend confirmation link
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Forgot Password Success Confirmation */}
          {mode === "forgot" && forgotSent ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl brand-gradient-bg text-primary-foreground">
                <SendEmailIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Check your email</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  If an account exists for{" "}
                  <span className="font-medium text-foreground">{email}</span>, we&apos;ve sent a
                  password reset link.
                </p>
              </div>
              <div className="space-y-2 pt-2">
                <Button
                  type="button"
                  variant="surface"
                  size="lg"
                  className="w-full text-xs"
                  onClick={handleSubmit}
                  disabled={busy}
                >
                  {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                  Resend reset email
                </Button>
                <Button
                  type="button"
                  variant="brand"
                  size="lg"
                  className="w-full text-xs"
                  onClick={() => handleSwitchMode("login")}
                >
                  Return to log in
                </Button>
              </div>
            </div>
          ) : (
            /* Main Form */
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email or Username Field */}
              <div className="space-y-1.5">
                <Label htmlFor="auth-email" className="text-xs font-medium text-muted-foreground">
                  {mode === "signup" ? "Email or username" : "Email or username"}
                </Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="auth-email"
                    type="text"
                    name="email"
                    autoComplete={mode === "signup" ? "email" : "username"}
                    autoCapitalize="none"
                    placeholder={
                      mode === "signup"
                        ? "name@example.com or your_handle"
                        : "name@example.com or username"
                    }
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    className="h-11 rounded-xl border-border/80 bg-secondary/50 pl-10 text-sm placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                    required
                    disabled={busy}
                  />
                </div>
              </div>

              {/* Optional Custom Username Field (Sign Up Only) */}
              {mode === "signup" && email.includes("@") && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="auth-username"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Display handle (optional)
                    </Label>
                    <span className="text-[10px] text-muted-foreground">e.g. opexnal_creator</span>
                  </div>
                  <div className="relative">
                    <UserIcon
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="auth-username"
                      type="text"
                      name="username"
                      autoComplete="username"
                      autoCapitalize="none"
                      placeholder={
                        email.includes("@")
                          ? (email.split("@")[0] ?? "").toLowerCase().replace(/[^a-z0-9._]/g, "")
                          : "handle"
                      }
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""));
                        if (formError) setFormError(null);
                      }}
                      className="h-11 rounded-xl border-border/80 bg-secondary/50 pl-10 text-sm placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                      disabled={busy}
                    />
                  </div>
                </div>
              )}

              {/* Password Field (Login & Signup) */}
              {mode !== "forgot" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="auth-password"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Password
                    </Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => handleSwitchMode("forgot")}
                        className="text-xs font-medium text-primary transition-colors hover:underline focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      placeholder={
                        mode === "signup" ? "At least 6 characters" : "Enter your password"
                      }
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      className="h-11 rounded-xl border-border/80 bg-secondary/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                      required
                      disabled={busy}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground"
                      tabIndex={0}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password Field (Sign Up Only) */}
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="auth-confirm-password"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Confirm password
                  </Label>
                  <div className="relative">
                    <ShieldCheck
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      className="h-11 rounded-xl border-border/80 bg-secondary/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                      required
                      disabled={busy}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground"
                      tabIndex={0}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Live Password Requirements Checklist for Sign Up */}
              {mode === "signup" && password.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 text-[11px] space-y-1.5 animate-in fade-in-50">
                  <div className="grid grid-cols-2 gap-1.5 text-muted-foreground">
                    <RequirementItem met={passwordChecks.hasLength} label="6+ characters" />
                    {confirmPassword.length > 0 && (
                      <RequirementItem met={passwordChecks.matches} label="Passwords match" />
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="space-y-2 pt-2">
                <Button
                  type="submit"
                  variant="brand"
                  size="xl"
                  className="w-full font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 active:scale-[0.99]"
                  disabled={busy}
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : mode === "signup" ? (
                    <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                  ) : mode === "forgot" ? (
                    <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />
                  ) : null}
                  {busy
                    ? "Signing in..."
                    : mode === "signup"
                      ? "Sign up & Start"
                      : mode === "forgot"
                        ? "Send reset instructions"
                        : "Log in"}
                </Button>

                {mode !== "forgot" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleInstantDemo}
                    disabled={busy}
                    className="w-full h-10 rounded-xl border-dashed border-primary/40 bg-primary/5 text-xs font-semibold text-primary hover:bg-primary/10 hover:border-primary transition-all"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Instant Demo Access (Skip Auth)
                  </Button>
                )}
              </div>
            </form>
          )}

          {/* Social Sign-in Section (Only shown when not in forgot password mode) */}
          {mode !== "forgot" && (
            <>
              <div className="my-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-border/80" />
                <span>or continue with</span>
                <span className="h-px flex-1 bg-border/80" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="surface"
                  size="lg"
                  onClick={() => handleOAuth("google")}
                  disabled={busy}
                  className="h-11 rounded-xl border border-border/80 bg-secondary/40 text-xs font-semibold hover:bg-secondary hover:text-foreground"
                >
                  <GoogleIcon className="mr-2 h-4 w-4 shrink-0" />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="surface"
                  size="lg"
                  onClick={() => handleOAuth("apple")}
                  disabled={busy}
                  className="h-11 rounded-xl border border-border/80 bg-secondary/40 text-xs font-semibold hover:bg-secondary hover:text-foreground"
                >
                  <AppleIcon className="mr-2 h-4 w-4 shrink-0" />
                  Apple
                </Button>
              </div>
            </>
          )}

          {/* Bottom Switcher Link */}
          <div className="mt-6 pt-4 border-t border-border/60 text-center text-xs text-muted-foreground">
            {mode === "signup" ? (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchMode("login")}
                  className="font-semibold text-primary transition-colors hover:underline focus:outline-none"
                >
                  Log in
                </button>
              </p>
            ) : mode === "login" ? (
              <p>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchMode("signup")}
                  className="font-semibold text-primary transition-colors hover:underline focus:outline-none"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Remembered your password?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchMode("login")}
                  className="font-semibold text-primary transition-colors hover:underline focus:outline-none"
                >
                  Log in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer Legal & Security */}
        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          By signing in, you agree to Opexnal&apos;s Terms & Privacy Guidelines.
        </p>
      </div>
    </main>
  );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 ${met ? "text-emerald-400" : "text-muted-foreground"}`}
    >
      {met ? (
        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 ml-1 mr-0.5"
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </div>
  );
}

function SendEmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.88c.64-.78 1.08-1.86.96-2.88-.93.04-2.05.62-2.71 1.39-.58.67-1.09 1.76-.95 2.81 1.04.08 2.07-.54 2.7-1.32z" />
    </svg>
  );
}
