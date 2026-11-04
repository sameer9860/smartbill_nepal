"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Shield, Users, XCircle } from "lucide-react";

import { LoadingPage } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";

const PLAN_BADGE: Record<string, string> = {
  TRIAL: "bg-slate-100 text-slate-600",
  BASIC_MONTHLY: "bg-blue-100 text-blue-700",
  PRO_YEARLY: "bg-violet-100 text-violet-700",
  ENTERPRISE: "bg-amber-100 text-amber-700",
};

const STATUS_DOT: Record<string, string> = {
  TRIAL_ACTIVE: "bg-blue-400",
  ACTIVE: "bg-emerald-400",
  EXPIRED: "bg-red-400",
  CANCELLED: "bg-slate-400",
};

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .users({ search })
      .then((res) => setUsers(res.users))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(u: AdminUser) {
    setMsg("");
    setError("");
    try {
      const updated = await adminApi.updateUser(u.id, {
        is_active: !u.is_active,
      });
      setUsers((prev) =>
        prev.map((x) =>
          x.id === updated.id ? { ...x, is_active: updated.is_active } : x
        )
      );
      setMsg(
        `User "${u.username}" ${updated.is_active ? "activated" : "deactivated"}.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update user");
    }
  }

  async function toggleStaff(u: AdminUser) {
    setMsg("");
    setError("");
    try {
      const updated = await adminApi.updateUser(u.id, {
        is_staff: !u.is_staff,
      });
      setUsers((prev) =>
        prev.map((x) =>
          x.id === updated.id ? { ...x, is_staff: updated.is_staff } : x
        )
      );
      setMsg(
        `User "${u.username}" ${updated.is_staff ? "granted" : "revoked"} staff access.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update user");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="All registered users on the platform."
      />

      {msg && (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {msg}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by username, email, or name…"
      />

      {loading ? (
        <LoadingPage label="Loading users…" />
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Users className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">No users found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">User</th>
                  <th className="px-5 py-3 text-left font-semibold">Store</th>
                  <th className="px-5 py-3 text-left font-semibold">Plan</th>
                  <th className="px-5 py-3 text-left font-semibold">Joined</th>
                  <th className="px-5 py-3 text-left font-semibold">Last Login</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Staff</th>
                  <th className="px-5 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isMe = u.id === me?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      {/* User */}
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                            {(u.first_name?.[0] || u.username[0]).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {u.username}
                              {isMe && (
                                <span className="ml-1 text-xs text-violet-500">(you)</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">{u.email || "—"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Store */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                        {u.tenant_name ?? "—"}
                      </td>

                      {/* Plan */}
                      <td className="whitespace-nowrap px-5 py-3.5">
                        {u.subscription_plan ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              PLAN_BADGE[u.subscription_plan] ?? "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {u.subscription_plan.replace("_", " ")}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                        {new Date(u.date_joined).toLocaleDateString()}
                      </td>

                      {/* Last login */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                        {u.last_login
                          ? new Date(u.last_login).toLocaleDateString()
                          : "Never"}
                      </td>

                      {/* Active */}
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            u.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.is_active ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Staff */}
                      <td className="whitespace-nowrap px-5 py-3.5">
                        {u.is_staff ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                            <Shield className="h-3 w-3" /> Staff
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">User</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-5 py-3.5">
                        {isMe ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <div className="flex flex-col gap-1.5 sm:flex-row">
                            <button
                              onClick={() => void toggleActive(u)}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-white transition ${
                                u.is_active
                                  ? "bg-red-400 hover:bg-red-500"
                                  : "bg-emerald-500 hover:bg-emerald-600"
                              }`}
                            >
                              {u.is_active ? (
                                <>
                                  <XCircle className="h-3.5 w-3.5" /> Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Activate
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => void toggleStaff(u)}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                u.is_staff
                                  ? "border border-violet-300 bg-white text-violet-700 hover:bg-violet-50"
                                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                              }`}
                            >
                              <Shield className="h-3.5 w-3.5" />
                              {u.is_staff ? "Revoke Staff" : "Make Staff"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            {users.length} user{users.length !== 1 ? "s" : ""} shown
          </div>
        </div>
      )}
    </div>
  );
}

