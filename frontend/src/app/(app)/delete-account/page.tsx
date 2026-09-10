"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { ApiError, authApi, clearTokens } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function DeleteAccountPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function deleteAccount() {
    if (!confirmed) return;
    setBusy(true);
    setError("");
    try {
      await authApi.deleteAccount();
      clearTokens();
      setUser(null);
      router.replace("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delete account"
        description="Permanently remove your account and store data"
        actions={
          <Link href="/profile" className="btn-secondary">
            Back to profile
          </Link>
        }
      />

      <div className="card max-w-lg border-red-200 bg-red-50/50">
        <p className="font-semibold text-red-800">This action cannot be undone</p>
        <p className="mt-2 text-sm text-red-900/80">
          Deleting your account removes your login and associated store data from
          SmartBill Nepal.
        </p>

        {error ? (
          <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <label className="mt-4 flex items-start gap-2 text-sm text-red-950">
          <input
            type="checkbox"
            className="mt-1"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>I understand that my account and data will be permanently deleted.</span>
        </label>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/profile" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="button"
            disabled={!confirmed || busy}
            className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void deleteAccount()}
          >
            {busy ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </div>
    </div>
  );
}
