"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
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
    if (!q) return items;
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category_name || "").toLowerCase().includes(q)
    );
  }, [items, query]);

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

  async function saveProduct() {
    if (!form.name.trim() || !form.price) return;
    setBusy(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      description: form.description,
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
  if (loading) return <LoadingPage label="Loading products…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage inventory, pricing, and stock levels"
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            Add product
          </button>
        }
      />

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search by name or category…"
        className="max-w-md"
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Add products to start creating invoices."
          action={
            <button type="button" className="btn-primary" onClick={openCreate}>
              Add product
            </button>
          }
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.name}</p>
                    {p.description ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-[var(--ink-muted)]">
                        {p.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-muted)]">
                    {p.category_name || "—"}
                  </td>
                  <td className="px-4 py-3">{formatNpr(p.price)}</td>
                  <td className="px-4 py-3">{p.stock_quantity}</td>
                  <td className="px-4 py-3">
                    {p.is_low_stock ? (
                      <StatusBadge status="LOW" />
                    ) : (
                      <span className="text-xs font-medium text-emerald-700">OK</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-sm text-[var(--navy-2)] hover:underline"
                        onClick={() => openEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => {
                          setEditing(p);
                          setDeleteOpen(true);
                        }}
                      >
                        Delete
                      </button>
                    </div>
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
        title={editing ? "Edit product" : "Add product"}
        wide
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="prod-name">
              Name
            </label>
            <input
              id="prod-name"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="prod-desc">
              Description
            </label>
            <textarea
              id="prod-desc"
              className="input min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="prod-price">
              Price (NPR)
            </label>
            <input
              id="prod-price"
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="prod-stock">
              Stock quantity
            </label>
            <input
              id="prod-stock"
              type="number"
              min="0"
              className="input"
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="prod-threshold">
              Low stock threshold
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
            disabled={busy || !form.name.trim() || !form.price}
            onClick={() => void saveProduct()}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete product"
        danger
      >
        <p className="text-sm text-[var(--ink-muted)]">
          Delete <strong>{editing?.name}</strong>? This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setDeleteOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            disabled={busy}
            onClick={() => void confirmDelete()}
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
