"use client";

import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { ApiError, authApi } from "@/lib/api";

const RULES = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p: string) => /[0-9]/.test(p), label: "One number" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "One special character" },
];

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = RULES.filter((r) => r.test(newPassword)).length;
  const strengthPct = (strength / RULES.length) * 100;
  const strengthColor =
    strength <= 1
      ? "bg-red-500"
      : strength === 2
        ? "bg-amber-500"
        : strength === 3
          ? "bg-yellow-400"
          : "bg-emerald-500";
  const strengthLabel =
    strength <= 1 ? "Weak" : strength === 2 ? "Fair" : strength === 3 ? "Good" : "Strong";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const res = await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setMessage(res.message);
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Password change failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Change Password"
        description="Update your login password to keep your account secure"
        actions={
          <Link href="/profile" className="btn-secondary flex items-center gap-2">
            ← Back to Profile
          </Link>
        }
      />

      <div className="mx-auto max-w-xl space-y-5">
        {/* Success Banner */}
        {message ? (
          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">Password Updated</p>
              <p className="mt-0.5 text-sm opacity-80">{message}</p>
            </div>
          </div>
        ) : null}

        {/* Error Banner */}
        {error ? (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <p className="text-sm">{error}</p>
          </div>
        ) : null}

        <form className="card space-y-5" onSubmit={(e) => void submit(e)}>
          <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-[var(--navy)]">
                Security Update
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Enter your current password, then choose a new one
              </p>
            </div>
          </div>

          {/* Current Password */}
          <div>
            <label className="label" htmlFor="old_password">
              Current Password *
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
              <input
                id="old_password"
                type={showOld ? "text" : "password"}
                className="input pl-9 pr-10"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder="Your current password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)]"
                tabIndex={-1}
                onClick={() => setShowOld((v) => !v)}
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="label" htmlFor="new_password">
              New Password *
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
              <input
                id="new_password"
                type={showNew ? "text" : "password"}
                className="input pl-9 pr-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Choose a strong password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)]"
                tabIndex={-1}
                onClick={() => setShowNew((v) => !v)}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength Meter */}
            {newPassword.length > 0 ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--ink-muted)]">Password strength:</span>
                  <span
                    className={`font-semibold ${
                      strength <= 1
                        ? "text-red-600"
                        : strength === 2
                          ? "text-amber-600"
                          : strength === 3
                            ? "text-yellow-600"
                            : "text-emerald-600"
                    }`}
                  >
                    {strengthLabel}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                    style={{ width: `${strengthPct}%` }}
                  />
                </div>
                {/* Rule Checklist */}
                <ul className="grid grid-cols-2 gap-1 pt-1">
                  {RULES.map((rule) => {
                    const pass = rule.test(newPassword);
                    return (
                      <li
                        key={rule.label}
                        className={`flex items-center gap-1 text-[11px] ${
                          pass ? "text-emerald-600" : "text-[var(--ink-muted)]"
                        }`}
                      >
                        <CheckCircle2
                          className={`h-3.5 w-3.5 shrink-0 ${pass ? "text-emerald-500" : "opacity-30"}`}
                        />
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="label" htmlFor="confirm_password">
              Confirm New Password *
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
              <input
                id="confirm_password"
                type={showConfirm ? "text" : "password"}
                className={`input pl-9 pr-10 ${
                  confirm && confirm !== newPassword
                    ? "border-red-400 ring-red-300 focus:border-red-500"
                    : confirm && confirm === newPassword
                      ? "border-emerald-400 ring-emerald-200 focus:border-emerald-500"
                      : ""
                }`}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)]"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirm && confirm !== newPassword ? (
              <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
            ) : confirm && confirm === newPassword ? (
              <p className="mt-1 text-xs text-emerald-600">✓ Passwords match</p>
            ) : null}
          </div>

          <div className="flex items-center gap-3 border-t border-[var(--line)] pt-4">
            <button
              type="submit"
              className="btn-primary"
              disabled={busy || !oldPassword || !newPassword || newPassword !== confirm}
            >
              {busy ? "Updating Password…" : "Update Password"}
            </button>
            <Link href="/profile" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
