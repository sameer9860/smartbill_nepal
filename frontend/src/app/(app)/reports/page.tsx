"use client";

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

import { EmptyState } from "@/components/EmptyState";
import { ExpiredGate } from "@/components/ExpiredGate";
import { LoadingPage } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ApiError, coreApi, formatNpr } from "@/lib/api";
import type { ReportsData } from "@/lib/types";

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
        else setError(err instanceof Error ? err.message : "Failed to load");
      });
  }, []);

  if (expired) return <ExpiredGate />;
  if (error) {
    return (
      <div className="card border-red-200 bg-red-50 text-red-800">{error}</div>
    );
  }
  if (!data) return <LoadingPage label="Loading reports…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Revenue, invoice status, and top-selling products"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-sm text-[var(--ink-muted)]">Paid revenue</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--navy)]">
            {formatNpr(data.total_revenue)}
          </p>
        </div>
        {data.status_breakdown.map((s) => (
          <div key={s.status} className="card">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-[var(--ink-muted)]">Invoices</p>
              <StatusBadge status={s.status} />
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--navy)]">
              {s.count}
            </p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              {formatNpr(s.total)}
            </p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-semibold text-[var(--navy)]">Monthly revenue</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthly_revenue}>
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

      <div className="card">
        <h2 className="font-semibold text-[var(--navy)]">Top products by quantity</h2>
        {data.top_products.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No sales data yet" />
          </div>
        ) : (
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.top_products}
                layout="vertical"
                margin={{ left: 24, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d5dbe8" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "total_revenue" ? formatNpr(value) : value
                  }
                  contentStyle={{ borderRadius: 8, borderColor: "#d5dbe8" }}
                />
                <Bar dataKey="total_qty" fill="#1565c0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
