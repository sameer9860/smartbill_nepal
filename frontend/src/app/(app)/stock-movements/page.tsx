"use client";

import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { ExpiredGate } from "@/components/ExpiredGate";
import { LoadingPage } from "@/components/LoadingCard";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ApiError, coreApi } from "@/lib/api";
import type { Product, StockMovement } from "@/lib/types";

export default function StockMovementsPage() {
  const [items, setItems] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [productId, setProductId] = useState("");
  const [movementType, setMovementType] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      const [movements, prods] = await Promise.all([
        coreApi.stockMovements(),
        coreApi.products(),
      ]);
      setItems(movements);
      setProducts(prods);
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

  async function saveMovement() {
    if (!productId || !quantity) return;
    setBusy(true);
    setError("");
    try {
      await coreApi.createStockMovement({
        product: Number(productId),
        movement_type: movementType,
        quantity: Number(quantity),
        reason,
      });
      setFormOpen(false);
      setProductId("");
      setQuantity("1");
      setReason("");
      setMovementType("IN");
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) setExpired(true);
      else setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (expired) return <ExpiredGate />;
  if (loading) return <LoadingPage label="Loading stock log…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock log"
        description="Track stock in and out movements"
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setFormOpen(true)}
          >
            Add movement
          </button>
        }
      />

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="No stock movements"
          description="Record purchases or adjustments to keep inventory accurate."
          action={
            <button
              type="button"
              className="btn-primary"
              onClick={() => setFormOpen(true)}
            >
              Add movement
            </button>
          }
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-3 text-[var(--ink-muted)]">
                    {new Date(m.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium">{m.product_name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.movement_type === "IN" ? "UP" : "DOWN"} />
                    <span className="ml-2 text-xs font-semibold">{m.movement_type}</span>
                  </td>
                  <td className="px-4 py-3">{m.quantity}</td>
                  <td className="px-4 py-3 text-[var(--ink-muted)]">
                    {m.reason || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add stock movement"
      >
        <div className="space-y-3">
          <div>
            <label className="label">Product</label>
            <select
              className="input"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (stock {p.stock_quantity})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as "IN" | "OUT")}
            >
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input
              type="number"
              min="1"
              className="input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Reason</label>
            <input
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Purchase, adjustment, damage…"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || !productId || !quantity}
            onClick={() => void saveMovement()}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
