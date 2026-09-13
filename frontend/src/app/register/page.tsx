"use client";

import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Receipt,
  User,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    store_name: "",
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);
    try {
      await register(form);
    } catch (err) {
      if (err instanceof ApiError && typeof err.data === "object" && err.data) {
        const data = err.data as Record<string, unknown>;
        const next: Record<string, string> = {};
        for (const key of ["username", "email", "password", "store_name"]) {
          const val = data[key];
          if (Array.isArray(val) && typeof val[0] === "string") {
            next[key] = val[0];
          } else if (typeof val === "string") {
            next[key] = val;
          }
        }
        if (Object.keys(next).length) {
          setFieldErrors(next);
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : "Registration failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b14] px-4 py-12 text-slate-100 selection:bg-blue-600 selection:text-white font-sans">
      {/* Subtle Background Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[600px] rounded-full bg-blue-600/10 blur-[140px]" />
      </div>

      {/* Floating Back Button */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-md transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Floating Card Container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          {/* Brand Header */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Receipt className="h-5 w-5" />
              </div>
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                SmartBill <span className="text-blue-500">Nepal</span>
              </span>
            </Link>
            <h1 className="mt-6 text-xl font-bold text-white tracking-tight">Create Store Account</h1>
            <p className="mt-1 text-xs text-blue-400 font-semibold bg-blue-500/10 inline-block px-3 py-1 rounded-full border border-blue-500/20">
              ⚡ Includes 3-Day Free Trial
            </p>
          </div>

          {/* Error Banner */}
          {error ? (
            <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-semibold text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* Form */}
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {/* Store Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5" htmlFor="store_name">
                Store / Company Name
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="store_name"
                  type="text"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm font-medium text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.store_name}
                  onChange={(e) => update("store_name", e.target.value)}
                  placeholder="e.g. Acme Supermarket"
                  required
                />
              </div>
              {fieldErrors.store_name ? (
                <p className="mt-1 text-xs font-medium text-red-400">{fieldErrors.store_name}</p>
              ) : null}
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm font-medium text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.username}
                  onChange={(e) => update("username", e.target.value)}
                  placeholder="Choose a username"
                  autoComplete="username"
                  required
                />
              </div>
              {fieldErrors.username ? (
                <p className="mt-1 text-xs font-medium text-red-400">{fieldErrors.username}</p>
              ) : null}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm font-medium text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              {fieldErrors.email ? (
                <p className="mt-1 text-xs font-medium text-red-400">{fieldErrors.email}</p>
              ) : null}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5" htmlFor="password">
                Password (min 8 chars)
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-11 text-sm font-medium text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Set account password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="mt-1 text-xs font-medium text-red-400">{fieldErrors.password}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-60 mt-2"
            >
              <span>{submitting ? "Creating account…" : "Start Free Trial"}</span>
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800/80 pt-5">
            <span>Already have an account? </span>
            <Link href="/login" className="font-bold text-blue-400 hover:text-blue-300 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
