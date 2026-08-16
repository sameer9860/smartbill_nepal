"use client";

import Link from "next/link";

import type { Tenant } from "@/lib/types";

export function TrialBanner({ tenant }: { tenant: Tenant | null }) {
  if (!tenant) return null;

  if (tenant.subscription_status === "EXPIRED" || !tenant.has_access) {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:px-8">
        Your free trial has ended.{" "}
        <Link href="/subscription" className="font-semibold underline">
          Choose a plan
        </Link>{" "}
        to keep using SmartBill.
      </div>
    );
  }

  if (tenant.is_trial_active) {
    return (
      <div className="border-b border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 md:px-8">
        Free trial active — {tenant.days_left_in_trial} day
        {tenant.days_left_in_trial === 1 ? "" : "s"} left.{" "}
        <Link href="/subscription" className="font-semibold underline">
          View subscription plans
        </Link>
      </div>
    );
  }

  return null;
}
