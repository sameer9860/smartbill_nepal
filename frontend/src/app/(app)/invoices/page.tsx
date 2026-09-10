"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { ExpiredGate } from "@/components/ExpiredGate";
import { LoadingPage } from "@/components/LoadingCard";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ApiError, coreApi, formatNpr } from "@/lib/api";
import type { Invoice } from "@/lib/types";

export default function InvoicesPage() {
  const [items, setItems] = useState<Invoice[]>([]);
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
  if (loading) return <LoadingPage label="Loading invoices…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Create and manage sales invoices"
        actions={
          <Link href="/invoices/create" className="btn-primary">
            Create invoice
          </Link>
        }
      />

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create your first invoice to track sales."
          action={
            <Link href="/invoices/create" className="btn-primary">
              Create invoice
            </Link>
          }
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((inv) => (
                <tr key={inv.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-3 font-medium">#{inv.invoice_number}</td>
                  <td className="px-4 py-3">{inv.customer_name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3">{formatNpr(inv.grand_total)}</td>
                  <td className="px-4 py-3 text-[var(--ink-muted)]">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-sm text-[var(--navy-2)] hover:underline"
                      >
                        View
                      </Link>
                      <Link
                        href={`/invoices/${inv.id}/print`}
                        className="text-sm text-[var(--navy-2)] hover:underline"
                      >
                        Print
                      </Link>
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => setDeleting(inv)}
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
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete invoice"
        danger
      >
        <p className="text-sm text-[var(--ink-muted)]">
          Delete invoice <strong>#{deleting?.invoice_number}</strong>? This cannot
          be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setDeleting(null)}>
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
