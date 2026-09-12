"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, History, Plus } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { ExpiredGate } from "@/components/ExpiredGate";
import { LoadingPage } from "@/components/LoadingCard";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";

import { ApiError, coreApi, formatNpr } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function LowStockPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");

  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState("10");
  const [restockReason, setRestockReason] = useState("Low Stock Urgent Purchase");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await coreApi.lowStockProducts());
      setError("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) setExpired(true);
      else setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRestock() {
    if (!restockProduct || !restockQty) return;
    setBusy(true);
    setError("");
    try {
      await coreApi.createStockMovement({
        product: restockProduct.id,
        movement_type: "IN",
        quantity: Number(restockQty),
        reason: restockReason,
      });
      setRestockProduct(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) setExpired(true);
      else setError(err instanceof ApiError ? err.message : "Restock failed");
    } finally {
      setBusy(false);
    }
  }

  if (expired) return <ExpiredGate />;
  if (loading) return <LoadingPage label="Loading low stock inventory alerts…" />;
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Low Stock Alerts"
        description="Products at or below their low-stock threshold requiring urgent replenishment"
        actions={
          <Link href="/stock-movements" className="btn-secondary">
            <History className="h-4 w-4" />
            <span>View Full Stock Log</span>
          </Link>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="All products are well stocked!"
          description="No products are currently below their low-stock warning threshold."
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                {items.length} Product{items.length === 1 ? "" : "s"} require immediate restock
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Restock stock inventory before products run out completely to prevent lost sales.
              </p>
            </div>
          </div>

          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-xs w-12">S.N.</th>
                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Product Details</th>
                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Category</th>
                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Unit Price</th>
                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Current Stock</th>
                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Min Threshold</th>
                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Deficit</th>
                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((p, index) => {
                    const deficit = Math.max(0, p.low_stock_threshold - p.stock_quantity);
                    return (
                      <tr key={p.id} className="transition hover:bg-slate-50/50">
                        <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {p.category_name ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                              {p.category_name}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{formatNpr(p.price)}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-800">
                            {p.stock_quantity} remaining
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600">{p.low_stock_threshold}</td>
                        <td className="px-6 py-4 font-mono font-bold text-rose-600">-{deficit}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            className="btn-primary py-1.5 px-3 text-xs"
                            onClick={() => {
                              setRestockProduct(p);
                              setRestockQty(String(Math.max(10, deficit + 10)));
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Restock Now</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      <Modal
        open={!!restockProduct}
        onClose={() => setRestockProduct(null)}
        title={`Restock — ${restockProduct?.name || ""}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleRestock();
          }}
          className="space-y-4"
        >
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            Current Stock: <strong>{restockProduct?.stock_quantity}</strong> | Minimum Threshold:{" "}
            <strong>{restockProduct?.low_stock_threshold}</strong>
          </div>

          <div>
            <label className="label" htmlFor="low-restock-qty">
              Restock Quantity (Stock IN) *
            </label>
            <input
              id="low-restock-qty"
              type="number"
              min="1"
              className="input"
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="low-restock-reason">
              Reason / Source
            </label>
            <input
              id="low-restock-reason"
              className="input"
              value={restockReason}
              onChange={(e) => setRestockReason(e.target.value)}
              placeholder="e.g. Urgent supplier delivery"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setRestockProduct(null)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy || !restockQty}>
              {busy ? "Updating…" : "Confirm Restock"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

