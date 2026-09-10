"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { ExpiredGate } from "@/components/ExpiredGate";
import { LoadingPage } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ApiError, coreApi, formatNpr } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function LowStockPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    coreApi
      .lowStockProducts()
      .then(setItems)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 402) setExpired(true);
        else setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  }, []);

  if (expired) return <ExpiredGate />;
  if (loading) return <LoadingPage label="Loading low stock…" />;
  if (error) {
    return (
      <div className="card border-red-200 bg-red-50 text-red-800">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Low stock"
        description="Products at or below their threshold"
        actions={
          <Link href="/stock-movements" className="btn-secondary">
            Stock log
          </Link>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="All stocked up"
          description="No products are currently below their low-stock threshold."
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Threshold</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-[var(--ink-muted)]">
                    {p.category_name || "—"}
                  </td>
                  <td className="px-4 py-3">{formatNpr(p.price)}</td>
                  <td className="px-4 py-3 font-semibold text-amber-700">
                    {p.stock_quantity}
                  </td>
                  <td className="px-4 py-3">{p.low_stock_threshold}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status="LOW" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
