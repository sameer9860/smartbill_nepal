"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Building2, ExternalLink, Search } from "lucide-react";

import { LoadingPage } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { adminApi } from "@/lib/api";
import type { AdminTenant } from "@/lib/types";

const PLAN_LABELS: Record<string, string> = {
  TRIAL: "Trial",
  BASIC_MONTHLY: "Basic Monthly",
  PRO_YEARLY: "Pro Yearly",
  ENTERPRISE: "Enterprise",
};

const STATUS_LABELS: Record<string, string> = {
  TRIAL_ACTIVE: "Trial Active",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  TRIAL_ACTIVE: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const PLAN_BADGE: Record<string, string> = {
  TRIAL: "bg-slate-100 text-slate-600",
  BASIC_MONTHLY: "bg-blue-100 text-blue-700",
  PRO_YEARLY: "bg-violet-100 text-violet-700",
  ENTERPRISE: "bg-amber-100 text-amber-700",
};

export default function AdminTenantsPage() {
  const searchParams = useSearchParams();
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") ?? ""
  );
  const [planFilter, setPlanFilter] = useState(
    searchParams.get("plan") ?? ""
  );

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .tenants({ status: statusFilter, plan: planFilter, search })
      .then((res) => setTenants(res.tenants))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [statusFilter, planFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="All registered stores / businesses on the platform."
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by store name…"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="">All statuses</option>
          <option value="TRIAL_ACTIVE">Trial Active</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="">All plans</option>
          <option value="TRIAL">Trial</option>
          <option value="BASIC_MONTHLY">Basic Monthly</option>
          <option value="PRO_YEARLY">Pro Yearly</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <LoadingPage label="Loading tenants…" />
      ) : tenants.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Building2 className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">No tenants found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">S.N.</th>
                  <th className="px-5 py-3 text-left font-semibold">Store</th>
                  <th className="px-5 py-3 text-left font-semibold">Owner</th>
                  <th className="px-5 py-3 text-left font-semibold">Plan</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Expires / Trial ends</th>
                  <th className="px-5 py-3 text-left font-semibold">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((t, index) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-400">
                      {index + 1}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-900">
                      {t.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                      <p>{t.owner_username ?? "—"}</p>
                      <p className="text-xs text-slate-400">{t.owner_email ?? ""}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          PLAN_BADGE[t.subscription_plan] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {PLAN_LABELS[t.subscription_plan] ?? t.subscription_plan}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          STATUS_COLORS[t.subscription_status] ?? "bg-slate-100"
                        }`}
                      >
                        {STATUS_LABELS[t.subscription_status] ?? t.subscription_status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                      {t.subscription_ends_at
                        ? new Date(t.subscription_ends_at).toLocaleDateString()
                        : t.is_trial_active
                        ? `${t.days_left_in_trial}d left`
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <Link
                        href={`/admin/tenants/${t.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline"
                      >
                        Manage <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            {tenants.length} tenant{tenants.length !== 1 ? "s" : ""} shown
          </div>
        </div>
      )}
    </div>
  );
}

