"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { ExpiredGate } from "@/components/ExpiredGate";
import { LoadingPage } from "@/components/LoadingCard";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { ApiError, coreApi } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await coreApi.categories();
      setItems(data);
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
    return items.filter((c) => c.name.toLowerCase().includes(q));
  }, [items, query]);

  function openCreate() {
    setEditing(null);
    setName("");
    setFormOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setFormOpen(true);
  }

  async function saveCategory() {
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      if (editing) {
        await coreApi.updateCategory(editing.id, { name: name.trim() });
      } else {
        await coreApi.createCategory({ name: name.trim() });
      }
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
      await coreApi.deleteCategory(editing.id);
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
  if (loading) return <LoadingPage label="Loading product categories…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize your store products into structured groups"
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
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
          placeholder="Search categories by name…"
          className="w-full max-w-md"
        />
        <span className="hidden text-xs font-semibold text-slate-500 sm:inline">
          Showing {filtered.length} of {items.length} categories
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No categories found"
          description="Create categories like 'Electronics', 'Groceries', or 'Clothing' to group products."
          action={
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
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
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Category Name</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Created Date</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((cat, index) => (
                  <tr key={cat.id} className="transition hover:bg-slate-50/50">
                    <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                          <FolderTree className="h-4 w-4" />
                        </div>
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(cat.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          onClick={() => openEdit(cat)}
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                          onClick={() => {
                            setEditing(cat);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Category" : "Add New Category"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void saveCategory();
          }}
          className="space-y-4"
        >
          <div>
            <label className="label" htmlFor="cat-name">
              Category Name *
            </label>
            <input
              id="cat-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Beverages & Drinks"
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={busy || !name.trim()}
            >
              {busy ? "Saving…" : "Save Category"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Category"
        danger
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <strong>{editing?.name}</strong>?
          </p>
          <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
            Products assigned to this category will not be deleted, but will become uncategorized.
          </p>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" className="btn-secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              disabled={busy}
              onClick={() => void confirmDelete()}
            >
              {busy ? "Deleting…" : "Delete Category"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

