"use client";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-12 text-center">
      <p className="font-display text-lg text-[var(--navy)]">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink-muted)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
