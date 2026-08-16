import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 20%, #283593 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 90% 10%, #1565c0 0%, transparent 50%), linear-gradient(160deg, #0d1440 0%, #1a237e 45%, #0b3d91 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16 text-white">
        <p className="font-display text-5xl leading-none tracking-tight md:text-7xl">
          SmartBill Nepal
        </p>
        <h1 className="mt-6 max-w-xl text-2xl font-medium leading-snug text-white/95 md:text-3xl">
          Billing and inventory built for Nepali shops
        </h1>
        <p className="mt-4 max-w-lg text-base text-white/70 md:text-lg">
          Start with a 3-day free trial. Upgrade anytime to Basic Monthly or Pro
          Yearly when you are ready.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)] transition hover:bg-sky-50"
          >
            Start free trial
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
