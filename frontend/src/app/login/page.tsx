"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#1a237e_0%,#283593_50%,#1565c0_100%)] px-4 py-10">
      <form onSubmit={onSubmit} className="card w-full max-w-md">
        <p className="font-display text-2xl text-[var(--navy)]">SmartBill Nepal</p>
        <h1 className="mt-2 text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Access your store dashboard
        </p>

        {error ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary mt-6 w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-4 text-center text-sm text-[var(--ink-muted)]">
          New here?{" "}
          <Link href="/register" className="font-semibold text-[var(--navy)]">
            Start a 3-day trial
          </Link>
        </p>
      </form>
    </main>
  );
}
