import React, { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { evaluatePasswordStrength, type PasswordEvaluation } from "@/lib/account-security";

const signupSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/signup")({
  validateSearch: (search: Record<string, unknown>) => signupSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Create Account — Opexnal" },
      {
        name: "description",
        content: "Join Opexnal to connect with creators and share your story.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  // Form Fields
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // OTP Verification Step
  const [step, setStep] = useState<"details" | "verify_otp" | "welcome">("details");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [awaitingEmailVerification, setAwaitingEmailVerification] = useState(false);

  // Evaluation & Validation states
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">(
    "idle",
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordEval: PasswordEvaluation = evaluatePasswordStrength(password, username);

  // Check username availability
  const checkUsername = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_.]/g, "");
    setUsername(clean);
    if (clean.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    setTimeout(() => {
      // Reserved demo check
      if (["admin", "system", "root", "instagram", "meta"].includes(clean)) {
        setUsernameStatus("taken");
      } else {
        setUsernameStatus("available");
      }
    }, 250);
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const contact = emailOrPhone.trim();
    if (!contact) {
      setErrorMessage("Please enter an email address or mobile phone.");
      return;
    }
    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!username.trim() || username.length < 3) {
      setErrorMessage("Username must be at least 3 characters.");
      return;
    }
    if (usernameStatus === "taken") {
      setErrorMessage("This username is already taken. Please choose another.");
      return;
    }
    if (!birthday) {
      setErrorMessage("Please enter your birthday for age verification (13+).");
      return;
    }

    // Age verification: calculate 13+ years
    const birthDate = new Date(birthday);
    const ageDiffMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age < 13) {
      setErrorMessage("You must be at least 13 years old to create an Opexnal account.");
      return;
    }

    if (!passwordEval.isValid) {
      setErrorMessage(passwordEval.errors[0] || "Password does not meet security requirements.");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("You must agree to Opexnal's Terms of Service and Privacy Policy.");
      return;
    }

    // Independent API signup currently accepts email/password. Email verification delivery is not wired yet.
    if (!contact.includes("@")) {
      setErrorMessage("Email signup is required for now. Phone verification is not configured yet.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await authClient.signUp({
        email: contact,
        password,
        options: {
          data: { username: username.trim(), full_name: fullName.trim() },
        },
      });
      if (error || !data?.user) {
        setErrorMessage(error?.message || "Account registration failed.");
        return;
      }

      if (data.session) {
        setAwaitingEmailVerification(false);
        setStep("welcome");
        toast.success("Account created successfully.");
      } else {
        setAwaitingEmailVerification(true);
        setStep("welcome");
        toast.info("Account created. Email verification delivery is not configured yet.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!otpCode.trim()) {
      setErrorMessage("Please enter the verification code.");
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP code
      const verifyRes = await fetch("/api/auth/phone/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailOrPhone.trim(), code: otpCode.trim() }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setErrorMessage(verifyData.error || "Invalid verification code");
        setLoading(false);
        return;
      }

      // 2. Create user in authClient
      const email = emailOrPhone.includes("@") ? emailOrPhone.trim() : `${username}@opexnal.local`;
      const { data, error } = await authClient.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        toast.error(error.message);
        return;
      }

      setStep("welcome");
      toast.success("Account created successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Back button */}
      <div className="mb-4">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">
          {step === "welcome"
            ? "Welcome to Opexnal! 🎉"
            : step === "verify_otp"
              ? "Verify Contact"
              : "Create Your Account"}
        </h2>
        <p className="text-xs text-gray-400 font-medium">
          {step === "welcome"
            ? awaitingEmailVerification
              ? "Account created, but email verification delivery is not configured yet. Please do not treat this account as verified."
              : "Your account is active. Start sharing and connecting."
            : step === "verify_otp"
              ? `We sent a 6-digit confirmation code to ${emailOrPhone}`
              : "Join millions sharing stories, reels and creative ideas"}
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

      {/* STEP 1: ACCOUNT DETAILS */}
      {step === "details" && (
        <form onSubmit={handleInitialSubmit} className="w-full space-y-3">
          {/* Email or Phone */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">
              <Mail size={18} />
            </span>
            <input
              type="text"
              placeholder="Email or Mobile Phone"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              disabled={loading}
              required
              className="w-full h-11 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50"
            />
          </div>

          {/* Full Name */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">
              <User size={18} />
            </span>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              required
              className="w-full h-11 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50"
            />
          </div>

          {/* Username & Availability Check */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400 text-sm font-semibold">@</span>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => checkUsername(e.target.value)}
              disabled={loading}
              required
              className="w-full h-11 pl-9 pr-10 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50"
            />
            <div className="absolute right-3">
              {usernameStatus === "checking" && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              )}
              {usernameStatus === "available" && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              {usernameStatus === "taken" && <XCircle className="w-4 h-4 text-rose-400" />}
            </div>
          </div>
          {usernameStatus === "available" && (
            <p className="text-[11px] text-emerald-400 pl-1 font-medium">
              @{username} is available!
            </p>
          )}
          {usernameStatus === "taken" && (
            <p className="text-[11px] text-rose-400 pl-1 font-medium">
              @{username} is already taken.
            </p>
          )}

          {/* Birthday / Age verification */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">
              <Calendar size={18} />
            </span>
            <input
              type="date"
              placeholder="Birthday"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              disabled={loading}
              required
              className="w-full h-11 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50"
            />
          </div>
          <p className="text-[10px] text-gray-400 pl-1">
            Birthday is required for age compliance (13+) and will not be shown publicly without
            your permission.
          </p>

          {/* Password with Strength Indicator */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">
              <Lock size={18} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full h-11 pl-11 pr-11 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50"
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

          {/* Password Strength Meter */}
          {password.length > 0 && (
            <div className="space-y-1.5 p-2.5 bg-[#121212] border border-[#222222] rounded-xl">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400">Password Strength:</span>
                <span
                  className={`font-semibold ${
                    passwordEval.score >= 80
                      ? "text-emerald-400"
                      : passwordEval.score >= 50
                        ? "text-amber-400"
                        : "text-rose-400"
                  }`}
                >
                  {passwordEval.label} ({passwordEval.score}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#262626] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordEval.score >= 80
                      ? "bg-emerald-500"
                      : passwordEval.score >= 50
                        ? "bg-amber-500"
                        : "bg-rose-500"
                  }`}
                  style={{ width: `${passwordEval.score}%` }}
                />
              </div>
              {passwordEval.errors.length > 0 && (
                <p className="text-[10px] text-rose-400">{passwordEval.errors[0]}</p>
              )}
            </div>
          )}

          {/* Terms acceptance */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="agree-terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#333] text-[#8B5CF6] focus:ring-[#8B5CF6] accent-[#8B5CF6]"
            />
            <label htmlFor="agree-terms" className="text-[11px] text-gray-400 leading-tight">
              I agree to Opexnal's{" "}
              <Link to="/help" className="text-[#8B5CF6] hover:underline">
                Terms of Service
              </Link>
              ,{" "}
              <Link to="/help" className="text-[#8B5CF6] hover:underline">
                Privacy Policy
              </Link>{" "}
              and confirm I am 13 years of age or older.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-3 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Continue to Verification</span>
          </button>
        </form>
      )}

      {/* STEP 2: OTP VERIFICATION */}
      {step === "verify_otp" && (
        <form onSubmit={handleVerifyAndCreate} className="w-full space-y-4">
          <div className="p-3 bg-[#121212] border border-[#262626] rounded-xl text-xs space-y-1">
            <span className="text-[#8B5CF6] font-semibold flex items-center gap-1.5">
              <KeyRound className="h-4 w-4" /> Code Sent
            </span>
            <p className="text-gray-400 text-[11px]">
              Enter the 6-digit verification code sent to{" "}
              <strong className="text-white">{emailOrPhone}</strong>.
            </p>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">
              <KeyRound size={18} />
            </span>
            <input
              type="text"
              placeholder="6-digit code (e.g. 123456)"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              disabled={loading}
              autoFocus
              required
              className="w-full h-12 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition font-mono tracking-widest text-center"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Complete Registration</span>
          </button>

          <button
            type="button"
            onClick={() => setStep("details")}
            className="w-full text-center text-xs text-gray-400 hover:text-white"
          >
            Change email / phone number
          </button>
        </form>
      )}

      {/* STEP 3: WELCOME FLOW */}
      {step === "welcome" && (
        <div className="w-full space-y-5 text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Welcome, {fullName}!</h3>
            <p className="text-xs text-gray-400 mt-1">
              Your profile @{username} is all set up. Get ready to explore creator communities and
              share moments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate({ to: search.redirect || "/home", replace: true })}
            className="w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white font-semibold text-sm rounded-xl transition shadow-lg"
          >
            Go to Your Feed
          </button>
        </div>
      )}

      {step === "details" && (
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 font-medium">
            Already have an account?{" "}
            <Link
              to="/auth/login"
              search={{ redirect: search.redirect }}
              className="text-[#8B5CF6] font-semibold hover:underline ml-1"
            >
              Log In
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
