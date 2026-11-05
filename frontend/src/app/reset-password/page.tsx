"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

import { AuthPageShell } from "@/components/AuthPageShell";
import { ApiError, authApi } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [username, setUsername] = useState("");
  const [tokenError, setTokenError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!uid || !token) {
      setTokenValid(false);
      setTokenError("Missing or incomplete password reset link.");
      setVerifying(false);
      return;
    }

    authApi
      .verifyResetToken(uid, token)
      .then((res) => {
        if (res.valid) {
          setTokenValid(true);
          setUsername(res.username || "");
        } else {
          setTokenValid(false);
          setTokenError("This password reset link is invalid or has expired.");
        }
      })
      .catch((err) => {
        setTokenValid(false);
        setTokenError(
          err instanceof ApiError
            ? err.message
            : "This password reset link has expired or has already been used."
        );
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [uid, token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

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
        uid,
        token,
        new_password: password,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to reset password. Please try again."
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

      {verifying ? (
        <div className="mt-8 flex flex-col items-center justify-center py-6 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-xs font-medium text-slate-500">
            Verifying your reset link…
          </p>
        </div>
      ) : !tokenValid ? (
        <div className="mt-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
            Link Expired or Invalid
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {tokenError || "This password reset link is invalid or has already expired."}
          </p>

          <div className="mt-6 space-y-3">
            <Link
              href="/forgot-password"
              className="inline-block w-full rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-slate-700"
            >
              Request a new reset link
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      ) : success ? (
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
              Set new password
            </h1>
            <p className="mt-1 text-sm font-medium text-blue-500">
              {username ? `For account: ${username}` : "Enter your new password below"}
            </p>
          </div>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
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

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
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

