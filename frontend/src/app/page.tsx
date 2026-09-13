"use client";

import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  PackageCheck,
  Printer,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Is SmartBill Nepal free to use?",
      a: "Yes! Every new store gets a 3-day full access free trial with unlimited invoices, stock tracking, and AI sales insights. No credit card is required to start.",
    },
    {
      q: "How do I print 80mm thermal receipts?",
      a: "Simply open any invoice in your dashboard and click 'Print Invoice'. SmartBill Nepal includes a dedicated thermal print stylesheet designed specifically for standard 80mm POS printers as well as A4 tax invoices.",
    },
    {
      q: "Can I track low-stock items and receive automated order plans?",
      a: "Absolutely. You can set custom low-stock thresholds for each product. When stock drops below the limit, it appears in your Low Stock dashboard, and our AI generates a weekly reorder list with estimated costs.",
    },
    {
      q: "Is my business data secure?",
      a: "Yes. SmartBill Nepal uses strict multi-tenant architecture. Your store data, customer lists, and financial records are completely isolated and protected with encrypted JWT authentication.",
    },
    {
      q: "Can I manage multiple staff members or store categories?",
      a: "Yes, you can create unlimited product categories, track stock movements (IN/OUT logs), and manage customer accounts directly from your central dashboard.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-slate-900">
                SmartBill <span className="text-blue-600">Nepal</span>
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex text-sm font-semibold text-slate-600">
            <a href="#features" className="transition hover:text-blue-600">Features</a>
            <a href="#everything" className="transition hover:text-blue-600">Services</a>
            <a href="#faqs" className="transition hover:text-blue-600">FAQs</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-blue-600"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Left Hero Text */}
          <div className="lg:col-span-7 text-left space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl leading-[1.15]">
              Manage Your Billing, Inventory & Sales in One Place
            </h1>

            <p className="text-base text-slate-600 sm:text-lg leading-relaxed max-w-2xl">
              SmartBill Nepal connects store owners with automated NPR tax invoicing, 80mm thermal receipts, stock tracking, and AI-powered sales demand forecasting.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-blue-600/35"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-bold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                <span>Start Free 3-Day Trial</span>
              </Link>
            </div>

            {/* Value Highlights */}
            <div className="grid gap-3 pt-6 sm:grid-cols-2 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Filter by category, stock level, & low-stock</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Track every invoice with real-time status</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Instant 80mm thermal receipts & tax bills</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                <span>AI Sales forecasting & automated order list</span>
              </div>
            </div>
          </div>

          {/* Right Hero Interactive POS UI Mockup Card */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
              {/* Card Window Top Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 font-mono text-xs font-semibold text-slate-400">POS & Inventory Suite</span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  ● Live System
                </span>
              </div>

              {/* System Stats Row */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-left">
                  <p className="text-[11px] font-semibold text-slate-500">Today Sales (NPR)</p>
                  <p className="text-xl font-extrabold text-blue-600">रु 42,500.00</p>
                  <p className="mt-0.5 text-[10px] font-bold text-emerald-600">↑ 18 Invoices Paid</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-left">
                  <p className="text-[11px] font-semibold text-slate-500">Inventory Status</p>
                  <p className="text-xl font-extrabold text-slate-900">156 Items</p>
                  <p className="mt-0.5 text-[10px] font-bold text-amber-600">2 Low-Stock Alerts</p>
                </div>
              </div>

              {/* Mock Invoice Items List */}
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-left">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200/80 pb-2 mb-2">
                  <span>Recent Sales Bill</span>
                  <span className="font-mono text-[11px] text-blue-600 font-bold">INV-20260913-001</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>1x Wireless Barcode Scanner</span>
                    <span className="font-semibold text-slate-900">रु 4,500.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2x Thermal Receipt Paper Rolls</span>
                    <span className="font-semibold text-slate-900">रु 600.00</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-200/80 pt-2 text-xs">
                  <span className="font-bold text-slate-900">Grand Total (Incl. VAT)</span>
                  <span className="font-extrabold text-blue-600 text-sm">रु 5,763.00</span>
                </div>
              </div>

              {/* Quick Action POS Pill */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 p-3 text-white">
                <div className="flex items-center gap-2">
                  <Printer className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold">80mm Thermal Receipt Ready</span>
                </div>
                <span className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  Print Bill
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Everything You Need (Grid Cards) */}
      <section id="everything" className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything You Need
            </h2>
            <p className="mt-3 text-base text-slate-600 max-w-xl mx-auto">
              Built for store owners and business managers across Nepal.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:border-blue-300 hover:bg-white hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <PackageCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">Curated Stock Control</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Browse and manage hundreds of inventory products with automated low-stock notifications.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:border-blue-300 hover:bg-white hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">Company Dashboards</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Create invoices, review customer balances, and update payment status — all in one central dashboard.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:border-blue-300 hover:bg-white hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">Role-Based Auth</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Strict multi-tenant security with encrypted JWT-secured API endpoints for store isolation.
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:border-blue-300 hover:bg-white hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <Printer className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">Instant Applications</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Issue tax bills in seconds with walk-in customer support, automatic VAT calculations, and print layout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Start CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl bg-blue-600 p-10 text-center text-white shadow-xl md:p-14">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to Start?
            </h2>
            <p className="mt-3 text-base text-blue-100 max-w-xl mx-auto">
              Join store owners across Nepal streamlining their sales and stock management today.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/dashboard"
                className="rounded-xl bg-white px-8 py-3.5 text-base font-bold text-blue-700 shadow-md transition hover:bg-blue-50 hover:scale-105"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faqs" className="border-t border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Everything you need to know before getting started.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-5 text-left text-base font-bold text-slate-900 hover:text-blue-600"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-blue-600 shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen ? (
                    <div className="border-t border-slate-100 p-5 text-sm text-slate-600 leading-relaxed bg-slate-50/50">
                      {faq.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 text-slate-600 text-sm">
        <div className="mx-auto max-w-7xl px-6 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                SB
              </div>
              <span className="font-display text-lg font-bold text-slate-900">
                SmartBill Nepal
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              SmartBill Nepal connects store owners with automated billing, inventory control, and AI sales insights.
            </p>
          </div>

          <div>
            <p className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Product</p>
            <ul className="space-y-2 text-xs font-semibold">
              <li><Link href="/invoices" className="hover:text-blue-600">Invoices</Link></li>
              <li><Link href="/products" className="hover:text-blue-600">Products Inventory</Link></li>
              <li><Link href="/stock-movements" className="hover:text-blue-600">Stock Movements</Link></li>
              <li><Link href="/ai-insights" className="hover:text-blue-600">AI Insights</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Account</p>
            <ul className="space-y-2 text-xs font-semibold">
              <li><Link href="/login" className="hover:text-blue-600">Sign In</Link></li>
              <li><Link href="/register" className="hover:text-blue-600">Create Account</Link></li>
              <li><Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link></li>
              <li><Link href="/profile" className="hover:text-blue-600">My Profile</Link></li>
            </ul>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 mt-12 border-t border-slate-100 pt-6 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SmartBill Nepal. All rights reserved.</p>
          <p className="font-semibold text-slate-800">
            Developed by <span className="text-blue-600 font-bold">Samir Khatiwada</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
