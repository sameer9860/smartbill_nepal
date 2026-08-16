"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";
import { TrialBanner } from "./TrialBanner";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/customers", label: "Customers" },
  { href: "/invoices", label: "Invoices" },
  { href: "/subscription", label: "Subscription" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface)] text-[var(--ink-muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-[var(--line)] bg-[var(--navy)] text-white md:flex">
        <div className="border-b border-white/10 px-5 py-6">
          <p className="font-[family-name:var(--font-display)] text-xl tracking-tight">
            SmartBill Nepal
          </p>
          <p className="mt-1 truncate text-xs text-white/60">
            {user.tenant?.name || "Your store"}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
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

      <div className="md:pl-60">
        <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
            <p className="font-[family-name:var(--font-display)] text-lg text-[var(--navy)] md:hidden">
              SmartBill
            </p>
            <div className="hidden text-sm text-[var(--ink-muted)] md:block">
              Welcome back, {user.username}
            </div>
            <Link
              href="/subscription"
              className="rounded-md bg-[var(--navy)] px-3 py-1.5 text-xs font-medium text-white"
            >
              Plans
            </Link>
          </div>
          <div className="flex gap-1 overflow-x-auto border-t border-[var(--line)] px-2 py-2 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${
                  pathname === item.href
                    ? "bg-[var(--navy)] text-white"
                    : "bg-[var(--surface-2)] text-[var(--ink-muted)]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </header>

        <TrialBanner tenant={user.tenant} />

        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
