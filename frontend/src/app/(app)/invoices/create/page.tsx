"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  FilePlus,
  Plus,
  Trash2,
  User,
} from "lucide-react";

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

  const [customerType, setCustomerType] = useState<"existing" | "walkin">("existing");
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [walkinName, setWalkinName] = useState("");
  const [walkinPhone, setWalkinPhone] = useState("");
  const [status, setStatus] = useState("PAID");
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("13"); // Default to 13% Nepal VAT
  const [notes, setNotes] = useState("Thank you for your business!");
  const [items, setItems] = useState<LineItem[]>([blankRow()]);

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
    const discPct = Math.max(0, Number(discount) || 0);
    const taxPct = Math.max(0, Number(tax) || 0);
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
      if (!customerId) throw new Error("Please select an existing customer");
      return Number(customerId);
    }
    const name = walkinName.trim();
    if (!name) throw new Error("Please enter walk-in customer name");
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
        throw new Error("Add at least one valid product line item");
      }

      for (const line of lineItems) {
        const prod = products.find((p) => p.id === line.product);
        if (prod && line.quantity > prod.stock_quantity) {
          throw new Error(
            `Stock quantity error: Product "${prod.name}" only has ${prod.stock_quantity} available in stock.`
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
      else setError(err instanceof Error ? err.message : "Invoice creation failed");
    } finally {
      setBusy(false);
    }
  }

  if (expired) return <ExpiredGate />;
  if (loading) return <LoadingPage label="Loading invoice form details…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Sales Invoice"
        description="Generate POS invoice with Nepal 13% VAT and automatic inventory deduction"
        actions={
          <Link href="/invoices" className="btn-secondary">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Invoices</span>
          </Link>
        }
      />

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {/* Customer Selection Card */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" />
                <span>Customer Details</span>
              </h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="custType"
                    checked={customerType === "existing"}
                    onChange={() => setCustomerType("existing")}
                    className="accent-indigo-600"
                  />
                  <span>Existing</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="custType"
                    checked={customerType === "walkin"}
                    onChange={() => setCustomerType("walkin")}
                    className="accent-indigo-600"
                  />
                  <span>Walk-in Customer</span>
                </label>
              </div>
            </div>

            {customerType === "existing" ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="input"
                    placeholder="Search customer by name or phone…"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                  <select
                    className="input"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                  >
                    <option value="">-- Select Customer --</option>
                    {filteredCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCustomer ? (
                  <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {selectedCustomer.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{selectedCustomer.full_name}</p>
                      <p className="text-xs text-slate-500">
                        Phone: {selectedCustomer.phone}
                        {selectedCustomer.email ? ` · ${selectedCustomer.email}` : ""}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Customer Full Name *</label>
                  <input
                    className="input"
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    placeholder="e.g. Cash Sales Customer"
                  />
                </div>
                <div>
                  <label className="label">Phone Number (Optional)</label>
                  <input
                    className="input"
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value)}
                    placeholder="e.g. 9841000000"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Line Items Card */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-display text-base font-bold text-slate-900">Line Items</h2>
              <button
                type="button"
                className="btn-secondary py-1.5 text-xs"
                onClick={() => setItems((prev) => [...prev, blankRow()])}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((row, index) => {
                const selectedProd = products.find((p) => String(p.id) === row.product);
                const isOutOfStock =
                  selectedProd && (Number(row.quantity) || 0) > selectedProd.stock_quantity;
                const rowTotal =
                  (Number(row.quantity) || 0) * (Number(row.unit_price) || 0);

                return (
                  <div
                    key={index}
                    className={`grid gap-3 rounded-xl border p-3.5 transition sm:grid-cols-12 ${
                      isOutOfStock ? "border-red-300 bg-red-50/50" : "border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    <div className="sm:col-span-5">
                      <label className="label">Select Product</label>
                      <select
                        className="input"
                        value={row.product}
                        onChange={(e) => updateRow(index, { product: e.target.value })}
                      >
                        <option value="">-- Choose Item --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.stock_quantity}) — {formatNpr(p.price)}
                          </option>
                        ))}
                      </select>
                      {selectedProd ? (
                        <p className={`mt-1 text-[11px] font-medium ${isOutOfStock ? "text-red-700" : "text-slate-500"}`}>
                          Available stock: {selectedProd.stock_quantity}
                        </p>
                      ) : null}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="label">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        className="input"
                        value={row.quantity}
                        onChange={(e) => updateRow(index, { quantity: e.target.value })}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="label">Unit Price (NPR)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input"
                        value={row.unit_price}
                        onChange={(e) => updateRow(index, { unit_price: e.target.value })}
                      />
                    </div>

                    <div className="flex items-end justify-between sm:col-span-2 gap-2">
                      <div className="hidden sm:block text-right min-w-0 flex-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Total</p>
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {formatNpr(rowTotal)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        onClick={() =>
                          setItems((prev) =>
                            prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
                          )
                        }
                        title="Remove Line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes Card */}
          <div className="card space-y-2">
            <label className="label">Invoice Remarks / Notes</label>
            <textarea
              className="input min-h-[70px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Terms of payment, warranty info, or thank you note…"
            />
          </div>
        </div>

        {/* Right Sidebar: Calculations & Status */}
        <div className="space-y-6 lg:col-span-4">
          <div className="card space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Payment & Tax Settings
            </h2>

            <div>
              <label className="label">Payment Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="PAID">PAID (Full Cash / Digital)</option>
                <option value="UNPAID">UNPAID (On Credit)</option>
                <option value="PARTIAL">PARTIAL (Partial Deposit)</option>
              </select>
            </div>

            <div>
              <label className="label">Discount (% Off)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="input"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="label">Nepal VAT / Tax (%)</label>
                <button
                  type="button"
                  className="text-[11px] font-bold text-indigo-600 hover:underline"
                  onClick={() => setTax(tax === "13" ? "0" : "13")}
                >
                  {tax === "13" ? "No Tax (0%)" : "Nepal 13% VAT"}
                </button>
              </div>
              <input
                type="number"
                min="0"
                step="0.1"
                className="input"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
              />
            </div>
          </div>

          {/* Live Summary Total Card */}
          <div className="card bg-slate-900 text-white space-y-4">
            <h3 className="font-display text-sm uppercase tracking-wider text-slate-400">
              Invoice Summary
            </h3>

            <div className="space-y-2 text-sm border-b border-slate-800 pb-4">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                <span>{formatNpr(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Discount ({discount}%)</span>
                <span>- {formatNpr(totals.discountAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>VAT / Tax ({tax}%)</span>
                <span>+ {formatNpr(totals.taxAmount)}</span>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="font-display text-lg font-bold text-white">Grand Total</span>
              <span className="font-display text-2xl font-extrabold text-indigo-400">
                {formatNpr(totals.grand)}
              </span>
            </div>

            <button
              type="button"
              className="btn-primary w-full bg-indigo-600 hover:bg-indigo-500 py-3 text-base shadow-lg shadow-indigo-600/30"
              disabled={busy}
              onClick={() => void submit()}
            >
              <FilePlus className="h-5 w-5" />
              <span>{busy ? "Generating Invoice…" : "Finalize & Save Invoice"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

