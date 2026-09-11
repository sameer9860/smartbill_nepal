"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Package,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { ExpiredGate } from "@/components/ExpiredGate";
import { LoadingPage } from "@/components/LoadingCard";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";

import { ApiError, coreApi } from "@/lib/api";
import type { Product, StockMovement } from "@/lib/types";

const REASON_PRESETS = [
  "New Purchase",
  "Inventory Audit / Adjustment",
  "Damaged Goods",
  "Customer Return",
  "Internal Use / Sample",
];

export default function StockMovementsPage() {
  const [items, setItems] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "IN" | "OUT">("ALL");
  const [search, setSearch] = useState("");
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
      else setError(err instanceof Error ? err.message : "Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesType = typeFilter === "ALL" || item.movement_type === typeFilter;
      const query = search.trim().toLowerCase();
      const matchesQuery =
        !query ||
        item.product_name.toLowerCase().includes(query) ||
        (item.reason && item.reason.toLowerCase().includes(query));
      return matchesType && matchesQuery;
    });
  }, [items, typeFilter, search]);

  const stats = useMemo(() => {
    const totalIn = items
      .filter((i) => i.movement_type === "IN")
      .reduce((acc, i) => acc + i.quantity, 0);
    const totalOut = items
      .filter((i) => i.movement_type === "OUT")
      .reduce((acc, i) => acc + i.quantity, 0);
    return { totalIn, totalOut, totalLogs: items.length };
  }, [items]);

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
  if (loading) return <LoadingPage label="Loading stock movements log…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Log"
        description="Audit trail of all inventory restocks, sales deductions, and adjustments"
        actions={
          <button
            type="button"
            className="btn-primary flex items-center gap-2 shadow-sm"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Movement
          </button>
        }
      />

      {error ? (
        <div className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              Total Stock Received
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-emerald-600">
              +{stats.totalIn} units
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              Total Stock Deducted
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-amber-600">
              -{stats.totalOut} units
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40">
            <ArrowDownRight className="h-6 w-6" />
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              Total Recorded Log Entries
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-[var(--navy)]">
              {stats.totalLogs} logs
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
            <Package className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by product name or reason…"
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-[var(--surface-2)] p-1">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              typeFilter === "ALL"
                ? "bg-[var(--surface)] text-[var(--navy)] shadow-sm"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
            onClick={() => setTypeFilter("ALL")}
          >
            All Logs
          </button>
          <button
            type="button"
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              typeFilter === "IN"
                ? "bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-950 dark:text-emerald-300"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
            onClick={() => setTypeFilter("IN")}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Stock IN
          </button>
          <button
            type="button"
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              typeFilter === "OUT"
                ? "bg-amber-50 text-amber-700 shadow-sm dark:bg-amber-950 dark:text-amber-300"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
            onClick={() => setTypeFilter("OUT")}
          >
            <ArrowDownRight className="h-3.5 w-3.5" />
            Stock OUT
          </button>
        </div>
      </div>

      {/* Content Area */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title={search || typeFilter !== "ALL" ? "No matching stock logs" : "No stock movements recorded"}
          description={
            search || typeFilter !== "ALL"
              ? "Try resetting your search query or type filter."
              : "Record purchases, returns, or manual inventory adjustments to maintain exact stock levels."
          }
          action={
            search || typeFilter !== "ALL" ? (
              <button
                type="button"
                className="btn-secondary flex items-center gap-2"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("ALL");
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Reset Filters
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary flex items-center gap-2"
                onClick={() => setFormOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Movement
              </button>
            )
          }
        />
      ) : (
        <div className="card overflow-hidden p-0 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-muted)]">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Date & Time</th>
                  <th className="px-5 py-3.5 font-semibold">Product Name</th>
                  <th className="px-5 py-3.5 font-semibold">Direction</th>
                  <th className="px-5 py-3.5 font-semibold">Quantity</th>
                  <th className="px-5 py-3.5 font-semibold">Reason / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredItems.map((m) => {
                  const dateStr = new Date(m.created_at).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  });
                  const isIN = m.movement_type === "IN";
                  return (
                    <tr
                      key={m.id}
                      className="transition-colors hover:bg-[var(--surface-2)]/50"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-[var(--ink-muted)]">
                        {dateStr}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-[var(--navy)]">
                        {m.product_name}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isIN
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {isIN ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          )}
                          {isIN ? "Stock IN" : "Stock OUT"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold">
                        <span className={isIN ? "text-emerald-600" : "text-amber-600"}>
                          {isIN ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[var(--ink-muted)]">
                        {m.reason || "No note attached"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Movement Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add Stock Movement"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Target Product *</label>
            <select
              className="input"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Select product from inventory…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current Stock: {p.stock_quantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Movement Type *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-all ${
                  movementType === "IN"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-emerald-300"
                }`}
                onClick={() => setMovementType("IN")}
              >
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                Stock IN (Add)
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-all ${
                  movementType === "OUT"
                    ? "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-amber-300"
                }`}
                onClick={() => setMovementType("OUT")}
              >
                <ArrowDownRight className="h-4 w-4 text-amber-600" />
                Stock OUT (Deduct)
              </button>
            </div>
          </div>

          <div>
            <label className="label">Quantity *</label>
            <input
              type="number"
              min="1"
              className="input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
            />
          </div>

          <div>
            <label className="label">Reason / Reference Note</label>
            <input
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Received shipment, damage audit, returned goods…"
            />
            {/* Quick Presets */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {REASON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--ink-muted)] transition-colors hover:border-[var(--navy)] hover:text-[var(--navy)]"
                  onClick={() => setReason(preset)}
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-[var(--line)] pt-4">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setFormOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || !productId || !quantity}
            onClick={() => void saveMovement()}
          >
            {busy ? "Saving Log…" : "Save Movement"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

