"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { ApiError, coreApi } from "@/lib/api";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setCustomers(await coreApi.customers());
      setError("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setError("Trial expired. Subscribe to continue.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load customers");
      }
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await coreApi.createCustomer({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
      });
      setForm({ full_name: "", phone: "", email: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create customer");
    } finally {
      setSaving(false);
    }
  }

  if (error.includes("Trial expired")) {
    return (
      <div className="card border-amber-200 bg-amber-50">
        <p className="font-medium text-amber-950">{error}</p>
        <Link href="/subscription" className="btn-primary mt-4 inline-flex">
          View plans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[var(--navy)]">Customers</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Keep customer contacts for invoicing
        </p>
      </div>

      <form onSubmit={onCreate} className="card grid gap-3 md:grid-cols-4">
        <input
          className="input"
          placeholder="Full name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Email (optional)"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Adding…" : "Add customer"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3 font-medium">{c.full_name}</td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3">{c.email || "—"}</td>
              </tr>
            ))}
            {customers.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-[var(--ink-muted)]">
                  No customers yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
