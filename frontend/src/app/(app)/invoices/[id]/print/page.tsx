"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";

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
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 font-medium">
        {error}
      </div>
    );
  }
  if (!invoice) {
    return (
      <div className="py-16 text-center text-slate-500 font-medium">
        Preparing printable document…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 print:p-0 print:shadow-none shadow-lg rounded-2xl border border-slate-200">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden border-b border-slate-100 pb-4">
        <Link href={`/invoices/${invoice.id}`} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Invoice</span>
        </Link>
        <button type="button" className="btn-primary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-2xl font-bold text-indigo-900">
            SmartBill <span className="text-red-600 font-sans text-xs uppercase tracking-widest">Nepal</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {user?.tenant?.name || "Tax Sales Invoice"}
          </p>
          <p className="text-xs text-slate-500">Official Bill / Abbreviated Tax Invoice</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold tracking-tight text-slate-900">TAX INVOICE</p>
          <p className="font-mono text-sm font-bold text-indigo-900">{invoice.invoice_number}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Date: {new Date(invoice.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <hr className="my-6 border-slate-200" />

      <div className="mb-6 flex flex-wrap justify-between items-start gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Billed To</p>
          <p className="text-base font-bold text-slate-900 mt-0.5">{invoice.customer_name}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Payment Status</p>
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800">
            <th className="px-3 py-2.5 font-bold uppercase text-xs">S.N.</th>
            <th className="px-3 py-2.5 font-bold uppercase text-xs">Product Particulars</th>
            <th className="px-3 py-2.5 font-bold uppercase text-xs">Qty</th>
            <th className="px-3 py-2.5 font-bold uppercase text-xs">Unit Rate</th>
            <th className="px-3 py-2.5 font-bold uppercase text-xs text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {(invoice.items || []).map((item, idx) => (
            <tr key={item.id}>
              <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">{idx + 1}</td>
              <td className="px-3 py-2.5 font-semibold text-slate-900">{item.product_name}</td>
              <td className="px-3 py-2.5 text-slate-700">{item.quantity}</td>
              <td className="px-3 py-2.5 text-slate-700">{formatNpr(item.unit_price)}</td>
              <td className="px-3 py-2.5 font-bold text-slate-900 text-right">
                {formatNpr(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 ml-auto max-w-xs space-y-1.5 text-sm border-t border-slate-200 pt-4">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span>{formatNpr(invoice.total_amount)}</span>
        </div>
        <div className="flex justify-between text-rose-700">
          <span>Discount ({invoice.discount}%)</span>
          <span>- {formatNpr(invoice.discount_amount)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Nepal VAT ({invoice.tax}%)</span>
          <span>{formatNpr(invoice.tax_amount)}</span>
        </div>
        <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-base font-extrabold text-slate-900">
          <span>Grand Total</span>
          <span>{formatNpr(invoice.grand_total)}</span>
        </div>
      </div>

      {invoice.notes ? (
        <div className="mt-8 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
          <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Remarks / Notes</p>
          <p className="mt-0.5">{invoice.notes}</p>
        </div>
      ) : null}

      <div className="mt-12 text-center text-xs text-slate-400 border-t border-slate-100 pt-4">
        <p className="font-medium text-slate-600">Thank you for your business!</p>
        <p className="mt-0.5 text-[10px]">Generated electronically via SmartBill Nepal POS System</p>
      </div>
    </div>
  );
}

