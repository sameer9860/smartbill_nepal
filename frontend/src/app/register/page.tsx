"use client";

import {
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { AuthPageShell } from "@/components/AuthPageShell";
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

  function FloatField({
    id,
    label,
    type = "text",
    icon: Icon,
    value,
    onChange,
    autoComplete,
    required: req = true,
    minLength,
    extra,
  }: {
    id: string;
    label: string;
    type?: string;
    icon: React.ElementType;
    value: string;
    onChange: (v: string) => void;
    autoComplete?: string;
    required?: boolean;
    minLength?: number;
    extra?: React.ReactNode;
  }) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-slate-400">
        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
        <div className="relative flex-1">
          <input
            id={id}
            type={type}
            className="peer w-full bg-transparent pb-1.5 pt-5 text-sm text-slate-900 placeholder-transparent outline-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={label}
            autoComplete={autoComplete}
            required={req}
            minLength={minLength}
          />
          <label
            htmlFor={id}
            className="pointer-events-none absolute left-0 top-3.5 text-sm text-slate-400 transition-all duration-200
              peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400
              peer-focus:top-1 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-blue-600
              peer-[&:not(:placeholder-shown)]:top-1 peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold peer-[&:not(:placeholder-shown)]:text-slate-500"
          >
            {label}
          </label>
        </div>
        {extra}
      </div>
    );
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

        <div className="mt-5 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create account</h1>
          <p className="mt-1 text-sm font-medium text-blue-500">Start your 3-day free trial</p>
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <FloatField
              id="store_name"
              label="Store / Company Name"
              icon={Building2}
              value={form.store_name}
              onChange={(v) => update("store_name", v)}
            />
            {fieldErrors.store_name && (
              <p className="mt-1 pl-1 text-xs font-medium text-red-600">{fieldErrors.store_name}</p>
            )}
          </div>

          <div>
            <FloatField
              id="username"
              label="Username"
              icon={User}
              value={form.username}
              onChange={(v) => update("username", v)}
              autoComplete="username"
            />
            {fieldErrors.username && (
              <p className="mt-1 pl-1 text-xs font-medium text-red-600">{fieldErrors.username}</p>
            )}
          </div>

          <div>
            <FloatField
              id="email"
              label="Email address"
              type="email"
              icon={Mail}
              value={form.email}
              onChange={(v) => update("email", v)}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p className="mt-1 pl-1 text-xs font-medium text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-slate-400">
              <Lock className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="relative flex-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="peer w-full bg-transparent pb-1.5 pt-5 text-sm text-slate-900 placeholder-transparent outline-none"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <label
                  htmlFor="password"
                  className="pointer-events-none absolute left-0 top-3.5 text-sm text-slate-400 transition-all duration-200
                    peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400
                    peer-focus:top-1 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-blue-600
                    peer-[&:not(:placeholder-shown)]:top-1 peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold peer-[&:not(:placeholder-shown)]:text-slate-500"
                >
                  Password (min. 8 chars)
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
            {fieldErrors.password && (
              <p className="mt-1 pl-1 text-xs font-medium text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Start Free Trial"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium text-orange-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-slate-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
