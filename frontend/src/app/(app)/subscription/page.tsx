"use client";

import { useEffect, useState } from "react";

import { ApiError, coreApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { SubscriptionPlan } from "@/lib/types";

const PAYMENT_METHODS = [
  { id: "ESEWA", label: "eSewa" },
  { id: "KHALTI", label: "Khalti" },
  { id: "FONEPAY", label: "Fonepay" },
  { id: "BANK_TRANSFER", label: "Bank transfer" },
  { id: "SIMULATED", label: "Simulate payment" },
];

export default function SubscriptionPage() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [method, setMethod] = useState("SIMULATED");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  useEffect(() => {
    coreApi
      .subscriptionPlans()
      .then((res) => setPlans(res.plans))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load plans")
      );
  }, []);

  async function subscribe(planId: string) {
    setBusyPlan(planId);
    setError("");
    setMessage("");
    try {
      const res = await coreApi.subscribe({
        plan: planId,
        payment_method: method,
      });
      setMessage(
        `${res.message} Paid via ${res.payment.method}${
          res.payment.amount_nrs != null
            ? ` (NPR ${res.payment.amount_nrs.toLocaleString()})`
            : ""
        }.`
      );
      await refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Subscription failed");
    } finally {
      setBusyPlan(null);
    }
  }

  const tenant = user?.tenant;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[var(--navy)]">Subscription</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Trial lasts 3 days. Choose a plan to continue after that.
        </p>
      </div>

      {tenant ? (
        <div className="card">
          <p className="text-sm text-[var(--ink-muted)]">Current status</p>
          <p className="mt-1 text-lg font-semibold text-[var(--navy)]">
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
        </div>
      ) : null}

      <div className="card max-w-md">
        <label className="label" htmlFor="payment_method">
          Payment method (simulated for now)
        </label>
        <select
          id="payment_method"
          className="input"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-[var(--ink-muted)]">
          Real gateway checkout can be wired later. Activation is immediate in this
          phase.
        </p>
      </div>

      {message ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <div key={plan.id} className="card flex flex-col">
            <h2 className="font-display text-xl text-[var(--navy)]">{plan.name}</h2>
            <p className="mt-2 text-2xl font-semibold">
              {plan.price_nrs == null
                ? "Custom"
                : plan.price_nrs === 0
                  ? "Free"
                  : `NPR ${plan.price_nrs.toLocaleString()}`}
            </p>
            <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
              / {plan.billing_period}
            </p>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">{plan.description}</p>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm">
              {plan.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            {plan.subscribeable ? (
              <button
                type="button"
                className="btn-primary mt-5 w-full"
                disabled={busyPlan === plan.id}
                onClick={() => void subscribe(plan.id)}
              >
                {busyPlan === plan.id ? "Activating…" : "Subscribe"}
              </button>
            ) : (
              <p className="mt-5 text-center text-xs text-[var(--ink-muted)]">
                {plan.id === "TRIAL"
                  ? "Assigned automatically on registration"
                  : "Contact us for enterprise"}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
