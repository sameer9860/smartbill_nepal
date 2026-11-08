"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RotateCw,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

import { AuthPageShell } from "@/components/AuthPageShell";
import { ApiError, authApi } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialOtp = searchParams.get("otp") || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(initialOtp);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialEmail && !email) setEmail(initialEmail);
    if (initialOtp && !otp) setOtp(initialOtp);
  }, [initialEmail, initialOtp, email, otp]);

  async function handleResendCode() {
    if (!email.trim()) {
      setError("Please enter your email to resend the code.");
      return;
    }
    setResending(true);
    setResendMsg("");
    setError("");
    try {
      await authApi.forgotPassword(email.trim());
      setResendMsg("A new 6-digit code has been sent to your email.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to resend code."
      );
    } finally {
      setResending(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResendMsg("");

    const cleanOtp = otp.trim().replace(/\s+/g, "");

    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
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
        otp: cleanOtp,
        new_password: password,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Invalid or expired 6-digit code. Please try again."
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

      {success ? (
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
              Reset password
            </h1>
            <p className="mt-1 text-sm font-medium text-blue-500">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {resendMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{resendMsg}</span>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            {/* Email field */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-slate-400">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="relative flex-1">
                <input
                  id="reset-email"
                  type="email"
                  className="peer w-full bg-transparent pb-1.5 pt-5 text-sm text-slate-900 placeholder-transparent outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  required
                />
                <label
                  htmlFor="reset-email"
                  className="pointer-events-none absolute left-0 top-3.5 text-sm text-slate-400 transition-all duration-200
                    peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400
                    peer-focus:top-1 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-blue-600
                    peer-[&:not(:placeholder-shown)]:top-1 peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold peer-[&:not(:placeholder-shown)]:text-slate-500"
                >
                  Email address
                </label>
              </div>
            </div>

            {/* 6-digit OTP code */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-slate-400">
              <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="relative flex-1">
                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="peer w-full bg-transparent pb-1.5 pt-5 text-base font-bold tracking-widest text-slate-900 placeholder-transparent outline-none"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setOtp(val);
                  }}
                  placeholder="6-digit code"
                  required
                />
                <label
                  htmlFor="reset-otp"
                  className="pointer-events-none absolute left-0 top-3.5 text-sm text-slate-400 transition-all duration-200
                    peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400
                    peer-focus:top-1 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-blue-600
                    peer-[&:not(:placeholder-shown)]:top-1 peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold peer-[&:not(:placeholder-shown)]:text-slate-500"
                >
                  6-digit verification code
                </label>
              </div>
            </div>

            {/* New password */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-slate-400">
              <Lock className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="relative flex-1">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  className="peer w-full bg-transparent pb-1.5 pt-5 text-sm text-slate-900 placeholder-transparent outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <label
                  htmlFor="new-password"
                  className="pointer-events-none absolute left-0 top-3.5 text-sm text-slate-400 transition-all duration-200
                    peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400
                    peer-focus:top-1 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-blue-600
                    peer-[&:not(:placeholder-shown)]:top-1 peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold peer-[&:not(:placeholder-shown)]:text-slate-500"
                >
                  New password (min 8 chars)
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="shrink-0 text-slate-400 transition hover:text-slate-600"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <Eye className="h-4 w-4 text-blue-600" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Confirm password */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-slate-400">
              <Lock className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="relative flex-1">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  className="peer w-full bg-transparent pb-1.5 pt-5 text-sm text-slate-900 placeholder-transparent outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <label
                  htmlFor="confirm-password"
                  className="pointer-events-none absolute left-0 top-3.5 text-sm text-slate-400 transition-all duration-200
                    peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400
                    peer-focus:top-1 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-blue-600
                    peer-[&:not(:placeholder-shown)]:top-1 peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold peer-[&:not(:placeholder-shown)]:text-slate-500"
                >
                  Confirm new password
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="shrink-0 text-slate-400 transition hover:text-slate-600"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <Eye className="h-4 w-4 text-blue-600" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={resending}
                onClick={handleResendCode}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-60"
              >
                <RotateCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
                {resending ? "Sending code…" : "Resend 6-digit code"}
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-60 shadow-md"
            >
              {submitting ? "Resetting password…" : "Reset password"}
            </button>
          </form>

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
          <div className="rounded-3xl border border-white/80 bg-white/95 px-8 py-10 shadow-xl shadow-slate-900/10 backdrop-blur-sm text-center">
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
