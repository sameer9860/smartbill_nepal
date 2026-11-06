"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ExternalLink, Receipt, XCircle } from "lucide-react";

import { LoadingPage } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { adminApi, formatNpr } from "@/lib/api";
import type { AdminReceipt } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function AdminReceiptsPage() {
  const searchParams = useSearchParams();
  const [receipts, setReceipts] = useState<AdminReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") ?? ""
  );
  const [planFilter, setPlanFilter] = useState(
    searchParams.get("plan") ?? ""
  );

  // Review modal state
  const [reviewing, setReviewing] = useState<AdminReceipt | null>(null);
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .receipts({ status: statusFilter, plan: planFilter, search })
      .then((res) => setReceipts(res.receipts))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [statusFilter, planFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitReview() {
    if (!reviewing) return;
    setSubmitting(true);
    setError("");
    try {
      const updated = await adminApi.reviewReceipt(reviewing.id, {
        action,
        note,
      });
      setReceipts((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      setActionMsg(
        `Receipt ${action === "approve" ? "approved" : "rejected"} successfully.`
      );
      setReviewing(null);
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Receipts"
        description="Review payment receipts submitted by tenants."
      />

      {actionMsg && (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {actionMsg}
        </p>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by store or user…"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="">All plans</option>
          <option value="BASIC_MONTHLY">Basic Monthly</option>
          <option value="PRO_YEARLY">Pro Yearly</option>
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <LoadingPage label="Loading receipts…" />
      ) : receipts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Receipt className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">No receipts found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">S.N.</th>
                  <th className="px-5 py-3 text-left font-semibold">Store</th>
                  <th className="px-5 py-3 text-left font-semibold">Submitted By</th>
                  <th className="px-5 py-3 text-left font-semibold">Plan</th>
                  <th className="px-5 py-3 text-left font-semibold">Amount</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Submitted</th>
                  <th className="px-5 py-3 text-left font-semibold">Receipt</th>
                  <th className="px-5 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((r, index) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-400">
                      {index + 1}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-900">
                      {r.tenant_name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                      <p>{r.submitted_by_username}</p>
                      <p className="text-xs text-slate-400">{r.submitted_by_email}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-700">
                      {r.plan_display}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-900">
                      {formatNpr(r.amount_nrs)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          STATUS_COLORS[r.status] ?? ""
                        }`}
                      >
                        {r.status_display}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                      {new Date(r.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      {r.receipt_url ? (
                        <a
                          href={r.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline"
                        >
                          View <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      {r.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setReviewing(r);
                              setAction("approve");
                              setNote("");
                              setActionMsg("");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-600 transition"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => {
                              setReviewing(r);
                              setAction("reject");
                              setNote("");
                              setActionMsg("");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600 transition"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {r.reviewed_by_username
                            ? `by ${r.reviewed_by_username}`
                            : "Reviewed"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            {receipts.length} receipt{receipts.length !== 1 ? "s" : ""} shown
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="font-bold text-slate-900">
                {action === "approve" ? "✅ Approve" : "❌ Reject"} Receipt
              </h2>
              <button
                onClick={() => setReviewing(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-xl bg-slate-50 p-4 text-sm space-y-1">
                <p><span className="text-slate-500">Store:</span> <strong>{reviewing.tenant_name}</strong></p>
                <p><span className="text-slate-500">Plan:</span> {reviewing.plan_display}</p>
                <p><span className="text-slate-500">Amount:</span> {formatNpr(reviewing.amount_nrs)}</p>
                <p><span className="text-slate-500">By:</span> {reviewing.submitted_by_username}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  Review Action
                </label>
                <div className="flex gap-3">
                  {(["approve", "reject"] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => setAction(a)}
                      className={`flex-1 rounded-xl py-2 text-sm font-semibold capitalize transition ${
                        action === a
                          ? a === "approve"
                            ? "bg-emerald-500 text-white"
                            : "bg-red-500 text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  Note (optional)
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                  placeholder="Add a note for the user…"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                onClick={submitReview}
                disabled={submitting}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 ${
                  action === "approve"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {submitting ? "Processing…" : `Confirm ${action}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

