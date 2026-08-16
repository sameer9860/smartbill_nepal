"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ApiError, coreApi } from "@/lib/api";
import type { DashboardData } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    coreApi
      .dashboard()
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 402) {
          setError("Trial expired. Subscribe to continue.");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      });
  }, []);

  if (error) {
    return (
      <div className="card border-amber-200 bg-amber-50">
        <p className="font-medium text-amber-950">{error}</p>
        <Link href="/subscription" className="btn-primary mt-4 inline-flex">
          View plans
        </Link>
      </div>
    );
  }

  if (!data) {
    return <p className="text-[var(--ink-muted)]">Loading dashboard…</p>;
  }

  const stats = [
    { label: "Products", value: data.total_products },
    { label: "Customers", value: data.total_customers },
    { label: "Invoices", value: data.total_invoices },
    { label: "Paid revenue", value: `NPR ${Number(data.total_revenue).toLocaleString()}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[var(--navy)]">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Overview of your store activity
        </p>
      </div>

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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold">Low stock</h2>
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
          <h2 className="font-semibold">Recent invoices</h2>
          {data.recent_invoices.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">No invoices yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.recent_invoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between rounded-md bg-[var(--surface)] px-3 py-2 text-sm"
                >
                  <span>
                    #{inv.invoice_number} · {inv.customer_name}
                  </span>
                  <span className="font-medium">
                    NPR {Number(inv.grand_total).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
