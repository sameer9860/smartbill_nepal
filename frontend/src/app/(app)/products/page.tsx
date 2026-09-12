"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { History, Package, Pencil, Plus, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { ExpiredGate } from "@/components/ExpiredGate";
import { LoadingPage } from "@/components/LoadingCard";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { StatusBadge } from "@/components/StatusBadge";
import { ApiError, coreApi, formatNpr } from "@/lib/api";
import type { Category, Product } from "@/lib/types";

type FormState = {
  name: string;
  description: string;
  price: string;
  stock_quantity: string;
  low_stock_threshold: string;
  category: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
  stock_quantity: "0",
  low_stock_threshold: "5",
  category: "",
};

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [stockFilter, setStockFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [restockQty, setRestockQty] = useState("10");
  const [restockReason, setRestockReason] = useState("Purchase / Stock Addition");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [products, cats] = await Promise.all([
        coreApi.products(),
        coreApi.categories(),
      ]);
      setItems(products);
      setCategories(cats);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.category_name || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q);

      const matchesCat =
        categoryFilter === "ALL" ||
        (categoryFilter === "NONE" && !p.category) ||
        String(p.category) === categoryFilter;

      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "LOW" && p.is_low_stock) ||
        (stockFilter === "OK" && !p.is_low_stock);

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [items, query, categoryFilter, stockFilter]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      stock_quantity: String(product.stock_quantity),
      low_stock_threshold: String(product.low_stock_threshold),
      category: product.category != null ? String(product.category) : "",
    });
    setFormOpen(true);
  }

  function openRestock(product: Product) {
    setEditing(product);
    setRestockQty("10");
    setRestockReason("Purchase / Stock Addition");
    setRestockOpen(true);
  }

  async function saveProduct() {
    if (!form.name.trim() || !form.price) return;
    setBusy(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price,
      stock_quantity: Number(form.stock_quantity) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 0,
      category: form.category ? Number(form.category) : null,
    };
    try {
      if (editing) {
        await coreApi.updateProduct(editing.id, payload);
      } else {
        await coreApi.createProduct(payload);
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) setExpired(true);
      else setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveQuickRestock() {
    if (!editing || !restockQty) return;
    setBusy(true);
    setError("");
    try {
      await coreApi.createStockMovement({
        product: editing.id,
        movement_type: "IN",
        quantity: Number(restockQty),
        reason: restockReason,
      });
      setRestockOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) setExpired(true);
      else setError(err instanceof ApiError ? err.message : "Restock failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!editing) return;
    setBusy(true);
    try {
      await coreApi.deleteProduct(editing.id);
      setDeleteOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) setExpired(true);
      else setError(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (expired) return <ExpiredGate />;
  if (loading) return <LoadingPage label="Loading products inventory…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Inventory"
        description="Manage product catalog, pricing, Nepal VAT suitability, and stock levels"
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        }
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search products by name or category…"
          className="w-full max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input max-w-[180px]"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="NONE">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="input max-w-[150px]"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="ALL">All Stock Status</option>
            <option value="LOW">Low Stock Only</option>
            <option value="OK">In Stock Only</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No products match your search"
          description="Try clearing your filters or add a new product to your inventory."
          action={
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-500">
                <tr>
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-xs w-12">S.N.</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Product Details</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Category</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Unit Price</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Stock Level</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p, index) => (
                  <tr key={p.id} className="transition hover:bg-slate-50/50">
                    <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          {p.description ? (
                            <p className="mt-0.5 max-w-xs line-clamp-1 text-xs text-slate-500">
                              {p.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.category_name ? (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {p.category_name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{formatNpr(p.price)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-extrabold ${
                            p.is_low_stock ? "text-amber-700" : "text-slate-900"
                          }`}
                        >
                          {p.stock_quantity}
                        </span>
                        <span className="text-xs text-slate-400">/ min {p.low_stock_threshold}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.is_low_stock ? (
                        <StatusBadge status="LOW" />
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          ✓ In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
                          onClick={() => openRestock(p)}
                          title="Quick Restock"
                        >
                          <History className="h-3.5 w-3.5" />
                          <span>Restock</span>
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 transition"
                          onClick={() => openEdit(p)}
                          title="Edit Product"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-200 bg-red-50/50 p-1.5 text-red-600 hover:bg-red-100 transition"
                          onClick={() => {
                            setEditing(p);
                            setDeleteOpen(true);
                          }}
                          title="Delete Product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Product" : "Add New Product"}
        wide
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void saveProduct();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="prod-name">
                Product Name *
              </label>
              <input
                id="prod-name"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Wai Wai Noodles 75g (Box of 30)"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label" htmlFor="prod-desc">
                Description (Optional)
              </label>
              <textarea
                id="prod-desc"
                className="input min-h-[70px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short item specification, barcode, or details…"
              />
            </div>

            <div>
              <label className="label" htmlFor="prod-cat">
                Category
              </label>
              <select
                id="prod-cat"
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">No Category (Uncategorized)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="prod-price">
                Unit Selling Price (NPR) *
              </label>
              <input
                id="prod-price"
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="e.g. 600"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="prod-stock">
                Current Stock Quantity *
              </label>
              <input
                id="prod-stock"
                type="number"
                min="0"
                className="input"
                value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="prod-threshold">
                Low Stock Warning Threshold *
              </label>
              <input
                id="prod-threshold"
                type="number"
                min="0"
                className="input"
                value={form.low_stock_threshold}
                onChange={(e) =>
                  setForm({ ...form, low_stock_threshold: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={busy || !form.name.trim() || !form.price}
            >
              {busy ? "Saving…" : "Save Product"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Restock Modal */}
      <Modal
        open={restockOpen}
        onClose={() => setRestockOpen(false)}
        title={`Quick Restock — ${editing?.name || ""}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void saveQuickRestock();
          }}
          className="space-y-4"
        >
          <p className="text-xs text-slate-500">
            Current Stock: <strong className="text-slate-900">{editing?.stock_quantity} units</strong>.
            This will record a Stock IN movement.
          </p>

          <div>
            <label className="label" htmlFor="restock-qty">
              Quantity to Add *
            </label>
            <input
              id="restock-qty"
              type="number"
              min="1"
              className="input"
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="restock-reason">
              Movement Reason
            </label>
            <input
              id="restock-reason"
              className="input"
              value={restockReason}
              onChange={(e) => setRestockReason(e.target.value)}
              placeholder="e.g. New shipment, Audit correction"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setRestockOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy || !restockQty}>
              {busy ? "Updating…" : "Confirm Restock"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Product"
        danger
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <strong>{editing?.name}</strong>?
          </p>
          <p className="text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
            This action cannot be undone. Product data and history will be permanently deleted.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition"
              disabled={busy}
              onClick={() => void confirmDelete()}
            >
              {busy ? "Deleting…" : "Delete Product"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

