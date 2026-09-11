"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ShieldOff,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { ApiError, authApi, clearTokens } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const CONFIRM_PHRASE = "DELETE MY ACCOUNT";

export default function DeleteAccountPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [confirmInput, setConfirmInput] = useState("");
  const [checkedUnderstood, setCheckedUnderstood] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const canDelete = checkedUnderstood && confirmInput === CONFIRM_PHRASE;

  async function deleteAccount() {
    if (!canDelete) return;
    setBusy(true);
    setError("");
    try {
      await authApi.deleteAccount();
      clearTokens();
      setUser(null);
      router.replace("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Account deletion failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delete Account"
        description="Permanently remove your SmartBill Nepal account and all associated data"
        actions={
          <Link href="/profile" className="btn-secondary flex items-center gap-2">
            ← Back to Profile
          </Link>
        }
      />

      <div className="mx-auto max-w-xl space-y-5">
        {/* Danger Warning Card */}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/50">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">
                This action is permanent and cannot be undone
              </h3>
              <p className="mt-1.5 text-sm text-red-700 dark:text-red-400">
                Deleting your account will immediately remove:
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-red-700 dark:text-red-400">
                {[
                  "Your login credentials and profile",
                  "All products, categories, and inventory data",
                  "All customer records and invoice history",
                  "All subscription access and billing records",
                  "All stock movement logs and AI analytics history",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Confirmation Form Card */}
        <div className="card space-y-5">
          <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50">
              <ShieldOff className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-[var(--navy)]">
                Confirm Account Deletion
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                {user ? `Deleting account for @${user.username}` : "Verify your intent below"}
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error ? (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <p>{error}</p>
            </div>
          ) : null}

          {/* Checkbox Acknowledgement */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 transition-colors hover:border-red-300">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 cursor-pointer accent-red-600"
              checked={checkedUnderstood}
              onChange={(e) => setCheckedUnderstood(e.target.checked)}
            />
            <span className="text-sm font-medium leading-relaxed text-[var(--ink)]">
              I understand that deleting my account is <strong>irreversible</strong>, and all my
              data will be permanently removed from SmartBill Nepal.
            </span>
          </label>

          {/* Type Confirmation */}
          <div>
            <label className="label" htmlFor="confirm_phrase">
              Type{" "}
              <code className="rounded bg-red-100 px-1 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900 dark:text-red-300">
                {CONFIRM_PHRASE}
              </code>{" "}
              to confirm
            </label>
            <input
              id="confirm_phrase"
              type="text"
              className={`input font-mono tracking-wide ${
                confirmInput && confirmInput !== CONFIRM_PHRASE
                  ? "border-red-400 ring-red-200 focus:border-red-500"
                  : confirmInput === CONFIRM_PHRASE
                    ? "border-emerald-400 ring-emerald-200 focus:border-emerald-500"
                    : ""
              }`}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              autoComplete="off"
              spellCheck={false}
            />
            {confirmInput && confirmInput !== CONFIRM_PHRASE ? (
              <p className="mt-1 text-xs text-red-600">
                Phrase does not match. Please type exactly: <strong>{CONFIRM_PHRASE}</strong>
              </p>
            ) : confirmInput === CONFIRM_PHRASE ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Phrase confirmed
              </p>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-4">
            <button
              type="button"
              disabled={!canDelete || busy}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void deleteAccount()}
            >
              <Trash2 className="h-4 w-4" />
              {busy ? "Deleting Account…" : "Permanently Delete Account"}
            </button>
            <Link href="/profile" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
