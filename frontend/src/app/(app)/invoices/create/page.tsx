"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ExpiredGate } from "@/components/ExpiredGate";
import { LoadingPage } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { ApiError, coreApi, formatNpr } from "@/lib/api";
import type { Customer, Product } from "@/lib/types";

type LineItem = {
  product: string;
  quantity: string;
  unit_price: string;
};

function blankRow(): LineItem {
  return { product: "", quantity: "1", unit_price: "" };
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [customerType, setCustomerType] = useState<"existing" | "walkin">(
    "existing"
  );
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [walkinName, setWalkinName] = useState("");
  const [walkinPhone, setWalkinPhone] = useState("");
  const [status, setStatus] = useState("UNPAID");
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    blankRow(),
    blankRow(),
    blankRow(),
  ]);

  useEffect(() => {
    Promise.all([coreApi.products(), coreApi.customers()])
      .then(([prods, custs]) => {
        setProducts(prods);
        setCustomers(custs);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 402) setExpired(true);
        else setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    const list = customers.filter((c) => c.phone !== "Walk-in");
    if (!q) return list;
    return list.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const selectedCustomer = customers.find((c) => String(c.id) === customerId);

  const totals = useMemo(() => {
    let subtotal = 0;
    for (const row of items) {
      const qty = Number(row.quantity) || 0;
      const price = Number(row.unit_price) || 0;
      if (row.product && qty > 0) subtotal += qty * price;
    }
    const discPct = Number(discount) || 0;
    const taxPct = Number(tax) || 0;
    const discountAmount = (subtotal * discPct) / 100;
    const taxAmount = ((subtotal - discountAmount) * taxPct) / 100;
    const grand = subtotal - discountAmount + taxAmount;
    return { subtotal, discountAmount, taxAmount, grand };
  }, [items, discount, tax]);

  function updateRow(index: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, ...patch };
        if (patch.product !== undefined) {
          const prod = products.find((p) => String(p.id) === patch.product);
          if (prod) next.unit_price = String(prod.price);
        }
        return next;
      })
    );
  }

  async function resolveCustomerId(): Promise<number> {
    if (customerType === "existing") {
      if (!customerId) throw new Error("Select a customer");
      return Number(customerId);
    }
    const name = walkinName.trim();
    if (!name) throw new Error("Enter walk-in customer name");
    const phone = walkinPhone.trim();
    const existing =
      customers.find(
        (c) =>
          c.full_name.toLowerCase() === name.toLowerCase() &&
          (phone ? c.phone === phone : true)
      ) || null;
    if (existing) return existing.id;
    const created = await coreApi.createCustomer({
      full_name: name,
      phone: phone || "Walk-in",
    });
    return created.id;
  }

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const lineItems = items
        .filter((r) => r.product && Number(r.quantity) > 0)
        .map((r) => ({
          product: Number(r.product),
          quantity: Number(r.quantity),
          unit_price: r.unit_price,
        }));
      if (lineItems.length === 0) {
        throw new Error("Add at least one invoice item");
      }
      for (const line of lineItems) {
        const prod = products.find((p) => p.id === line.product);
        if (prod && line.quantity > prod.stock_quantity) {
          throw new Error(
            `Not enough stock for "${prod.name}". Available: ${prod.stock_quantity}`
          );
        }
      }
      const customer = await resolveCustomerId();
      const invoice = await coreApi.createInvoice({
        customer,
        status,
        discount,
        tax,
        notes,
        items: lineItems,
      });
      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) setExpired(true);
      else setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  if (expired) return <ExpiredGate />;
  if (loading) return <LoadingPage label="Loading invoice form…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create invoice"
        description="Build a multi-line invoice with live totals"
        actions={
          <Link href="/invoices" className="btn-secondary">
            Back to list
          </Link>
        }
      />

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="card space-y-4">
        <h2 className="font-semibold text-[var(--navy)]">Customer</h2>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={customerType === "existing"}
              onChange={() => setCustomerType("existing")}
            />
            Existing customer
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={customerType === "walkin"}
              onChange={() => setCustomerType("walkin")}
            />
            Walk-in customer
          </label>
        </div>

        {customerType === "existing" ? (
          <div className="space-y-3">
            <input
              className="input max-w-md"
              placeholder="Type name or phone to filter…"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            <select
              className="input max-w-md"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Select customer</option>
              {filteredCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.phone})
                </option>
              ))}
            </select>
            {selectedCustomer ? (
              <div className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--navy)] text-sm font-bold text-white">
                  {selectedCustomer.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{selectedCustomer.full_name}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {selectedCustomer.phone}
                    {selectedCustomer.email ? ` · ${selectedCustomer.email}` : ""}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Customer name *</label>
              <input
                className="input"
                value={walkinName}
                onChange={(e) => setWalkinName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Phone (optional)</label>
              <input
                className="input"
                value={walkinPhone}
                onChange={(e) => setWalkinPhone(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="card grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="PAID">PAID</option>
            <option value="UNPAID">UNPAID</option>
            <option value="PARTIAL">PARTIAL</option>
          </select>
        </div>
        <div>
          <label className="label">Discount (%)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Tax / VAT (%)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
          />
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[var(--navy)]">Invoice items</h2>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setItems((prev) => [...prev, blankRow()])}
          >
            Add row
          </button>
        </div>
        <div className="space-y-3">
          {items.map((row, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 sm:grid-cols-12"
            >
              <div className="sm:col-span-5">
                <label className="label">Product</label>
                <select
                  className="input"
                  value={row.product}
                  onChange={(e) => updateRow(index, { product: e.target.value })}
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (stock {p.stock_quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Qty</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={row.quantity}
                  onChange={(e) => updateRow(index, { quantity: e.target.value })}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="label">Unit price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={row.unit_price}
                  onChange={(e) =>
                    updateRow(index, { unit_price: e.target.value })
                  }
                />
              </div>
              <div className="flex items-end sm:col-span-2">
                <button
                  type="button"
                  className="btn-secondary w-full"
                  onClick={() =>
                    setItems((prev) =>
                      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-3">
        <label className="label">Notes</label>
        <textarea
          className="input min-h-[80px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes…"
        />
        <div className="rounded-lg bg-[var(--surface)] p-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatNpr(totals.subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-red-700">
            <span>Discount</span>
            <span>- {formatNpr(totals.discountAmount)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span>Tax</span>
            <span>{formatNpr(totals.taxAmount)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-[var(--line)] pt-3 text-lg font-semibold text-[var(--navy)]">
            <span>Grand total</span>
            <span>{formatNpr(totals.grand)}</span>
          </div>
        </div>
        <button
          type="button"
          className="btn-primary w-full sm:w-auto"
          disabled={busy}
          onClick={() => void submit()}
        >
          {busy ? "Creating…" : "Create invoice"}
        </button>
      </div>
    </div>
  );
}
