"use client";

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
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#1a237e_0%,#283593_50%,#1565c0_100%)] px-4 py-10">
      <form onSubmit={onSubmit} className="card w-full max-w-md">
        <p className="font-display text-2xl text-[var(--navy)]">SmartBill Nepal</p>
        <h1 className="mt-2 text-xl font-semibold">Create your store</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Includes a 3-day free trial with full access
        </p>

        {error ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-6 space-y-4">
          {(
            [
              ["store_name", "Store name", "text"],
              ["username", "Username", "text"],
              ["email", "Email", "email"],
              ["password", "Password (min 8)", "password"],
            ] as const
          ).map(([key, label, type]) => (
            <div key={key}>
              <label className="label" htmlFor={key}>
                {label}
              </label>
              <input
                id={key}
                type={type}
                className="input"
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
                required
                minLength={key === "password" ? 8 : undefined}
              />
              {fieldErrors[key] ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors[key]}</p>
              ) : null}
            </div>
          ))}
        </div>

        <button type="submit" className="btn-primary mt-6 w-full" disabled={submitting}>
          {submitting ? "Creating account…" : "Start free trial"}
        </button>

        <p className="mt-4 text-center text-sm text-[var(--ink-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--navy)]">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
