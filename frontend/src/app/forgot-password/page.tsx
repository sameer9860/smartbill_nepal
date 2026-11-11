"use client";

import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { AuthPageShell } from "@/components/AuthPageShell";
import { ApiError, authApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSubmittedEmail(email.trim());
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to send reset link. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell>
      <div className="rounded-3xl border border-white/80 bg-white/95 px-8 py-10 shadow-xl shadow-slate-900/10 backdrop-blur-sm">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.ico" alt="SmartBill Nepal" className="h-8 w-8 object-contain" />
          </div>
        </div>

        {submittedEmail ? (
          <div className="mt-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              Check your email
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              If{" "}
              <strong className="text-slate-800">{submittedEmail}</strong>{" "}
              belongs to an active SmartBill account, a 6-digit verification
              code will be sent to that address. Otherwise, no code is sent.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href={`/reset-password?email=${encodeURIComponent(submittedEmail)}`}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-700 shadow-md"
              >
                Enter 6-digit code →
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSubmittedEmail(null);
                  setEmail("");
                  setError("");
                }}
                className="w-full rounded-2xl border border-slate-200 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Send to another email
              </button>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline pt-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Forgot password?
              </h1>
              <p className="mt-1 text-sm font-medium text-blue-500">
                Enter your email and we&apos;ll send you a 6-digit code
              </p>
            </div>

            {error && (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-slate-400">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="relative flex-1">
                  <input
                    id="email"
                    type="email"
                    className="peer w-full bg-transparent pb-1.5 pt-5 text-sm text-slate-900 placeholder-transparent outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    autoComplete="email"
                    required
                  />
                  <label
                    htmlFor="email"
                    className="pointer-events-none absolute left-0 top-3.5 text-sm text-slate-400 transition-all duration-200
                      peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400
                      peer-focus:top-1 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-blue-600
                      peer-[&:not(:placeholder-shown)]:top-1 peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold peer-[&:not(:placeholder-shown)]:text-slate-500"
                  >
                    Email address
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
              >
                {submitting ? "Sending 6-digit code…" : "Send 6-digit code"}
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
    </AuthPageShell>
  );
}
