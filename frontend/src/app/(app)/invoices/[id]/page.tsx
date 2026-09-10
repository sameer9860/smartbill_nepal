"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ExpiredGate } from "@/components/ExpiredGate";
import { LoadingPage } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ApiError, coreApi, formatNpr } from "@/lib/api";
import type { Invoice } from "@/lib/types";

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    coreApi
      .invoice(id)
      .then(setInvoice)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 402) setExpired(true);
        else setError(err instanceof Error ? err.message : "Failed to load");
      });
  }, [id]);

  if (expired) return <ExpiredGate />;
  if (error) {
    return (
      <div className="card border-red-200 bg-red-50 text-red-800">{error}</div>
    );
  }
  if (!invoice) return <LoadingPage label="Loading invoice…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice #${invoice.invoice_number}`}
        description={`Created ${new Date(invoice.created_at).toLocaleString()}`}
        actions={
          <>
            <Link href="/invoices" className="btn-secondary">
              Back
            </Link>
            <Link href={`/invoices/${invoice.id}/print`} className="btn-primary">
              Print
            </Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm text-[var(--ink-muted)]">Billed to</p>
              <p className="mt-1 text-lg font-semibold">{invoice.customer_name}</p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-[var(--line)] text-[var(--ink-muted)]">
                <tr>
                  <th className="py-2 font-medium">#</th>
                  <th className="py-2 font-medium">Product</th>
                  <th className="py-2 font-medium">Qty</th>
                  <th className="py-2 font-medium">Unit price</th>
                  <th className="py-2 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, idx) => (
                  <tr key={item.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="py-2">{idx + 1}</td>
                    <td className="py-2">{item.product_name}</td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2">{formatNpr(item.unit_price)}</td>
                    <td className="py-2">{formatNpr(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatNpr(invoice.total_amount)}</span>
          </div>
          <div className="flex justify-between text-red-700">
            <span>Discount ({invoice.discount}%)</span>
            <span>- {formatNpr(invoice.discount_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({invoice.tax}%)</span>
            <span>{formatNpr(invoice.tax_amount)}</span>
          </div>
          <div className="flex justify-between border-t border-[var(--line)] pt-3 text-lg font-semibold text-[var(--navy)]">
            <span>Grand total</span>
            <span>{formatNpr(invoice.grand_total)}</span>
          </div>
          {invoice.notes ? (
            <div className="mt-4 rounded-md bg-[var(--surface)] p-3">
              <p className="text-xs font-medium text-[var(--ink-muted)]">Notes</p>
              <p className="mt-1">{invoice.notes}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
