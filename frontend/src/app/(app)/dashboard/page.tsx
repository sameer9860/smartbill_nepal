"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
      <div className="card border-red-200 bg-red-50 text-red-800">{error}</div>
    );
  }
  if (!data) return <LoadingPage label="Loading dashboard…" />;

  const stats = [
    { label: "Products", value: data.total_products },
    { label: "Customers", value: data.total_customers },
    { label: "Invoices", value: data.total_invoices },
    { label: "Paid revenue", value: formatNpr(data.total_revenue) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your store activity"
        actions={
          <Link href="/invoices/create" className="btn-primary">
            New invoice
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-sm text-[var(--ink-muted)]">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--navy)]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-semibold text-[var(--navy)]">Monthly revenue</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d5dbe8" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => formatNpr(value)}
                contentStyle={{ borderRadius: 8, borderColor: "#d5dbe8" }}
              />
              <Bar dataKey="revenue" fill="#1a237e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--navy)]">Low stock</h2>
            <Link href="/low-stock" className="text-sm text-[var(--navy-2)]">
              View all
            </Link>
          </div>
          {data.low_stock_products.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">All stocked up.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.low_stock_products.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-md bg-[var(--surface)] px-3 py-2 text-sm"
                >
                  <span>{p.name}</span>
                  <span className="font-medium text-amber-700">
                    {p.stock_quantity} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--navy)]">Recent invoices</h2>
            <Link href="/invoices" className="text-sm text-[var(--navy-2)]">
              View all
            </Link>
          </div>
          {data.recent_invoices.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">No invoices yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.recent_invoices.map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between gap-2 rounded-md bg-[var(--surface)] px-3 py-2 text-sm transition hover:bg-[var(--surface-2)]"
                  >
                    <span className="min-w-0 truncate">
                      #{inv.invoice_number} · {inv.customer_name}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={inv.status} />
                      <span className="font-medium">
                        {formatNpr(inv.grand_total)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
