"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { ApiError, coreApi } from "@/lib/api";
import type { Customer, Invoice, Product } from "@/lib/types";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customer: "",
    product: "",
    quantity: "1",
    status: "UNPAID",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [inv, cust, prod] = await Promise.all([
        coreApi.invoices(),
        coreApi.customers(),
        coreApi.products(),
      ]);
      setInvoices(inv);
      setCustomers(cust);
      setProducts(prod);
      setError("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setError("Trial expired. Subscribe to continue.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load invoices");
      }
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.customer || !form.product) return;
    setSaving(true);
    try {
      const product = products.find((p) => p.id === Number(form.product));
      await coreApi.createInvoice({
        customer: Number(form.customer),
        status: form.status,
        items: [
          {
            product: Number(form.product),
            quantity: Number(form.quantity) || 1,
            unit_price: product?.price,
          },
        ],
      });
      setForm({ customer: "", product: "", quantity: "1", status: "UNPAID" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invoice");
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
        <h1 className="font-display text-3xl text-[var(--navy)]">Invoices</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Create bills with Nepal VAT defaults
        </p>
      </div>

      <form onSubmit={onCreate} className="card grid gap-3 md:grid-cols-5">
        <select
          className="input"
          value={form.customer}
          onChange={(e) => setForm({ ...form, customer: e.target.value })}
          required
        >
          <option value="">Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={form.product}
          onChange={(e) => setForm({ ...form, product: e.target.value })}
          required
        >
          <option value="">Product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          className="input"
          type="number"
          min="1"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
        />
        <select
          className="input"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="UNPAID">Unpaid</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial</option>
        </select>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Creating…" : "Create invoice"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Invoice</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3 font-medium">#{inv.invoice_number}</td>
                <td className="px-4 py-3">{inv.customer_name}</td>
                <td className="px-4 py-3">{inv.status}</td>
                <td className="px-4 py-3">
                  NPR {Number(inv.grand_total).toLocaleString()}
                </td>
              </tr>
            ))}
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--ink-muted)]">
                  No invoices yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
