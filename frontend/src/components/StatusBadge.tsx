"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Minus,
} from "lucide-react";

const CONFIG: Record<
  string,
  { bg: string; text: string; border: string; icon?: React.ElementType }
> = {
  PAID: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2 },
  UNPAID: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: AlertCircle },
  PARTIAL: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", icon: Clock },
  CRITICAL: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: AlertTriangle },
  HIGH: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200", icon: AlertTriangle },
  MEDIUM: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  LOW: { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200" },
  A: { bg: "bg-indigo-900", text: "text-white", border: "border-indigo-900" },
  B: { bg: "bg-sky-600", text: "text-white", border: "border-sky-600" },
  C: { bg: "bg-slate-500", text: "text-white", border: "border-slate-500" },
  UP: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: ArrowUpRight },
  DOWN: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: ArrowDownRight },
  STABLE: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", icon: Minus },
};

export function StatusBadge({ status }: { status: string }) {
  const key = (status || "").toUpperCase();
  const cfg = CONFIG[key] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  };
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      <span>{key}</span>
    </span>
  );
}

