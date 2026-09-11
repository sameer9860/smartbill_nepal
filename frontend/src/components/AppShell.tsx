"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CreditCard,
  FileText,
  FolderTree,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";

import { coreApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TrialBanner } from "./TrialBanner";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/products", label: "Products", icon: Package },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/low-stock", label: "Low Stock", icon: AlertTriangle, badgeKey: "lowStock" },
  { href: "/stock-movements", label: "Stock Log", icon: History },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/ai-insights", label: "AI Insights", icon: Sparkles, highlight: true },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/subscription", label: "Plans", icon: CreditCard },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (user) {
      coreApi
        .lowStockProducts()
        .then((items) => setLowStockCount(items.length))
        .catch(() => setLowStockCount(null));
    }
  }, [user, pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-sm font-medium">Loading SmartBill Nepal…</span>
        </div>
      </div>
    );
  }

  const navLinks = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4 overflow-y-auto">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
        const badgeValue = item.badgeKey === "lowStock" ? lowStockCount : null;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
              active
                ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-900/30"
                : item.highlight
                ? "text-amber-300 hover:bg-white/10 hover:text-amber-200"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                  active ? "text-white" : item.highlight ? "text-amber-400" : "text-slate-400 group-hover:text-white"
                }`}
              />
              <span>{item.label}</span>
            </div>
            {badgeValue != null && badgeValue > 0 ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  active ? "bg-white text-indigo-700" : "bg-red-500 text-white"
                }`}
              >
                {badgeValue}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const initials =
    user.first_name && user.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
      : user.username.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--surface)] font-sans antialiased text-slate-800">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800/80 bg-slate-900 text-white transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-600/30">
              <span className="font-display text-lg font-bold">S</span>
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-white leading-none">
                SmartBill <span className="text-red-500 font-sans text-xs uppercase tracking-wider">NP</span>
              </p>
              <p className="mt-1 truncate text-[11px] text-slate-400">
                {user.tenant?.name || "My Business"}
              </p>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {navLinks}

        <div className="border-t border-slate-800/80 p-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 truncate">
                <p className="truncate text-xs font-semibold text-white">
                  {user.first_name || user.username}
                </p>
                <p className="truncate text-[10px] text-slate-400">{user.email || user.username}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-red-400 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="md:hidden flex items-center gap-2">
                <span className="font-display font-bold text-slate-900">SmartBill</span>
              </div>
              <div className="hidden text-sm font-medium text-slate-500 md:block">
                Welcome back, <span className="font-semibold text-slate-900">{user.first_name || user.username}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/subscription"
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
              >
                <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
                <span>Plans</span>
              </Link>
            </div>
          </div>
        </header>

        <TrialBanner tenant={user.tenant} />

        <main className="px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}

