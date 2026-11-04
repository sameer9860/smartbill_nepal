"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, CheckCircle2, Edit2, Save, X } from "lucide-react";
import Link from "next/link";

import { LoadingPage } from "@/components/LoadingCard";
import { adminApi, formatNpr } from "@/lib/api";
import type { AdminTenant } from "@/lib/types";

const PLAN_CHOICES = [
  { value: "TRIAL", label: "Free Trial" },
  { value: "BASIC_MONTHLY", label: "Basic Monthly" },
  { value: "PRO_YEARLY", label: "Pro Yearly" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

const STATUS_CHOICES = [
  { value: "TRIAL_ACTIVE", label: "Trial Active" },
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PLAN_BADGE: Record<string, string> = {
  TRIAL: "bg-slate-100 text-slate-600",
  BASIC_MONTHLY: "bg-blue-100 text-blue-700",
  PRO_YEARLY: "bg-violet-100 text-violet-700",
  ENTERPRISE: "bg-amber-100 text-amber-700",
};

const STATUS_COLORS: Record<string, string> = {
  TRIAL_ACTIVE: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-500",
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function AdminTenantDetailPage() {
  const params = useParams();
  const tenantId = Number(params.id);
  const [tenant, setTenant] = useState<AdminTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Edit form state
  const [editPlan, setEditPlan] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editEndsAt, setEditEndsAt] = useState("");
  const [editName, setEditName] = useState("");

  useEffect(() => {
    adminApi
      .tenant(tenantId)
      .then((t) => {
        setTenant(t);
        setEditPlan(t.subscription_plan);
        setEditStatus(t.subscription_status);
        setEditEndsAt(
          t.subscription_ends_at
            ? new Date(t.subscription_ends_at).toISOString().slice(0, 16)
            : ""
        );
        setEditName(t.name);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [tenantId]);

  async function save() {
    if (!tenant) return;
    setSaving(true);
    setSaveMsg("");
    setError("");
    try {
      const updated = await adminApi.updateTenant(tenantId, {
        subscription_plan: editPlan,
        subscription_status: editStatus,
        subscription_ends_at: editEndsAt || null,
        name: editName,
      });
      setTenant({ ...updated, receipts: tenant.receipts });
      setEditing(false);
      setSaveMsg("Tenant updated successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingPage label="Loading tenant…" />;
  if (!tenant && error)
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
    );
  if (!tenant) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/tenants"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{tenant.name}</h1>
          <p className="text-sm text-slate-500">Tenant #{tenant.id}</p>
        </div>
      </div>

      {saveMsg && (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {saveMsg}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Detail card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-violet-600" />
            <h2 className="font-semibold text-slate-800">Subscription Details</h2>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <Edit2 className="h-4 w-4" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(false); setError(""); }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-5 p-6 sm:grid-cols-2">
          {/* Store name */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Store Name</p>
            {editing ? (
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            ) : (
              <p className="mt-1 font-semibold text-slate-900">{tenant.name}</p>
            )}
          </div>

          {/* Owner */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Owner</p>
            <p className="mt-1 font-semibold text-slate-900">{tenant.owner_username ?? "—"}</p>
            <p className="text-xs text-slate-500">{tenant.owner_email ?? ""}</p>
          </div>

          {/* Plan */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Plan</p>
            {editing ? (
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                value={editPlan}
                onChange={(e) => setEditPlan(e.target.value)}
              >
                {PLAN_CHOICES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            ) : (
              <span
                className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  PLAN_BADGE[tenant.subscription_plan] ?? "bg-slate-100"
                }`}
              >
                {PLAN_CHOICES.find((c) => c.value === tenant.subscription_plan)?.label ?? tenant.subscription_plan}
              </span>
            )}
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</p>
            {editing ? (
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                {STATUS_CHOICES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            ) : (
              <span
                className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  STATUS_COLORS[tenant.subscription_status] ?? "bg-slate-100"
                }`}
              >
                {STATUS_CHOICES.find((c) => c.value === tenant.subscription_status)?.label ?? tenant.subscription_status}
              </span>
            )}
          </div>

          {/* Subscription ends */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Subscription Ends At</p>
            {editing ? (
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                value={editEndsAt}
                onChange={(e) => setEditEndsAt(e.target.value)}
              />
            ) : (
              <p className="mt-1 text-slate-700">
                {tenant.subscription_ends_at
                  ? new Date(tenant.subscription_ends_at).toLocaleString()
                  : "—"}
              </p>
            )}
          </div>

          {/* Trial */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Trial Period</p>
            <p className="mt-1 text-slate-700">
              {new Date(tenant.trial_starts_at).toLocaleDateString()} →{" "}
              {new Date(tenant.trial_ends_at).toLocaleDateString()}
              {tenant.is_trial_active && (
                <span className="ml-2 text-xs text-blue-600 font-semibold">
                  ({tenant.days_left_in_trial}d left)
                </span>
              )}
            </p>
          </div>

          {/* Created */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Created At</p>
            <p className="mt-1 text-slate-700">
              {new Date(tenant.created_at).toLocaleString()}
            </p>
          </div>

          {/* Access */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Has Access</p>
            <p className={`mt-1 font-semibold ${tenant.has_access ? "text-emerald-600" : "text-red-500"}`}>
              {tenant.has_access ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </div>

      {/* Receipts */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-800">Subscription Receipts</h2>
        </div>
        {(!tenant.receipts || tenant.receipts.length === 0) ? (
          <p className="px-6 py-5 text-sm text-slate-400">No receipts submitted.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Plan</th>
                  <th className="px-5 py-3 text-left font-semibold">Amount</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Submitted</th>
                  <th className="px-5 py-3 text-left font-semibold">Reviewed</th>
                  <th className="px-5 py-3 text-left font-semibold">Note</th>
                  <th className="px-5 py-3 text-left font-semibold">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenant.receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium">{r.plan_display}</td>
                    <td className="px-5 py-3">{formatNpr(r.amount_nrs)}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[r.status] ?? ""}`}>
                        {r.status_display}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(r.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-500 max-w-xs truncate">
                      {r.review_note || "—"}
                    </td>
                    <td className="px-5 py-3">
                      {r.receipt_url ? (
                        <a
                          href={r.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-violet-600 hover:underline"
                        >
                          View
                        </a>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

