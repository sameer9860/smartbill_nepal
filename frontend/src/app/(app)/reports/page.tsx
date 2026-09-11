"use client";

import {
  CheckCircle2,
  Clock,
  DollarSign,
  PackageCheck,
  ShoppingBag,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/EmptyState";
import { ExpiredGate } from "@/components/ExpiredGate";
import { LoadingPage } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";

import { ApiError, coreApi, formatNpr } from "@/lib/api";
import type { ReportsData } from "@/lib/types";

const BAR_COLORS = ["#1a237e", "#1565c0", "#0f766e", "#f59e0b", "#7c3aed"];

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    coreApi
      .reports()
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 402) setExpired(true);
        else setError(err instanceof Error ? err.message : "Failed to load reports");
      });
  }, []);

  if (expired) return <ExpiredGate />;
  if (error) {
    return (
      <div className="card border-red-200 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300">
        {error}
      </div>
    );
  }
  if (!data) return <LoadingPage label="Generating financial analytics & reports…" />;

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case "UNPAID":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "PARTIAL":
        return <Clock className="h-5 w-5 text-amber-600" />;
      default:
        return <ShoppingBag className="h-5 w-5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive summary of revenue performance, invoice distributions, and product volume"
      />

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Paid Revenue */}
        <div className="card flex flex-col justify-between border-l-4 border-l-emerald-500 shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              <span>Total Paid Revenue</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-[var(--navy)]">
              {formatNpr(data.total_revenue)}
            </p>
          </div>
          <p className="mt-3 text-xs text-[var(--ink-muted)]">
            Collected across all paid invoices
          </p>
        </div>

        {/* Dynamic Status Breakdown Cards */}
        {data.status_breakdown.map((s) => (
          <div
            key={s.status}
            className="card flex flex-col justify-between shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                  {s.status} Invoices
                </span>
                {getStatusIcon(s.status)}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="font-display text-2xl font-bold text-[var(--navy)]">
                  {s.count}
                </p>
                <span className="text-xs text-[var(--ink-muted)]">invoices</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-2 text-xs">
              <span className="text-[var(--ink-muted)]">Total Amount:</span>
              <span className="font-semibold text-[var(--ink)]">{formatNpr(s.total)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart Card */}
      <div className="card space-y-4 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-[var(--navy)]">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Monthly Revenue Performance
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              Revenue trends calculated from paid customer invoices
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          {data.monthly_revenue.length === 0 ? (
            <EmptyState title="No monthly sales recorded yet" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_revenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#cbd5e1" }} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#cbd5e1" }} />
                <Tooltip
                  formatter={(value: number) => [formatNpr(value), "Revenue"]}
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--line)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar dataKey="revenue" fill="#1a237e" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="card space-y-4 shadow-sm">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-[var(--navy)]">
            <PackageCheck className="h-5 w-5 text-indigo-600" />
            Top Selling Products by Volume
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Products generating highest quantities sold across all issued invoices
          </p>
        </div>

        {data.top_products.length === 0 ? (
          <EmptyState title="No sales data yet" description="Create invoices to see top performing items here." />
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Chart Column */}
            <div className="h-80 lg:col-span-7">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.top_products}
                  layout="vertical"
                  margin={{ left: 10, right: 20, top: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 11, fill: "#334155" }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === "total_revenue" ? formatNpr(value) : `${value} units`,
                      name === "total_revenue" ? "Revenue" : "Quantity",
                    ]}
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--line)",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar dataKey="total_qty" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {data.top_products.map((_, index) => (
                      <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Table Column */}
            <div className="overflow-x-auto lg:col-span-5">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-muted)]">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Rank & Product</th>
                    <th className="px-3 py-2 font-semibold">Qty Sold</th>
                    <th className="px-3 py-2 font-semibold text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {data.top_products.map((p, idx) => (
                    <tr key={p.name} className="hover:bg-[var(--surface-2)]/50">
                      <td className="px-3 py-2.5 font-medium text-[var(--navy)]">
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          #{idx + 1}
                        </span>
                        {p.name}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-[var(--ink)]">
                        {p.total_qty} units
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-emerald-600">
                        {formatNpr(p.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
