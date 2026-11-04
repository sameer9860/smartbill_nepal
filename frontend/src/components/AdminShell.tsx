"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  FileCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Shield,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/admin/receipts", label: "Receipts", icon: Receipt },
  { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    } else if (!loading && user && !user.is_staff) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-sm font-medium">Loading admin…</span>
        </div>
      </div>
    );
  }

  if (!user.is_staff) return null;

  const navLinks = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(`${item.href}`));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
              active
                ? "bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-md"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto pt-4 border-t border-slate-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white transition-all"
        >
          <BarChart3 className="h-5 w-5 shrink-0" />
          Back to App
        </Link>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-red-300 transition-all"
        >
          <LogOut className="h-5 w-5 shrink-0 text-slate-400" />
          Logout
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans antialiased">
      {/* Mobile overlay */}
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800/80 bg-slate-900 text-white transition-transform duration-300 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-purple-500 shadow-md">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold leading-none text-white">Admin Panel</p>
            <p className="mt-1 text-[11px] text-slate-400">SmartBill Nepal</p>
          </div>
          <button
            type="button"
            className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Admin badge */}
        <div className="mx-3 mt-3 rounded-xl bg-violet-900/40 px-3 py-2.5 text-xs">
          <p className="text-slate-400">Signed in as</p>
          <p className="mt-0.5 font-semibold text-violet-200 truncate">
            {user.first_name || user.username}
          </p>
          <span className="mt-1 inline-block rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Staff
          </span>
        </div>

        {navLinks}
      </aside>

      {/* Main content */}
      <div className="md:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 md:hidden"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-violet-600" />
                <span className="font-semibold text-slate-700 text-sm">
                  {NAV.find(
                    (n) => pathname === n.href || pathname.startsWith(n.href + "/")
                  )?.label ?? "Admin"}
                </span>
              </div>
            </div>
            <span className="text-xs rounded-full bg-violet-100 text-violet-700 px-3 py-1 font-semibold">
              Admin Mode
            </span>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

