import React, { useRef, useState } from "react";
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
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { apiUrl } from "@/lib/api-client";
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
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Signup and email-verification status
  const [step, setStep] = useState<"details" | "welcome">("details");

  // Evaluation & Validation states
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">(
    "idle",
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const usernameCheckSequence = useRef(0);

  const passwordEval: PasswordEvaluation = evaluatePasswordStrength(password, username);

  // Check username availability against the first-party database.
  const checkUsername = async (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_.]/g, "");
    setUsername(clean);
    const sequence = ++usernameCheckSequence.current;
    if (clean.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    try {
      const response = await fetch(
        apiUrl(`/api/v1/auth/username-availability?username=${encodeURIComponent(clean)}`),
        { cache: "no-store" },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        available?: boolean;
        error?: string;
      };
      if (sequence !== usernameCheckSequence.current) return;
      if (!response.ok) {
        setUsernameStatus("idle");
        setErrorMessage(payload.error || "Username availability could not be verified.");
        return;
      }
      setUsernameStatus(payload.available ? "available" : "taken");
    } catch {
      if (sequence === usernameCheckSequence.current) {
        setUsernameStatus("idle");
        setErrorMessage(
          "Could not check username availability. The server will validate it during signup.",
        );
      }
    }
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const contact = email.trim().toLowerCase();
    if (!contact || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      setErrorMessage("Please enter a valid email address.");
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
    if (usernameStatus !== "available") {
      setErrorMessage(
        usernameStatus === "taken"
          ? "This username is already taken. Please choose another."
          : "Wait for the username availability check to finish before creating your account.",
      );
      return;
    }
    if (!birthday) {
      setErrorMessage("Please enter your birthday for age verification (13+).");
      return;
    }

    // Age verification: compare calendar dates to avoid millisecond/year-boundary errors.
    const birthParts = birthday.split("-");
    if (birthParts.length !== 3) {
      setErrorMessage("Please enter a valid date of birth.");
      return;
    }

    const birthYear = Number(birthParts[0]);
    const birthMonth = Number(birthParts[1]);
    const birthDay = Number(birthParts[2]);
    const birthDate = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay));
    const isValidBirthDate =
      Number.isInteger(birthYear) &&
      Number.isInteger(birthMonth) &&
      Number.isInteger(birthDay) &&
      birthMonth >= 1 &&
      birthMonth <= 12 &&
      birthDay >= 1 &&
      birthDate.getUTCFullYear() === birthYear &&
      birthDate.getUTCMonth() === birthMonth - 1 &&
      birthDate.getUTCDate() === birthDay;

    if (!isValidBirthDate) {
      setErrorMessage("Please enter a valid date of birth.");
      return;
    }

    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const birthdayHasNotOccurred =
      today.getMonth() + 1 < birthMonth ||
      (today.getMonth() + 1 === birthMonth && today.getDate() < birthDay);
    if (birthdayHasNotOccurred) age -= 1;

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

    setLoading(true);
    try {
      const { data, error } = await authClient.signUp({
        email: contact,
        password,
        dateOfBirth: birthday,
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
      if (data?.emailVerificationRequired) {
        setStep("welcome");
        toast.success("Account created. Check your email to verify it before signing in.");
        return;
      }
      setErrorMessage("The API did not confirm email verification. Please try again later.");
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
          {step === "welcome" ? "Check your email" : "Create your account"}
        </h2>
        <p className="text-xs text-gray-400 font-medium">
          {step === "welcome"
            ? "Your account was created. Open the verification link sent to your email before signing in."
            : "Create your profile and start connecting with people on Opexnal"}
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
          {/* Email address */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">
              <Mail size={18} />
            </span>
            <input
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="Email address"
              aria-label="Email address"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="w-full h-11 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition disabled:opacity-50"
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
              aria-label="Full name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              required
              className="w-full h-11 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition disabled:opacity-50"
            />
          </div>

          {/* Username & Availability Check */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400 text-sm font-semibold">@</span>
            <input
              type="text"
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Username"
              aria-label="Username"
              autoComplete="username"
              value={username}
              onChange={(e) => checkUsername(e.target.value)}
              disabled={loading}
              required
              className="w-full h-11 pl-9 pr-10 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition disabled:opacity-50"
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
              className="w-full h-11 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition disabled:opacity-50"
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
              aria-label="Create a strong password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full h-11 pl-11 pr-11 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition disabled:opacity-50"
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
              className="mt-0.5 w-4 h-4 rounded border-[#333] text-pink-400 focus:ring-[#8B5CF6] accent-[#8B5CF6]"
            />
            <label htmlFor="agree-terms" className="text-[11px] text-gray-400 leading-tight">
              I agree to Opexnal's{" "}
              <Link to="/help" className="text-pink-400 hover:underline">
                Terms of Service
              </Link>
              ,{" "}
              <Link to="/help" className="text-pink-400 hover:underline">
                Privacy Policy
              </Link>{" "}
              and confirm I am 13 years of age or older.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || usernameStatus === "checking"}
            className="w-full h-11 mt-3 bg-gradient-to-r from-fuchsia-600 via-pink-600 to-orange-500 hover:from-fuchsia-500 hover:via-pink-500 hover:to-orange-400 text-white font-semibold text-sm rounded-xl transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Create Account</span>
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
              Your account is pending email verification. Open the verification link sent to your
              email before signing in.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate({
                to: "/auth/login",
                search: { redirect: search.redirect },
                replace: true,
              })
            }
            className="w-full h-11 bg-gradient-to-r from-fuchsia-600 via-pink-600 to-orange-500 text-white font-semibold text-sm rounded-xl transition shadow-lg"
          >
            Continue to Log In
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
              className="text-pink-400 font-semibold hover:underline ml-1"
            >
              Log In
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
