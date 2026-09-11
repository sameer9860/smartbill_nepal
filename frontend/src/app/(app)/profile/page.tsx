"use client";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  KeyRound,
  Mail,
  Shield,
  Trash2,
  User2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { ApiError, authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ProfilePage() {
  const { user, setUser, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name || "");
    setLastName(user.last_name || "");
    setEmail(user.email || "");
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const updated = await authApi.updateProfile({
        first_name: firstName,
        last_name: lastName,
        email,
      });
      setUser(updated);
      await refreshUser();
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  const initials =
    (`${firstName.charAt(0)}${lastName.charAt(0)}`).toUpperCase().trim() ||
    user.username.charAt(0).toUpperCase();

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || user.username;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Manage your personal account details and preferences"
      />

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        {/* Left Sidebar – Avatar & Quick Links */}
        <div className="space-y-4">
          {/* Avatar Card */}
          <div className="card flex flex-col items-center gap-3 text-center">
            {/* Avatar Ring */}
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[var(--navy)] to-indigo-500 text-3xl font-bold tracking-tight text-white shadow-lg ring-4 ring-white dark:ring-[var(--surface)]">
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-[var(--surface)]">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>

            <div>
              <p className="font-display text-xl font-semibold text-[var(--navy)]">
                {fullName}
              </p>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">@{user.username}</p>
            </div>

            {user.tenant?.name ? (
              <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                <Building2 className="h-3.5 w-3.5" />
                {user.tenant.name}
              </div>
            ) : null}
          </div>

          {/* Quick Actions Card */}
          <div className="card space-y-2 p-3">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Account Security
            </p>
            <Link
              href="/change-password"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--navy)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50">
                <KeyRound className="h-4 w-4" />
              </div>
              Change Password
            </Link>
            <Link
              href="/subscription"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--navy)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
                <Shield className="h-4 w-4" />
              </div>
              Subscription
            </Link>
            <div className="border-t border-[var(--line)] pt-2">
              <Link
                href="/delete-account"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50">
                  <Trash2 className="h-4 w-4" />
                </div>
                Delete Account
              </Link>
            </div>
          </div>
        </div>

        {/* Right – Edit Form */}
        <form
          className="card space-y-5"
          onSubmit={(e) => void saveProfile(e)}
        >
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--navy)]">
              Account Details
            </h2>
            <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
              Update your name and email address below.
            </p>
          </div>

          {/* Success Alert */}
          {message ? (
            <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <p>{message}</p>
            </div>
          ) : null}

          {/* Error Alert */}
          {error ? (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <p>{error}</p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* First Name */}
            <div>
              <label className="label" htmlFor="first_name">
                First Name
              </label>
              <div className="relative">
                <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                <input
                  id="first_name"
                  className="input pl-9"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="label" htmlFor="last_name">
                Last Name
              </label>
              <div className="relative">
                <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                <input
                  id="last_name"
                  className="input pl-9"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="sm:col-span-2">
              <label className="label" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                <input
                  id="email"
                  type="email"
                  className="input pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Username – read-only */}
            <div className="sm:col-span-2">
              <label className="label">Username</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--ink-muted)]">
                  @
                </span>
                <input
                  className="input cursor-not-allowed bg-[var(--surface-2)] pl-8 text-[var(--ink-muted)]"
                  value={user.username}
                  disabled
                  readOnly
                />
              </div>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                Username cannot be changed after account creation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-[var(--line)] pt-4">
            <button
              type="submit"
              className="btn-primary"
              disabled={busy}
            >
              {busy ? "Saving Changes…" : "Save Changes"}
            </button>
            {message ? (
              <span className="text-xs text-emerald-600">
                ✓ Saved successfully
              </span>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
