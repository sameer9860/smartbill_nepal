"use client";

import { useEffect } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
  wide?: boolean;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  danger = false,
  wide = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-xl border border-[var(--line)] bg-white shadow-xl ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        <div
          className={`flex items-center justify-between border-b border-[var(--line)] px-5 py-4 ${
            danger ? "bg-red-50" : ""
          }`}
        >
          <h2
            className={`font-display text-xl ${
              danger ? "text-red-800" : "text-[var(--navy)]"
            }`}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-[var(--ink-muted)] hover:bg-[var(--surface-2)]"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
