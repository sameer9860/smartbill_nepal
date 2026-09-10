"use client";

const STYLES: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-800",
  UNPAID: "bg-red-100 text-red-800",
  PARTIAL: "bg-amber-100 text-amber-900",
  CRITICAL: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-900",
  MEDIUM: "bg-amber-100 text-amber-900",
  LOW: "bg-sky-100 text-sky-900",
  A: "bg-[var(--navy)] text-white",
  B: "bg-orange-500 text-white",
  C: "bg-slate-400 text-white",
  UP: "bg-emerald-100 text-emerald-800",
  DOWN: "bg-red-100 text-red-800",
  STABLE: "bg-amber-100 text-amber-900",
};

export function StatusBadge({ status }: { status: string }) {
  const key = (status || "").toUpperCase();
  const style = STYLES[key] || "bg-[var(--surface-2)] text-[var(--ink-muted)]";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${style}`}
    >
      {key}
    </span>
  );
}
