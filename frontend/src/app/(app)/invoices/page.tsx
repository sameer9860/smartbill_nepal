"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Eye,
  FilePlus,
  FileText,
  Printer,
  Trash2,
} from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { ExpiredGate } from "@/components/ExpiredGate";
import { LoadingPage } from "@/components/LoadingCard";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { StatusBadge } from "@/components/StatusBadge";
import { ApiError, coreApi, formatNpr } from "@/lib/api";
import type { Invoice } from "@/lib/types";

export default function InvoicesPage() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await coreApi.invoices());
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
    return items.filter((inv) => {
      const matchesSearch =
        !q ||
        inv.invoice_number.toLowerCase().includes(q) ||
        (inv.customer_name || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" || inv.status.toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, query, statusFilter]);

  const stats = useMemo(() => {
    let paidTotal = 0;
    let pendingTotal = 0;
    for (const inv of items) {
      const amt = Number(inv.grand_total) || 0;
      if (inv.status === "PAID") paidTotal += amt;
      else pendingTotal += amt;
    }
    return { count: items.length, paidTotal, pendingTotal };
  }, [items]);

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await coreApi.deleteInvoice(deleting.id);
      setDeleting(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) setExpired(true);
      else setError(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (expired) return <ExpiredGate />;
  if (loading) return <LoadingPage label="Loading sales invoices…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Invoices"
        description="Create, view, filter, and print Nepal VAT sales invoices"
        actions={
          <Link href="/invoices/create" className="btn-primary">
            <FilePlus className="h-4 w-4" />
            <span>Create Invoice</span>
          </Link>
        }
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {/* Metric summary bar */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Invoices</p>
            <p className="text-xl font-extrabold text-slate-900">{stats.count}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Paid Revenue</p>
            <p className="text-xl font-extrabold text-emerald-700">{formatNpr(stats.paidTotal)}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Pending Due</p>
            <p className="text-xl font-extrabold text-amber-800">{formatNpr(stats.pendingTotal)}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search invoice number or customer name…"
          className="w-full max-w-md"
        />

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold">
          {(["ALL", "PAID", "UNPAID", "PARTIAL"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 transition ${
                statusFilter === st
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No invoices match your selection"
          description="Create sales invoices to start recording transactions."
          action={
            <Link href="/invoices/create" className="btn-primary">
              <FilePlus className="h-4 w-4" />
              <span>Create Invoice</span>
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-500">
                <tr>
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-xs w-12">S.N.</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Invoice No.</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Customer</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Grand Total</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Date</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inv, index) => (
                  <tr key={inv.id} className="transition hover:bg-slate-50/50">
                    <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-indigo-900">
                      {inv.invoice_number}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {inv.customer_name}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatNpr(inv.grand_total)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(inv.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span>View</span>
                        </Link>
                        <Link
                          href={`/invoices/${inv.id}/print`}
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                        >
                          <Printer className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Print</span>
                        </Link>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                          onClick={() => setDeleting(inv)}
                          title="Delete Invoice"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
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

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Invoice"
        danger
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete invoice <strong>#{deleting?.invoice_number}</strong> for{" "}
            <strong>{deleting?.customer_name}</strong>?
          </p>
          <p className="text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
            Deleting an invoice will remove its financial log. Stock quantities will remain as updated.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition"
              disabled={busy}
              onClick={() => void confirmDelete()}
            >
              {busy ? "Deleting…" : "Delete Invoice"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

