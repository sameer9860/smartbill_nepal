"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  FolderTree,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeft,
  Settings,
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
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/subscription", label: "Plans", icon: CreditCard },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved !== null) {
      setSidebarCollapsed(saved === "true");
    }
  }, []);

  const toggleDesktopSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (user) {
      coreApi
        .lowStockProducts()
        .then((items) => setLowStockCount(items.length))
        .catch(() => setLowStockCount(null));
    }
  }, [user, pathname]);

  useEffect(() => {
    if (!userMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setUserMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [userMenuOpen]);

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

  const displayName = user.first_name || user.username;
  const initials =
    user.first_name && user.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
      : user.username.slice(0, 2).toUpperCase();

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
            title={sidebarCollapsed ? item.label : undefined}
            className={`group relative flex items-center rounded-xl py-2.5 text-sm font-medium transition-all ${
              sidebarCollapsed ? "px-3.5 md:px-0 md:justify-center" : "px-3.5 justify-between"
            } ${
              active
                ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-900/30"
                : item.highlight
                ? "text-amber-300 hover:bg-white/10 hover:text-amber-200"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? "md:gap-0" : ""}`}>
              <Icon
                className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${
                  active ? "text-white" : item.highlight ? "text-amber-400" : "text-slate-400 group-hover:text-white"
                }`}
              />
              <span className={sidebarCollapsed ? "md:hidden" : ""}>{item.label}</span>
            </div>
            {badgeValue != null && badgeValue > 0 ? (
              sidebarCollapsed ? (
                <>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold md:hidden ${
                      active ? "bg-white text-indigo-700" : "bg-red-500 text-white"
                    }`}
                  >
                    {badgeValue}
                  </span>
                  <span
                    className="hidden md:block absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-900"
                    title={`${badgeValue} low stock items`}
                  />
                </>
              ) : (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    active ? "bg-white text-indigo-700" : "bg-red-500 text-white"
                  }`}
                >
                  {badgeValue}
                </span>
              )
            ) : null}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={logout}
        title={sidebarCollapsed ? "Sign out" : undefined}
        className={`group flex items-center rounded-xl py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-red-300 transition-all ${
          sidebarCollapsed ? "px-3.5 md:px-0 md:justify-center" : "px-3.5 gap-3"
        }`}
      >
        <LogOut className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:scale-110 group-hover:text-red-400" />
        <span className={sidebarCollapsed ? "md:hidden" : ""}>Sign out</span>
      </button>
    </nav>
  );

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
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-800/80 bg-slate-900 text-white transition-all duration-300 ease-in-out ${
          mobileOpen ? "w-64 translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        } ${sidebarCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div
          className={`flex items-center border-b border-slate-800 py-5 transition-all ${
            sidebarCollapsed ? "md:px-3 md:justify-center" : "px-6 justify-between"
          }`}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-600/30">
              <span className="font-display text-lg font-bold">S</span>
            </div>
            <div className={sidebarCollapsed ? "md:hidden" : ""}>
              <p className="font-display text-lg font-bold tracking-tight text-white leading-none">
                SmartBill <span className="text-red-500 font-sans text-xs uppercase tracking-wider">NP</span>
              </p>
              <p className="mt-1 truncate text-[11px] text-slate-400">
                {user.tenant?.name || "My Business"}
              </p>
            </div>
          </Link>

          {/* Desktop Collapse Toggle Button in Sidebar */}
          <button
            type="button"
            onClick={toggleDesktopSidebar}
            className="hidden md:flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {navLinks}
      </aside>

      <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? "md:pl-20" : "md:pl-64"}`}>
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-8">
            <div className="flex items-center gap-3">
              {/* Sidebar Toggle Button */}
              <button
                type="button"
                className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition shadow-xs"
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setMobileOpen((open) => !open);
                  } else {
                    toggleDesktopSidebar();
                  }
                }}
                title="Toggle sidebar"
                aria-label="Toggle sidebar"
              >
                <PanelLeft className="h-5 w-5" />
              </button>

              <div className="md:hidden flex items-center gap-2">
                <span className="font-display font-bold text-slate-900">SmartBill</span>
              </div>
              <div className="hidden text-sm font-medium text-slate-500 md:block">
                Welcome back, <span className="font-semibold text-slate-900">{displayName}</span>
              </div>
            </div>

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {initials}
                </span>
                <span className="hidden max-w-[9rem] truncate sm:inline">{displayName}</span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {userMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                >
                  <div className="flex items-center gap-3 px-3.5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs text-slate-500">Signed in as</p>
                      <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                      <p className="truncate text-xs text-slate-500">{user.email || user.username}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100" />
                  <Link
                    href="/dashboard"
                    role="menuitem"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4 text-slate-400" />
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    role="menuitem"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    Profile
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <TrialBanner tenant={user.tenant} />

        <main className="px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}

