export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 font-sans selection:bg-blue-600 selection:text-white">
      {/* Base gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(155deg, #eef2f7 0%, #e8eef8 38%, #e7f3f1 72%, #f1f5f9 100%)",
        }}
      />

      {/* Soft brand washes */}
      <div className="pointer-events-none absolute -left-20 top-[-10%] h-[28rem] w-[28rem] rounded-full bg-[var(--navy)]/[0.07]" />
      <div className="pointer-events-none absolute -right-16 bottom-[-12%] h-[26rem] w-[26rem] rounded-full bg-[var(--accent)]/[0.10]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-[var(--navy-2)]/[0.05]" />

      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(15, 23, 42, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 75%)",
        }}
      />

      {/* Top accent bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--navy)] via-[var(--navy-2)] to-[var(--accent)]" />

      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </main>
  );
}
