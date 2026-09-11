"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Printer } from "lucide-react";

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
  const [busy, setBusy] = useState(false);

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

  async function markPaid() {
    if (!invoice) return;
    setBusy(true);
    try {
      const updated = await coreApi.updateInvoice(invoice.id, {
        customer: invoice.customer,
        status: "PAID",
        discount: String(invoice.discount),
        tax: String(invoice.tax),
        notes: invoice.notes,
      });
      setInvoice(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setBusy(false);
    }
  }

  if (expired) return <ExpiredGate />;
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 font-medium">
        {error}
      </div>
    );
  }
  if (!invoice) return <LoadingPage label="Loading invoice details…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice #${invoice.invoice_number}`}
        description={`Issued on ${new Date(invoice.created_at).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/invoices" className="btn-secondary">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Link>
            {invoice.status !== "PAID" ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition"
                disabled={busy}
                onClick={() => void markPaid()}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Mark Paid</span>
              </button>
            ) : null}
            <Link href={`/invoices/${invoice.id}/print`} className="btn-primary">
              <Printer className="h-4 w-4" />
              <span>Print Invoice</span>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="card space-y-6 lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Billed To Customer</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{invoice.customer_name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Status</p>
              <StatusBadge status={invoice.status} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">#</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">Product Item</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">Qty</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">Unit Price</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(invoice.items || []).map((item, idx) => (
                  <tr key={item.id} className="transition hover:bg-slate-50/50">
                    <td className="px-4 py-3.5 text-slate-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{item.product_name}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">{item.quantity}</td>
                    <td className="px-4 py-3.5 text-slate-700">{formatNpr(item.unit_price)}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 text-right">
                      {formatNpr(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card space-y-4 lg:col-span-4 h-fit">
          <h2 className="font-display text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Financial Summary
          </h2>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">{formatNpr(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>Discount ({invoice.discount}%)</span>
              <span>- {formatNpr(invoice.discount_amount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Nepal VAT / Tax ({invoice.tax}%)</span>
              <span className="font-semibold text-slate-900">{formatNpr(invoice.tax_amount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-extrabold text-indigo-900">
              <span>Grand Total</span>
              <span>{formatNpr(invoice.grand_total)}</span>
            </div>
          </div>

          {invoice.notes ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Remarks / Notes</p>
              <p className="mt-1 text-slate-600">{invoice.notes}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

