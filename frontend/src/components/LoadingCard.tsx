"use client";

export function LoadingCard({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="card animate-pulse">
      <div className="h-4 w-28 rounded bg-[var(--surface-2)]" />
      <div className="mt-4 h-8 w-20 rounded bg-[var(--surface-2)]" />
      <p className="mt-3 text-xs text-[var(--ink-muted)]">{label}</p>
    </div>
  );
}

export function LoadingPage({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="space-y-4">
      <div className="h-9 w-48 animate-pulse rounded bg-[var(--surface-2)]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LoadingCard label={label} />
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </div>
      <div className="card h-48 animate-pulse bg-[var(--surface)]" />
    </div>
  );
}
