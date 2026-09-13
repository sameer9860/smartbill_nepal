import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Package,
  Printer,
  Receipt,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Background Subtle Gradient & Grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-blue-600/10 blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070b14]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                SmartBill <span className="text-blue-500">Nepal</span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 text-center md:pt-24 md:pb-28">
        {/* Sub-badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 mb-8">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Billing & Stock Software Built for Nepali SMEs
        </div>

        {/* Hero Title */}
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-6xl lg:leading-[1.15]">
          Simplify Invoicing, Inventory & Sales in{" "}
          <span className="text-blue-500">Nepali Rupees</span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg leading-relaxed">
          Generate NPR tax invoices, print thermal receipts, manage low-stock thresholds, and get AI sales predictions. Starts with a 3-day full access trial.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 hover:shadow-blue-500/40"
          >
            <span>Start 3-Day Free Trial</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-6 py-3.5 text-base font-bold text-slate-200 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
          >
            <span>Sign In to Dashboard</span>
          </Link>
        </div>

        {/* Key Points */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
            <span>NPR Currency & Tax Invoices</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
            <span>80mm Thermal Receipt Printing</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
            <span>AI Low Stock Alerts & Demand Forecast</span>
          </div>
        </div>

        {/* UI Mockup Dashboard Preview */}
        <div className="relative mx-auto mt-16 max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-left shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-slate-700" />
              <div className="h-3 w-3 rounded-full bg-slate-700" />
              <div className="h-3 w-3 rounded-full bg-slate-700" />
              <span className="ml-2 font-mono text-xs text-slate-500">smartbill.nepal / dashboard</span>
            </div>
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-[11px] font-semibold text-blue-400">
              System Interface
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales (NPR)</p>
              <p className="mt-2 text-2xl font-extrabold text-white">रु 1,84,500.00</p>
              <p className="mt-1 text-xs text-blue-400">Paid Invoices: 42</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inventory Products</p>
              <p className="mt-2 text-2xl font-extrabold text-white">156 Items</p>
              <p className="mt-1 text-xs text-slate-400">Active stock tracking</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Alerts</p>
              <p className="mt-2 text-2xl font-extrabold text-blue-400">2 Items</p>
              <p className="mt-1 text-xs text-blue-400">Restock recommended</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="border-t border-slate-800/80 bg-slate-950 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Core Platform Features
            </h2>
            <p className="mt-3 text-sm text-slate-400 max-w-xl mx-auto">
              Everything required to run your store efficiently without complex configuration.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-blue-500/40 hover:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Printer className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">NPR Tax Invoicing & Thermal Printing</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Generate tax invoices with optional VAT toggle, walk-in or saved customers, and instant 80mm thermal receipt output.
              </p>
            </div>

            {/* 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-blue-500/40 hover:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Stock Management & Movement Logs</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Automatic stock deduction upon sale creation, low-stock threshold notifications, and detailed IN/OUT stock audit logs.
              </p>
            </div>

            {/* 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-blue-500/40 hover:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">AI Demand Forecasting & ABC Analysis</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Smart analytics grade your store health, classify top-revenue ABC products, and provide automated weekly reorder suggestions.
              </p>
            </div>

            {/* 4 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-blue-500/40 hover:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Customer Records</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Store customer phone numbers, addresses, and full purchasing history with quick search and one-tap direct dialing.
              </p>
            </div>

            {/* 5 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-blue-500/40 hover:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Financial Reports</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Track revenue trends over time, inspect product sales rankings, and download clean reports for accounting.
              </p>
            </div>

            {/* 6 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-blue-500/40 hover:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Multi-Tenant Isolation</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Each store operates in an isolated environment with encrypted JWT authentication and secure data protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trial CTA Banner */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/80 via-slate-900 to-blue-950/80 p-10 text-center shadow-xl">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Get Started with SmartBill Nepal
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Create your account in less than a minute. Includes a 3-day free trial.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/register"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
              >
                Start Free Trial Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b14] py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} SmartBill Nepal. All rights reserved.</p>
      </footer>
    </div>
  );
}
