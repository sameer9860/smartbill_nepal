"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth";
import { TrialBanner } from "./TrialBanner";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/categories", label: "Categories" },
  { href: "/products", label: "Products" },
  { href: "/customers", label: "Customers" },
  { href: "/invoices", label: "Invoices" },
  { href: "/low-stock", label: "Low Stock" },
  { href: "/stock-movements", label: "Stock Log" },
  { href: "/reports", label: "Reports" },
  { href: "/ai-insights", label: "AI Insights" },
  { href: "/profile", label: "Profile" },
  { href: "/subscription", label: "Plans" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface)] text-[var(--ink-muted)]">
        Loading…
      </div>
    );
  }

  const navLinks = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm transition ${
              active
                ? "bg-white/15 font-medium text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-[var(--navy)] text-white transition-transform md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 px-5 py-6">
          <p className="font-display text-xl tracking-tight">SmartBill Nepal</p>
          <p className="mt-1 truncate text-xs text-white/60">
            {user.tenant?.name || "Your store"}
          </p>
        </div>
        {navLinks}
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm text-white/80">{user.username}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 text-xs text-white/50 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-sm md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                ☰
              </button>
              <p className="font-display text-lg text-[var(--navy)] md:hidden">
                SmartBill
              </p>
              <div className="hidden text-sm text-[var(--ink-muted)] md:block">
                Welcome back, {user.first_name || user.username}
              </div>
            </div>
            <Link
              href="/subscription"
              className="rounded-md bg-[var(--navy)] px-3 py-1.5 text-xs font-medium text-white"
            >
              Plans
            </Link>
          </div>
        </header>

        <TrialBanner tenant={user.tenant} />

        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
