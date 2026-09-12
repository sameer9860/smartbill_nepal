"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, MapPin, Pencil, Phone, Trash2, UserPlus } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { ExpiredGate } from "@/components/ExpiredGate";
import { LoadingPage } from "@/components/LoadingCard";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { ApiError, coreApi } from "@/lib/api";
import type { Customer } from "@/lib/types";

type FormState = {
  full_name: string;
  phone: string;
  email: string;
  address: string;
};

const emptyForm: FormState = {
  full_name: "",
  phone: "",
  email: "",
  address: "",
};

export default function CustomersPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await coreApi.customers());
      setError("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) setExpired(true);
      else setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setForm({
      full_name: customer.full_name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    });
    setFormOpen(true);
  }

  async function saveCustomer() {
    if (!form.full_name.trim() || !form.phone.trim()) return;
    setBusy(true);
    setError("");
    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    };
    try {
      if (editing) await coreApi.updateCustomer(editing.id, payload);
      else await coreApi.createCustomer(payload);
      setFormOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) setExpired(true);
      else setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!editing) return;
    setBusy(true);
    try {
      await coreApi.deleteCustomer(editing.id);
      setDeleteOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) setExpired(true);
      else setError(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (expired) return <ExpiredGate />;
  if (loading) return <LoadingPage label="Loading customer directory…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        description="Manage customer profiles, phone numbers, and invoicing records"
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <UserPlus className="h-4 w-4" />
            <span>Add Customer</span>
          </button>
        }
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by customer name, phone, or email…"
          className="w-full max-w-md"
        />
        <span className="hidden text-xs font-semibold text-slate-500 sm:inline">
          Showing {filtered.length} of {items.length} customers
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No customers found"
          description="Add customer profiles to quickly link them when generating invoices."
          action={
            <button type="button" className="btn-primary" onClick={openCreate}>
              <UserPlus className="h-4 w-4" />
              <span>Add Customer</span>
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-500">
                <tr>
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-xs w-12">S.N.</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Customer Name</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Phone Number</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Email</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Address</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c, index) => {
                  const initial = c.full_name ? c.full_name.charAt(0).toUpperCase() : "C";
                  return (
                    <tr key={c.id} className="transition hover:bg-slate-50/50">
                      <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm">
                            {initial}
                          </div>
                          <span>{c.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-700">
                        {c.phone ? (
                          <a
                            href={`tel:${c.phone}`}
                            className="inline-flex items-center gap-1 hover:text-indigo-600 hover:underline"
                          >
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{c.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {c.email ? (
                          <a
                            href={`mailto:${c.email}`}
                            className="inline-flex items-center gap-1 hover:text-indigo-600 hover:underline"
                          >
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span>{c.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {c.address ? (
                          <div className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-xs">{c.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate-500" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                            onClick={() => {
                              setEditing(c);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Customer" : "Add New Customer"}
        wide
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void saveCustomer();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="cust-name">
                Full Name *
              </label>
              <input
                id="cust-name"
                className="input"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="e.g. Ram Kumar Shrestha"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="cust-phone">
                Phone Number *
              </label>
              <input
                id="cust-phone"
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 9841000000"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="cust-email">
                Email Address (Optional)
              </label>
              <input
                id="cust-email"
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. ram@example.com"
              />
            </div>

            <div>
              <label className="label" htmlFor="cust-address">
                Address / City (Optional)
              </label>
              <input
                id="cust-address"
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. New Road, Kathmandu"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={busy || !form.full_name.trim() || !form.phone.trim()}
            >
              {busy ? "Saving…" : "Save Customer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Customer"
        danger
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete customer <strong>{editing?.full_name}</strong>?
          </p>
          <p className="text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
            This action cannot be undone. Previous invoices linked to this customer will retain their record.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition"
              disabled={busy}
              onClick={() => void confirmDelete()}
            >
              {busy ? "Deleting…" : "Delete Customer"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

