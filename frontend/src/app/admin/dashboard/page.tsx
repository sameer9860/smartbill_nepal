"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

import { LoadingPage } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { adminApi, formatNpr } from "@/lib/api";
import type { AdminDashboard } from "@/lib/types";

const PLAN_LABELS: Record<string, string> = {
  TRIAL: "Trial",
  BASIC_MONTHLY: "Basic Monthly",
  PRO_YEARLY: "Pro Yearly",
  ENTERPRISE: "Enterprise",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

const PLAN_BADGE: Record<string, string> = {
  TRIAL: "bg-slate-100 text-slate-600",
  BASIC_MONTHLY: "bg-blue-100 text-blue-700",
  PRO_YEARLY: "bg-violet-100 text-violet-700",
  ENTERPRISE: "bg-amber-100 text-amber-700",
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .dashboard()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage label="Loading admin dashboard…" />;
  if (error)
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  if (!data) return null;

  const statCards = [
    {
      label: "Total Tenants",
      value: data.total_tenants,
      icon: Building2,
      color: "text-violet-600",
      bg: "bg-violet-50",
      href: "/admin/tenants",
    },
    {
      label: "Active Subscriptions",
      value: data.active_tenants,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/admin/tenants?status=ACTIVE",
    },
    {
      label: "On Trial",
      value: data.trial_tenants,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/admin/tenants?status=TRIAL_ACTIVE",
    },
    {
      label: "Expired / Cancelled",
      value: data.expired_tenants,
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-50",
      href: "/admin/tenants?status=EXPIRED",
    },
    {
      label: "Pending Receipts",
      value: data.pending_receipts,
      icon: Receipt,
      color: "text-amber-600",
      bg: "bg-amber-50",
      href: "/admin/receipts?status=PENDING",
    },
    {
      label: "Total Users",
      value: data.total_users,
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      href: "/admin/users",
    },
    {
      label: "Total Revenue",
      value: formatNpr(data.total_revenue_nrs),
      icon: TrendingUp,
      color: "text-teal-600",
      bg: "bg-teal-50",
      href: "/admin/receipts?status=APPROVED",
    },
    {
      label: "Expiring in 7 Days",
      value: data.expiring_soon_count,
      icon: Clock,
      color: "text-orange-500",
      bg: "bg-orange-50",
      href: "/admin/tenants",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="Platform-wide overview for SmartBill Nepal."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Plan distribution + Monthly revenue side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800">Plan Distribution</h2>
          <div className="mt-4 space-y-3">
            {data.plan_distribution.map((p) => {
              const pct =
                data.total_tenants > 0
                  ? Math.round((p.count / data.total_tenants) * 100)
                  : 0;
              return (
                <div key={p.subscription_plan}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        PLAN_BADGE[p.subscription_plan] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {PLAN_LABELS[p.subscription_plan] ?? p.subscription_plan}
                    </span>
                    <span className="text-slate-600 font-medium">
                      {p.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.plan_distribution.length === 0 && (
              <p className="text-sm text-slate-400">No tenants yet.</p>
            )}
          </div>
        </div>

        {/* Monthly revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800">Revenue (last 6 months)</h2>
          <div className="mt-4 space-y-3">
            {data.monthly_revenue.map((m) => {
              const max = Math.max(...data.monthly_revenue.map((x) => x.revenue), 1);
              const pct = Math.round((m.revenue / max) * 100);
              return (
                <div key={m.month}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">{m.month}</span>
                    <span className="font-semibold text-slate-900">
                      {formatNpr(m.revenue)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent tenants + Pending receipts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent tenants */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-800">Recent Tenants</h2>
            <Link
              href="/admin/tenants"
              className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recent_tenants.map((t) => (
              <Link
                key={t.id}
                href={`/admin/tenants/${t.id}`}
                className="flex items-center justify-between gap-3 px-6 py-3.5 hover:bg-slate-50 transition"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.owner_username ?? "—"}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    PLAN_BADGE[t.subscription_plan] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {PLAN_LABELS[t.subscription_plan] ?? t.subscription_plan}
                </span>
              </Link>
            ))}
            {data.recent_tenants.length === 0 && (
              <p className="px-6 py-4 text-sm text-slate-400">No tenants yet.</p>
            )}
          </div>
        </div>

        {/* Pending receipts */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-800">Pending Receipts</h2>
            <Link
              href="/admin/receipts?status=PENDING"
              className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recent_pending_receipts.map((r) => (
              <Link
                key={r.id}
                href="/admin/receipts"
                className="flex items-center justify-between gap-3 px-6 py-3.5 hover:bg-slate-50 transition"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{r.tenant_name}</p>
                  <p className="text-xs text-slate-500">
                    {r.plan_display} · {formatNpr(r.amount_nrs)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    STATUS_COLORS[r.status] ?? ""
                  }`}
                >
                  {r.status_display}
                </span>
              </Link>
            ))}
            {data.recent_pending_receipts.length === 0 && (
              <p className="px-6 py-4 text-sm text-slate-400">No pending receipts.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

