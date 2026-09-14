"use client";

import { AlertCircle, Eye, EyeOff, Lock, Receipt, User } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 font-sans selection:bg-blue-600 selection:text-white">
      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl bg-white px-8 py-10 shadow-lg">

        {/* Brand Icon */}
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Receipt className="h-6 w-6 text-slate-800" />
          </div>
        </div>

        {/* Heading */}
        <div className="mt-5 text-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-blue-500 font-medium">Sign in to your SmartBill account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-6 space-y-3">

          {/* Username — floating label */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 focus-within:border-slate-400 transition">
            <User className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="relative flex-1">
              <input
                id="username"
                type="text"
                className="peer w-full bg-transparent pb-1.5 pt-5 text-sm text-slate-900 placeholder-transparent outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                required
              />
              <label
                htmlFor="username"
                className="pointer-events-none absolute left-0 top-3.5 text-sm text-slate-400 transition-all duration-200
                  peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400
                  peer-focus:top-1 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-blue-600
                  peer-[&:not(:placeholder-shown)]:top-1 peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold peer-[&:not(:placeholder-shown)]:text-slate-500"
              >
                Username
              </label>
            </div>
          </div>

          {/* Password — floating label */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 focus-within:border-slate-400 transition">
            <Lock className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="relative flex-1">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="peer w-full bg-transparent pb-1.5 pt-5 text-sm text-slate-900 placeholder-transparent outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                required
              />
              <label
                htmlFor="password"
                className="pointer-events-none absolute left-0 top-3.5 text-sm text-slate-400 transition-all duration-200
                  peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400
                  peer-focus:top-1 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-blue-600
                  peer-[&:not(:placeholder-shown)]:top-1 peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold peer-[&:not(:placeholder-shown)]:text-slate-500"
              >
                Password
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

          {/* Forgot password */}
          <div className="flex justify-end -mt-1">
            <Link
              href="#"
              className="text-xs font-medium text-blue-500 hover:text-blue-700 hover:underline transition"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium text-orange-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-bold text-slate-900 hover:underline">
            Start free trial
          </Link>
        </p>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          &copy; {new Date().getFullYear()} SmartBill Nepal
        </p>
      </div>
    </main>
  );
}
