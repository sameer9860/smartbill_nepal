"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Mail, QrCode, Upload, X } from "lucide-react";

import { LoadingPage } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { ApiError, coreApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { SubscriptionPlan } from "@/lib/types";

const SUPPORT_EMAIL = "hrsmartbill@gmail.com";
const MAX_RECEIPT_SIZE = 8 * 1024 * 1024;

export default function SubscriptionPage() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [qrConfigured, setQrConfigured] = useState(true);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coreApi
      .subscriptionPlans()
      .then((res) => setPlans(res.plans))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load plans")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!checkoutOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setCheckoutOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [checkoutOpen]);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

  function chooseReceipt(file: File | null) {
    setError("");
    setMessage("");
    if (!file) {
      setReceiptFile(null);
      return;
    }

    const allowedType = ["image/jpeg", "image/png", "application/pdf"].includes(
      file.type
    );
    if (!allowedType) {
      setReceiptFile(null);
      setError("Choose a JPG, PNG, or PDF receipt.");
      return;
    }
    if (file.size > MAX_RECEIPT_SIZE) {
      setReceiptFile(null);
      setError("Receipt files must be 8 MB or smaller.");
      return;
    }
    setReceiptFile(file);
  }

  async function submitReceipt() {
    if (!selectedPlan || !receiptFile) return;
    setSubmittingReceipt(true);
    setError("");
    setMessage("");
    try {
      const result = await coreApi.submitSubscriptionReceipt({
        plan: selectedPlan.id,
        receipt: receiptFile,
      });
      setMessage(result.message);
      setReceiptFile(null);
      await refreshUser();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not submit the receipt."
      );
    } finally {
      setSubmittingReceipt(false);
    }
  }

  const tenant = user?.tenant;

  if (loading) return <LoadingPage label="Loading plans…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans & billing"
        description="Choose a plan, pay by QR, then send your receipt for verification."
      />

      {tenant ? (
        <section className="border-y border-[var(--line)] py-4">
          <p className="text-sm text-[var(--ink-muted)]">Current status</p>
          <p className="mt-1 font-semibold capitalize text-[var(--navy)]">
            {tenant.subscription_plan.replaceAll("_", " ")} ·{" "}
            {tenant.subscription_status.replaceAll("_", " ")}
          </p>
          {tenant.is_trial_active ? (
            <p className="mt-2 text-sm">
              Trial ends in {tenant.days_left_in_trial} day
              {tenant.days_left_in_trial === 1 ? "" : "s"}.
            </p>
          ) : null}
          {tenant.subscription_ends_at ? (
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Access until {new Date(tenant.subscription_ends_at).toLocaleString()}
            </p>
          ) : null}
        </section>
      ) : null}

      {message ? (
        <p className="flex items-start gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>
      ) : null}

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <article
                key={plan.id}
                className={`flex min-h-full flex-col border bg-white p-5 transition-colors ${
                  isSelected
                    ? "border-[var(--navy)] ring-1 ring-[var(--navy)]"
                    : "border-[var(--line)] hover:border-slate-400"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl text-[var(--navy)]">
                      {plan.name}
                    </h2>
                    <p className="mt-3 text-2xl font-semibold">
                      {plan.price_nrs == null
                        ? "Custom"
                        : plan.price_nrs === 0
                          ? "Free"
                          : `NPR ${plan.price_nrs.toLocaleString()}`}
                    </p>
                    <p className="text-xs uppercase text-[var(--ink-muted)]">
                      per {plan.billing_period}
                    </p>
                  </div>
                  {isSelected ? (
                    <CheckCircle2
                      aria-label="Selected plan"
                      className="h-5 w-5 text-emerald-700"
                    />
                  ) : null}
                </div>
                <p className="mt-4 text-sm text-[var(--ink-muted)]">
                  {plan.description}
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-emerald-700">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.subscribeable ? (
                  <button
                    type="button"
                    className={isSelected ? "btn-primary mt-5 w-full" : "btn-secondary mt-5 w-full"}
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      setError("");
                      setMessage("");
                    }}
                  >
                    {isSelected ? "Selected" : "Choose plan"}
                  </button>
                ) : (
                  <p className="mt-5 text-center text-xs text-[var(--ink-muted)]">
                    {plan.id === "TRIAL" ? "Assigned automatically" : "Contact us for enterprise"}
                  </p>
                )}
              </article>
            );
          })}
        </div>

        <aside className="border-t border-[var(--line)] pt-5 xl:sticky xl:top-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          <h2 className="font-display text-xl text-[var(--navy)]">Billing summary</h2>
          {selectedPlan ? (
            <>
              <div className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--ink-muted)]">Plan</span>
                  <span className="text-right font-semibold">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--ink-muted)]">Billing period</span>
                  <span className="text-right capitalize">{selectedPlan.billing_period}</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-[var(--line)] pt-4">
                  <span className="text-[var(--ink-muted)]">Due now</span>
                  <span className="text-right font-semibold">
                    {selectedPlan.price_nrs == null
                      ? "Contact us"
                      : `NPR ${selectedPlan.price_nrs.toLocaleString()}`}
                  </span>
                </div>
              </div>
              {selectedPlan.subscribeable ? (
                <button
                  type="button"
                  className="btn-primary mt-6 w-full"
                  onClick={() => {
                    setCheckoutOpen(true);
                    setError("");
                  }}
                >
                  <QrCode className="h-4 w-4" />
                  Pay with QR
                </button>
              ) : null}
            </>
          ) : (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">
              Select a plan to see the amount due.
            </p>
          )}
          <p className="mt-4 text-xs leading-5 text-[var(--ink-muted)]">
            Your plan stays unchanged while the payment receipt is being reviewed.
          </p>
        </aside>
      </div>

      {checkoutOpen && selectedPlan ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCheckoutOpen(false);
          }}
        >
          <section
            aria-labelledby="checkout-title"
            aria-modal="true"
            className="animate-[checkout-rise_280ms_ease-out] max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-xl bg-white shadow-2xl sm:rounded-xl"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--ink-muted)]">
                  QR payment
                </p>
                <h2 id="checkout-title" className="mt-1 font-display text-xl text-[var(--navy)]">
                  Complete your checkout
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close checkout"
                className="rounded-md p-2 text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                onClick={() => setCheckoutOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-7 p-5 sm:p-7 md:grid-cols-[minmax(0,1fr)_240px]">
              <div>
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-[var(--navy)]" />
                  <h3 className="font-semibold">Scan to pay</h3>
                </div>
                <div className="mt-4 flex min-h-64 items-center justify-center border border-dashed border-slate-300 bg-slate-50 p-5">
                  {qrConfigured ? (
                    <Image
                      src="/payment-qr.png"
                      alt="SmartBill subscription payment QR code"
                      width={240}
                      height={240}
                      unoptimized
                      className="h-56 w-56 object-contain"
                      onError={() => setQrConfigured(false)}
                    />
                  ) : (
                    <div className="max-w-xs text-center">
                      <QrCode className="mx-auto h-10 w-10 text-slate-400" />
                      <p className="mt-3 text-sm font-semibold">Payment QR not added yet</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--ink-muted)]">
                        Add your QR image as <code>frontend/public/payment-qr.png</code> and it will appear here.
                      </p>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-sm text-[var(--ink-muted)]">
                  Pay <strong className="text-[var(--ink)]">
                    {selectedPlan.price_nrs == null
                      ? "the agreed amount"
                      : `NPR ${selectedPlan.price_nrs.toLocaleString()}`}
                  </strong> using your banking or wallet app.
                </p>

                <div className="mt-6 border-t border-[var(--line)] pt-5">
                  <h3 className="font-semibold">Have you done payment from QR or have any issue?</h3>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">
                    Upload your receipt for verification and further processing.
                  </p>
                  <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 border border-[var(--line)] px-4 py-3 text-sm font-semibold transition-colors hover:bg-[var(--surface-2)]">
                    <Upload className="h-4 w-4" />
                    {receiptFile ? receiptFile.name : "Choose receipt"}
                    <input
                      type="file"
                      className="sr-only"
                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                      onChange={(event) => chooseReceipt(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  <p className="mt-2 text-xs text-[var(--ink-muted)]">
                    JPG, PNG, or PDF · maximum 8 MB
                  </p>
                  <button
                    type="button"
                    className="btn-primary mt-3 w-full"
                    disabled={!receiptFile || submittingReceipt}
                    onClick={() => void submitReceipt()}
                  >
                    {submittingReceipt ? "Submitting receipt…" : "Upload receipt for verification"}
                  </button>
                  {error ? (
                    <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>
                  ) : null}
                  {message ? (
                    <p className="mt-3 flex gap-2 text-sm text-emerald-800" role="status">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      {message}
                    </p>
                  ) : null}
                </div>
              </div>

              <aside className="border-t border-[var(--line)] pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                <p className="text-xs font-semibold uppercase text-[var(--ink-muted)]">
                  Billing summary
                </p>
                <h3 className="mt-2 font-semibold text-[var(--navy)]">{selectedPlan.name}</h3>
                <p className="mt-1 text-sm capitalize text-[var(--ink-muted)]">
                  Billed {selectedPlan.billing_period}
                </p>
                <div className="mt-5 flex justify-between gap-3 border-t border-[var(--line)] pt-4 text-sm">
                  <span>Due now</span>
                  <strong>
                    {selectedPlan.price_nrs == null
                      ? "Contact us"
                      : `NPR ${selectedPlan.price_nrs.toLocaleString()}`}
                  </strong>
                </div>
                <p className="mt-4 text-xs leading-5 text-[var(--ink-muted)]">
                  Access begins after the payment receipt has been reviewed and approved.
                </p>
                <a
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--navy)] hover:underline"
                  href={`mailto:${SUPPORT_EMAIL}?subject=SmartBill%20subscription%20payment`}
                >
                  <Mail className="h-4 w-4" />
                  Contact us
                </a>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{SUPPORT_EMAIL}</p>
              </aside>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
