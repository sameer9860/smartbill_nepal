"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ExpiredGate } from "@/components/ExpiredGate";
import { StatusBadge } from "@/components/StatusBadge";
import { ApiError, coreApi, formatNpr } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Invoice } from "@/lib/types";

export default function InvoicePrintPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    coreApi
      .invoice(id)
      .then((data) => {
        setInvoice(data);
        setTimeout(() => window.print(), 400);
      })
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
  if (!invoice) {
    return (
      <div className="py-16 text-center text-[var(--ink-muted)]">
        Preparing print view…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 print:p-0">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 print:hidden">
        <Link href={`/invoices/${invoice.id}`} className="btn-secondary">
          Back to invoice
        </Link>
        <button type="button" className="btn-primary" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-2xl text-[var(--navy)]">
            SmartBill <span className="text-red-600">Nepal</span>
          </p>
          <p className="text-sm text-[var(--ink-muted)]">
            {user?.tenant?.name || "AI-Powered Billing"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">INVOICE</p>
          <p>#{invoice.invoice_number}</p>
          <p className="text-sm text-[var(--ink-muted)]">
            {new Date(invoice.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <hr className="my-6 border-[var(--line)]" />

      <div className="mb-6 flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Billed to</p>
          <p>{invoice.customer_name}</p>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--navy)] text-white">
          <tr>
            <th className="px-3 py-2">S.N</th>
            <th className="px-3 py-2">Product</th>
            <th className="px-3 py-2">Qty</th>
            <th className="px-3 py-2">Unit price</th>
            <th className="px-3 py-2">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.items || []).map((item, idx) => (
            <tr key={item.id} className="border-b border-[var(--line)]">
              <td className="px-3 py-2">{idx + 1}</td>
              <td className="px-3 py-2">{item.product_name}</td>
              <td className="px-3 py-2">{item.quantity}</td>
              <td className="px-3 py-2">{formatNpr(item.unit_price)}</td>
              <td className="px-3 py-2">{formatNpr(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatNpr(invoice.total_amount)}</span>
        </div>
        <div className="flex justify-between text-red-700">
          <span>Discount ({invoice.discount}%)</span>
          <span>- {formatNpr(invoice.discount_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT ({invoice.tax}%)</span>
          <span>{formatNpr(invoice.tax_amount)}</span>
        </div>
        <div className="flex justify-between border-t border-[var(--line)] pt-2 text-base font-bold text-[var(--navy)]">
          <span>Grand total</span>
          <span>{formatNpr(invoice.grand_total)}</span>
        </div>
      </div>

      {invoice.notes ? (
        <p className="mt-8 text-sm text-[var(--ink-muted)]">Notes: {invoice.notes}</p>
      ) : null}

      <p className="mt-10 text-center text-xs text-[var(--ink-muted)]">
        Thank you for your business.
      </p>
    </div>
  );
}
