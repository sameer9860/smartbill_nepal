"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Eye,
  FilePlus,
  FileText,
  History,
  Package,
  PackagePlus,
  Printer,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ExpiredGate } from "@/components/ExpiredGate";
import { LoadingPage } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ApiError, coreApi, formatNpr } from "@/lib/api";
import type { DashboardData, ReportsData } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [monthly, setMonthly] = useState<ReportsData["monthly_revenue"]>([]);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([coreApi.dashboard(), coreApi.reports()])
      .then(([dash, reports]) => {
        setData(dash);
        setMonthly(reports.monthly_revenue);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 402) {
          setExpired(true);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      });
  }, []);

  if (expired) return <ExpiredGate />;
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 font-medium">
        {error}
      </div>
    );
  }
  if (!data) return <LoadingPage label="Loading dashboard statistics…" />;

  const stats = [
    {
      label: "Total Products",
      value: data.total_products,
      icon: Package,
      gradient: "from-blue-500/10 to-indigo-500/5",
      border: "border-blue-200/60",
      iconBg: "bg-blue-600",
    },
    {
      label: "Registered Customers",
      value: data.total_customers,
      icon: Users,
      gradient: "from-sky-500/10 to-teal-500/5",
      border: "border-sky-200/60",
      iconBg: "bg-sky-600",
    },
    {
      label: "Total Invoices",
      value: data.total_invoices,
      icon: FileText,
      gradient: "from-amber-500/10 to-orange-500/5",
      border: "border-amber-200/60",
      iconBg: "bg-amber-600",
    },
    {
      label: "Paid Revenue",
      value: formatNpr(data.total_revenue),
      icon: Banknote,
      gradient: "from-emerald-500/10 to-teal-500/5",
      border: "border-emerald-200/60",
      iconBg: "bg-emerald-600",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your store billing, inventory & sales"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/invoices/create" className="btn-primary">
              <FilePlus className="h-4 w-4" />
              <span>New Invoice</span>
            </Link>
          </div>
        }
      />

      {/* Quick Actions Shortcuts */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/invoices/create"
          className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white">
              <FilePlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Create Invoice</p>
              <p className="text-xs text-slate-500">Quick POS Billing</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition" />
        </Link>

        <Link
          href="/products"
          className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 transition group-hover:bg-sky-600 group-hover:text-white">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Add Product</p>
              <p className="text-xs text-slate-500">Manage Inventory</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-sky-600 transition" />
        </Link>

        <Link
          href="/stock-movements"
          className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-300 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 transition group-hover:bg-amber-600 group-hover:text-white">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Stock Log</p>
              <p className="text-xs text-slate-500">Record IN / OUT</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-amber-600 transition" />
        </Link>

        <Link
          href="/ai-insights"
          className="group flex items-center justify-between rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 p-4 shadow-sm transition hover:border-amber-300 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">AI Insights</p>
              <p className="text-xs text-amber-800 font-medium">Smart Analytics</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-700 group-hover:translate-x-1 transition" />
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${stat.gradient} ${stat.border}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
                    {stat.value}
                  </p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md ${stat.iconBg}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Revenue Chart */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">Monthly Revenue Trend</h2>
              <p className="text-xs text-slate-500">Paid invoice performance over time</p>
            </div>
          </div>
          <Link href="/reports" className="text-xs font-semibold text-indigo-600 hover:underline">
            Detailed reports →
          </Link>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number) => [formatNpr(value), "Revenue"]}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "#e2e8f0",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  padding: "8px 14px",
                }}
              />
              <Bar dataKey="revenue" fill="#1a237e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Low Stock & Recent Invoices */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alerts Card */}
        <div className="card space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">Low Stock Alerts</h2>
                <p className="text-xs text-slate-500">Products requiring restock</p>
              </div>
            </div>
            <Link href="/low-stock" className="text-xs font-semibold text-indigo-600 hover:underline">
              View all ({data.low_stock_products.length})
            </Link>
          </div>

          {data.low_stock_products.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                ✓
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">All stocked up!</p>
              <p className="text-xs text-slate-500">No items are below low-stock threshold.</p>
            </div>
          ) : (
            <ul className="space-y-2 flex-1">
              {data.low_stock_products.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 transition hover:bg-slate-100/80"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">Threshold: {p.low_stock_threshold} units</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                      {p.stock_quantity} left
                    </span>
                    <Link
                      href="/stock-movements"
                      className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Restock
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Invoices Card */}
        <div className="card space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">Recent Invoices</h2>
                <p className="text-xs text-slate-500">Latest sales transactions</p>
              </div>
            </div>
            <Link href="/invoices" className="text-xs font-semibold text-indigo-600 hover:underline">
              View all
            </Link>
          </div>

          {data.recent_invoices.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
              <p className="text-sm font-semibold text-slate-900">No invoices generated yet.</p>
              <p className="text-xs text-slate-500">Create your first invoice to see recent activity.</p>
              <Link href="/invoices/create" className="btn-primary mt-3 text-xs">
                Create Invoice
              </Link>
            </div>
          ) : (
            <ul className="space-y-2 flex-1">
              {data.recent_invoices.map((inv) => (
                <li key={inv.id}>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5 transition hover:bg-slate-100/80">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-900">
                          {inv.invoice_number}
                        </span>
                        <StatusBadge status={inv.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-600">{inv.customer_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 text-sm">
                        {formatNpr(inv.grand_total)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-800"
                          title="View Invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/invoices/${inv.id}/print`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-800"
                          title="Print Invoice"
                        >
                          <Printer className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

