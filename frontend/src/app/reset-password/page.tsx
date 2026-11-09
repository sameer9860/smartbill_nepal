"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RotateCw,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";

import { AuthPageShell } from "@/components/AuthPageShell";
import { ApiError, authApi } from "@/lib/api";

type ResetStep = "otp" | "password" | "success";

const passwordRules = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "An uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "A lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "A number", test: (value: string) => /\d/.test(value) },
  {
    label: "A special character",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
];

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [step, setStep] = useState<ResetStep>("otp");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);
  const [resendMessage, setResendMessage] = useState("");
  const [error, setError] = useState("");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (step === "otp") inputRefs.current[0]?.focus();
  }, [step]);

  useEffect(() => {
    if (step !== "otp" || resendSeconds <= 0) return;
    const timer = window.setTimeout(
      () => setResendSeconds((seconds) => seconds - 1),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [resendSeconds, step]);

  function updateOtpInput(index: number, value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length > 1) {
      const nextDigits = Array(6).fill("");
      digits.slice(0, 6).split("").forEach((digit, digitIndex) => {
        nextDigits[digitIndex] = digit;
      });
      setOtpDigits(nextDigits);
      inputRefs.current[Math.min(digits.length, 6) - 1]?.focus();
      return;
    }

    const nextDigits = [...otpDigits];
    nextDigits[index] = digits;
    setOtpDigits(nextDigits);
    if (digits && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleOtpPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pastedDigits) return;

    event.preventDefault();
    const nextDigits = Array(6).fill("");
    pastedDigits.split("").forEach((digit, index) => {
      nextDigits[index] = digit;
    });
    setOtpDigits(nextDigits);
    inputRefs.current[Math.min(pastedDigits.length, 6) - 1]?.focus();
  }

  function handleOtpKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault();
    setError("");
    setResendMessage("");

    const cleanEmail = email.trim();
    const otp = otpDigits.join("");
    if (!cleanEmail) {
      setError("Email address is required.");
      return;
    }
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await authApi.verifyOtp({ email: cleanEmail, otp });
      setResetToken(result.reset_token);
      setStep("password");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not verify the code. Please try again."
      );
      setOtpDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendCode() {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please return to the forgot password page and enter your email.");
      return;
    }

    setResending(true);
    setError("");
    setResendMessage("");
    try {
      await authApi.forgotPassword(cleanEmail);
      setOtpDigits(Array(6).fill(""));
      setResendSeconds(60);
      setResendMessage("If an account exists, a new verification code has been sent.");
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to resend the code."
      );
    } finally {
      setResending(false);
    }
  }

  async function handleStartOver() {
    setError("");
    setResendMessage("");
    setResending(true);
    try {
      await authApi.forgotPassword(email.trim());
      setResetToken("");
      setOtpDigits(Array(6).fill(""));
      setPassword("");
      setConfirmPassword("");
      setResendSeconds(60);
      setResendMessage("If an account exists, a new verification code has been sent.");
      setStep("otp");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to request a new code."
      );
    } finally {
      setResending(false);
    }
  }

  async function handleSetPassword(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!passwordRules.every((rule) => rule.test(password))) {
      setError("Please meet all password requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        reset_token: resetToken,
        new_password: password,
        new_password2: confirmPassword,
      });
      setResetToken("");
      setStep("success");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not reset the password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/80 bg-white/95 px-8 py-10 shadow-xl shadow-slate-900/10 backdrop-blur-sm">
      <div className="flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.ico" alt="SmartBill Nepal" className="h-8 w-8 object-contain" />
        </div>
      </div>

      {step === "success" ? (
        <div className="mt-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Password reset!
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Your password has been changed successfully. You can now sign in with your new password.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-block w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-700 shadow-md"
            >
              Sign in now
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {step === "otp" ? "Verify your email" : "Set a new password"}
            </h1>
            <p className="mt-1 text-sm font-medium text-blue-500">
              {step === "otp"
                ? `Enter the 6-digit code sent to ${email || "your email"}`
                : "Choose a strong password for your account"}
            </p>
          </div>

          {resendMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{resendMessage}</span>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {step === "otp" ? (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
              {!email && (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email address"
                    autoComplete="email"
                    required
                    className="w-full bg-transparent py-4 text-sm text-slate-900 outline-none"
                  />
                </div>
              )}

              <div className="flex justify-center gap-2 sm:gap-3">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[index] = element;
                    }}
                    aria-label={`Verification code digit ${index + 1}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => updateOtpInput(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={handleOtpPaste}
                    className="h-12 w-10 rounded-xl border border-slate-200 bg-white text-center text-lg font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:h-14 sm:w-12"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs">
                <Link
                  href="/forgot-password"
                  className="font-semibold text-slate-600 transition hover:text-slate-900"
                >
                  Change email
                </Link>
                <button
                  type="button"
                  disabled={resending || resendSeconds > 0}
                  onClick={handleResendCode}
                  className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
                  {resending
                    ? "Sending…"
                    : resendSeconds > 0
                      ? `Resend in ${resendSeconds}s`
                      : "Resend code"}
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting || otpDigits.some((digit) => !digit)}
                className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
              >
                {submitting ? "Verifying code…" : "Verify code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSetPassword} className="mt-6 space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-slate-400">
                <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="New password"
                  autoComplete="new-password"
                  required
                  className="w-full bg-transparent py-4 text-sm text-slate-900 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="shrink-0 text-slate-400 transition hover:text-slate-600"
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4 text-blue-600" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-slate-400">
                <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                  className="w-full bg-transparent py-4 text-sm text-slate-900 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="shrink-0 text-slate-400 transition hover:text-slate-600"
                >
                  {showConfirmPassword ? (
                    <Eye className="h-4 w-4 text-blue-600" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              </div>

              <ul className="space-y-1 px-1 text-xs">
                {passwordRules.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <li
                      key={rule.label}
                      className={passed ? "text-emerald-700" : "text-slate-500"}
                    >
                      {passed ? "✓" : "•"} {rule.label}
                    </li>
                  );
                })}
                {confirmPassword && (
                  <li
                    className={
                      password === confirmPassword
                        ? "text-emerald-700"
                        : "text-red-600"
                    }
                  >
                    {password === confirmPassword ? "✓" : "•"} Passwords match
                  </li>
                )}
              </ul>

              <button
                type="submit"
                disabled={
                  submitting ||
                  !passwordRules.every((rule) => rule.test(password)) ||
                  password !== confirmPassword
                }
                className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
              >
                {submitting ? "Resetting password…" : "Reset password"}
              </button>

              <button
                type="button"
                disabled={resending}
                onClick={handleStartOver}
                className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-60"
              >
                {resending ? "Requesting a new code…" : "Start over with a new code"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthPageShell>
      <Suspense
        fallback={
          <div className="rounded-3xl border border-white/80 bg-white/95 px-8 py-10 text-center shadow-xl shadow-slate-900/10 backdrop-blur-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="mt-4 text-xs font-medium text-slate-500">Loading…</p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthPageShell>
  );
}
