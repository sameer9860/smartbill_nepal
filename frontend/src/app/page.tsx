import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  PackageCheck,
  Printer,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500 selection:text-white">
      {/* Background Decorators */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-600/30 to-purple-600/0 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-sky-500/20 to-indigo-600/0 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-500/15 to-sky-600/0 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/10 bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-lg shadow-indigo-500/25 transition group-hover:scale-105">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                SmartBill <span className="text-red-500 font-sans text-xs uppercase tracking-widest">Nepal</span>
              </span>
              <p className="text-[10px] text-slate-400">Next-Gen Business OS</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex text-sm font-medium text-slate-300">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#ai" className="transition hover:text-white">AI Insights</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition duration-300 hover:bg-indigo-500 hover:shadow-indigo-500/40"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 text-center md:pt-24 md:pb-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-md mb-8 animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>🇳🇵 Built Specifically for Nepali SMEs & Retail Stores</span>
        </div>

        <h1 className="mx-auto max-w-4xl font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl lg:leading-[1.1]">
          Modern Billing, Stock Control &{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
            AI Sales Intelligence
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg md:text-xl font-normal leading-relaxed">
          Manage invoices in NPR, track low-stock inventory, generate thermal receipts, and forecast demand with AI. Includes a 3-day full access trial.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 px-7 py-4 text-base font-bold text-white shadow-xl shadow-indigo-600/25 transition duration-300 hover:scale-[1.02] hover:shadow-indigo-600/40"
          >
            <Zap className="h-5 w-5 fill-current text-amber-300" />
            <span>Start 3-Day Free Trial</span>
            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-7 py-4 text-base font-bold text-slate-200 backdrop-blur-md transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
          >
            <span>Existing Account Log In</span>
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Instant NPR Thermal & Tax Invoice</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>99.9% Cloud Uptime</span>
          </div>
        </div>

        {/* Mock Interface Graphic */}
        <div className="relative mx-auto mt-16 max-w-5xl rounded-3xl border border-white/10 bg-slate-900/60 p-3 shadow-2xl backdrop-blur-2xl">
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-950 p-6 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-xs text-slate-500">smartbill.nepal / dashboard</span>
              </div>
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300 border border-indigo-500/30">
                LIVE DEMO PREVIEW
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales (NPR)</p>
                <p className="mt-2 text-2xl font-extrabold text-emerald-400">रु 2,45,800.00</p>
                <p className="mt-1 text-xs text-emerald-500/80 font-medium">↑ +14.2% this month</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoices Issued</p>
                <p className="mt-2 text-2xl font-extrabold text-white">1,248</p>
                <p className="mt-1 text-xs text-indigo-400 font-medium">98.4% Paid on time</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Risk</p>
                <p className="mt-2 text-2xl font-extrabold text-amber-400">3 Items</p>
                <p className="mt-1 text-xs text-amber-500/80 font-medium">Smart AI restock active</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="relative border-t border-white/10 bg-slate-900/40 py-24 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything Your Shop Needs To Thrive
            </h2>
            <p className="mt-3 text-base text-slate-400 max-w-2xl mx-auto">
              Eliminate paper receipts, avoid unexpected stockouts, and gain full visibility into customer balances and daily revenue.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="group rounded-3xl border border-white/10 bg-slate-900/60 p-8 transition duration-300 hover:border-indigo-500/40 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-indigo-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
                <Printer className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-white">Instant NPR Invoicing</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Create tax invoices in seconds. Support walk-in or saved customers, automatic VAT computation, and 80mm thermal receipt printing.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group rounded-3xl border border-white/10 bg-slate-900/60 p-8 transition duration-300 hover:border-sky-500/40 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-sky-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600/20 text-sky-400 ring-1 ring-sky-500/30">
                <PackageCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-white">Smart Inventory & Audit Log</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Track stock quantities, category groupings, and automatic stock deduction upon sales. Record stock IN/OUT audit logs.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group rounded-3xl border border-white/10 bg-slate-900/60 p-8 transition duration-300 hover:border-amber-500/40 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-amber-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600/20 text-amber-400 ring-1 ring-amber-500/30">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-white">AI Sales Forecasting</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Built-in algorithms grade your business health score, perform ABC product classification, and generate automated weekly order plans.
              </p>
            </div>

            {/* Card 4 */}
            <div className="group rounded-3xl border border-white/10 bg-slate-900/60 p-8 transition duration-300 hover:border-emerald-500/40 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-emerald-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500/30">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-white">Customer Directory</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Keep phone numbers, addresses, and full order histories for every client. Fast search with one-click direct calling.
              </p>
            </div>

            {/* Card 5 */}
            <div className="group rounded-3xl border border-white/10 bg-slate-900/60 p-8 transition duration-300 hover:border-purple-500/40 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-purple-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-400 ring-1 ring-purple-500/30">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-white">Visual Analytics</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Interactive revenue charts, monthly sales summaries, top-selling product rankings, and real-time financial reporting.
              </p>
            </div>

            {/* Card 6 */}
            <div className="group rounded-3xl border border-white/10 bg-slate-900/60 p-8 transition duration-300 hover:border-rose-500/40 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-rose-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600/20 text-rose-400 ring-1 ring-rose-500/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-white">Multi-Tenant Cloud Security</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Strict database isolation keeps your store data 100% private. JWT authentication with session control and encrypted storage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="relative py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/50 via-slate-900 to-indigo-950/80 p-10 text-center shadow-2xl backdrop-blur-xl md:p-16">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Ready to Upgrade Your Shop?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-indigo-200/90">
              Join store owners across Nepal streamlining their sales and stock management today.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="rounded-2xl bg-white px-8 py-4 text-base font-bold text-indigo-950 shadow-xl transition hover:bg-indigo-50 hover:scale-105"
              >
                Start Free 3-Day Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} SmartBill Nepal. All rights reserved.</p>
      </footer>
    </div>
  );
}
