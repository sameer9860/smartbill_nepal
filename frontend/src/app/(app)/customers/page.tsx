"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
        (c.phone || "").toLowerCase().includes(q)
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
  if (loading) return <LoadingPage label="Loading customers…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your customer directory"
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            Add customer
          </button>
        }
      />

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search by name or phone…"
        className="max-w-md"
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No customers found"
          description="Add customers to link them on invoices."
          action={
            <button type="button" className="btn-primary" onClick={openCreate}>
              Add customer
            </button>
          }
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-3 font-medium">{c.full_name}</td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3 text-[var(--ink-muted)]">
                    {c.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-muted)]">
                    {c.address || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-sm text-[var(--navy-2)] hover:underline"
                        onClick={() => openEdit(c)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => {
                          setEditing(c);
                          setDeleteOpen(true);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit customer" : "Add customer"}
        wide
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="cust-name">
              Full name
            </label>
            <input
              id="cust-name"
              className="input"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="cust-phone">
              Phone
            </label>
            <input
              id="cust-phone"
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="cust-email">
              Email
            </label>
            <input
              id="cust-email"
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="cust-address">
              Address
            </label>
            <input
              id="cust-address"
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || !form.full_name.trim() || !form.phone.trim()}
            onClick={() => void saveCustomer()}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete customer"
        danger
      >
        <p className="text-sm text-[var(--ink-muted)]">
          Delete <strong>{editing?.full_name}</strong>? This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setDeleteOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            disabled={busy}
            onClick={() => void confirmDelete()}
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
