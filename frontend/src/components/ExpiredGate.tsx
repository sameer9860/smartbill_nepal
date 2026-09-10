"use client";

import Link from "next/link";

export function ExpiredGate({
  message = "Your free trial has ended. Subscribe to continue using SmartBill.",
}: {
  message?: string;
}) {
  return (
    <div className="card border-amber-200 bg-amber-50">
      <p className="font-display text-xl text-amber-950">Access paused</p>
      <p className="mt-2 text-sm text-amber-900">{message}</p>
      <Link href="/subscription" className="btn-primary mt-4 inline-flex">
        View subscription plans
      </Link>
    </div>
  );
}
