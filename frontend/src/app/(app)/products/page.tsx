"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { ApiError, coreApi } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock_quantity: "0",
    low_stock_threshold: "10",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setProducts(await coreApi.products());
      setError("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setError("Trial expired. Subscribe to continue.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load products");
      }
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await coreApi.createProduct({
        name: form.name.trim(),
        price: form.price,
        stock_quantity: Number(form.stock_quantity) || 0,
        low_stock_threshold: Number(form.low_stock_threshold) || 10,
      });
      setForm({
        name: "",
        price: "",
        stock_quantity: "0",
        low_stock_threshold: "10",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create product");
    } finally {
      setSaving(false);
    }
  }

  if (error.includes("Trial expired")) {
    return (
      <div className="card border-amber-200 bg-amber-50">
        <p className="font-medium text-amber-950">{error}</p>
        <Link href="/subscription" className="btn-primary mt-4 inline-flex">
          View plans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[var(--navy)]">Products</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Manage inventory for your store
        </p>
      </div>

      <form onSubmit={onCreate} className="card grid gap-3 md:grid-cols-5">
        <input
          className="input md:col-span-2"
          placeholder="Product name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Price"
          type="number"
          step="0.01"
          min="0"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Stock"
          type="number"
          min="0"
          value={form.stock_quantity}
          onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
        />
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Adding…" : "Add product"}
        </button>
      </form>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">NPR {Number(p.price).toLocaleString()}</td>
                <td className="px-4 py-3">{p.stock_quantity}</td>
                <td className="px-4 py-3">
                  {p.is_low_stock ? (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      Low stock
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                      OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--ink-muted)]">
                  No products yet. Add your first item above.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
