"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Type,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { ApiError, authApi, clearTokens } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const CONFIRM_PHRASE = "delete-my-account";

const RULES = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p: string) => /[0-9]/.test(p), label: "One number" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "One special character" },
];

const floatLabelClass =
  "pointer-events-none absolute left-0 top-3.5 text-sm text-slate-400 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-blue-600 peer-[&:not(:placeholder-shown)]:top-1 peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold peer-[&:not(:placeholder-shown)]:text-slate-500";

const floatInputClass =
  "peer w-full bg-transparent pb-1.5 pt-5 text-sm text-slate-900 placeholder-transparent outline-none";

function FloatField({
  id,
  label,
  type = "text",
  icon: Icon,
  value,
  onChange,
  autoComplete,
  required: req = true,
  minLength,
  spellCheck,
  mono,
  borderClass,
  extra,
}: {
  id: string;
  label: string;
  type?: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  spellCheck?: boolean;
  mono?: boolean;
  borderClass?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 transition focus-within:border-slate-400 ${
        borderClass || "border-slate-200 bg-[var(--surface-2)]"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <div className="relative flex-1">
        <input
          id={id}
          type={type}
          className={`${floatInputClass} ${mono ? "font-mono tracking-normal" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          autoComplete={autoComplete}
          required={req}
          minLength={minLength}
          spellCheck={spellCheck}
        />
        <label htmlFor={id} className={floatLabelClass}>
          {label}
        </label>
      </div>
      {extra}
    </div>
  );
}

function PasswordToggle({
  shown,
  onToggle,
}: {
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="shrink-0 text-slate-400 transition hover:text-slate-600"
      title={shown ? "Hide password" : "Show password"}
      tabIndex={-1}
    >
      {shown ? (
        <Eye className="h-4 w-4 text-blue-600" />
      ) : (
        <EyeOff className="h-4 w-4" />
      )}
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const strength = RULES.filter((r) => r.test(newPassword)).length;
  const strengthPct = (strength / RULES.length) * 100;
  const strengthColor =
    strength <= 1
      ? "bg-red-500"
      : strength === 2
        ? "bg-amber-500"
        : strength === 3
          ? "bg-yellow-400"
          : "bg-emerald-500";
  const strengthLabel =
    strength <= 1 ? "Weak" : strength === 2 ? "Fair" : strength === 3 ? "Good" : "Strong";

  const passwordReady = deletePassword.trim().length > 0;
  const phraseReady = confirmInput === CONFIRM_PHRASE;
  const canDelete = passwordReady && phraseReady;

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwMessage("");
    if (newPassword !== confirm) {
      setPwError("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    setPwBusy(true);
    try {
      const res = await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setPwMessage(res.message);
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : "Password change failed. Please try again.");
    } finally {
      setPwBusy(false);
    }
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!canDelete) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await authApi.deleteAccount({
        password: deletePassword,
        confirmation: confirmInput,
      });
      clearTokens();
      setUser(null);
      router.replace("/login");
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Account deletion failed. Please try again.");
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your password and account security"
      />

      <div className="mx-auto max-w-2xl space-y-6">
        {pwMessage ? (
          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">Password Updated</p>
              <p className="mt-0.5 text-sm opacity-80">{pwMessage}</p>
            </div>
          </div>
        ) : null}

        {pwError ? (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <p className="text-sm">{pwError}</p>
          </div>
        ) : null}

        <form className="card space-y-5" onSubmit={(e) => void submitPassword(e)}>
          <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-[var(--navy)]">
                Change Password
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Enter your current password, then choose a new one
              </p>
            </div>
          </div>

          <FloatField
            id="old_password"
            label="Current Password *"
            type={showOld ? "text" : "password"}
            icon={Lock}
            value={oldPassword}
            onChange={setOldPassword}
            autoComplete="current-password"
            extra={<PasswordToggle shown={showOld} onToggle={() => setShowOld((v) => !v)} />}
          />

          <div>
            <FloatField
              id="new_password"
              label="New Password *"
              type={showNew ? "text" : "password"}
              icon={KeyRound}
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              minLength={8}
              extra={<PasswordToggle shown={showNew} onToggle={() => setShowNew((v) => !v)} />}
            />

            {newPassword.length > 0 ? (
              <div className="mt-2 space-y-1.5 px-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--ink-muted)]">Password strength:</span>
                  <span
                    className={`font-semibold ${
                      strength <= 1
                        ? "text-red-600"
                        : strength === 2
                          ? "text-amber-600"
                          : strength === 3
                            ? "text-yellow-600"
                            : "text-emerald-600"
                    }`}
                  >
                    {strengthLabel}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                    style={{ width: `${strengthPct}%` }}
                  />
                </div>
                <ul className="grid grid-cols-2 gap-1 pt-1">
                  {RULES.map((rule) => {
                    const pass = rule.test(newPassword);
                    return (
                      <li
                        key={rule.label}
                        className={`flex items-center gap-1 text-[11px] ${
                          pass ? "text-emerald-600" : "text-[var(--ink-muted)]"
                        }`}
                      >
                        <CheckCircle2
                          className={`h-3.5 w-3.5 shrink-0 ${pass ? "text-emerald-500" : "opacity-30"}`}
                        />
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>

          <div>
            <FloatField
              id="confirm_password"
              label="Confirm New Password *"
              type={showConfirm ? "text" : "password"}
              icon={KeyRound}
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              minLength={8}
              borderClass={
                confirm && confirm !== newPassword
                  ? "border-red-400 bg-[var(--surface-2)]"
                  : confirm && confirm === newPassword
                    ? "border-emerald-400 bg-[var(--surface-2)]"
                    : undefined
              }
              extra={
                <PasswordToggle shown={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
              }
            />
            {confirm && confirm !== newPassword ? (
              <p className="mt-1 px-1 text-xs text-red-600">Passwords do not match.</p>
            ) : confirm && confirm === newPassword ? (
              <p className="mt-1 px-1 text-xs text-emerald-600">✓ Passwords match</p>
            ) : null}
          </div>

          <div className="border-t border-[var(--line)] pt-4">
            <button
              type="submit"
              className="btn-primary"
              disabled={pwBusy || !oldPassword || !newPassword || newPassword !== confirm}
            >
              {pwBusy ? "Updating Password…" : "Update Password"}
            </button>
          </div>
        </form>

        <form
          className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm dark:border-red-900 dark:bg-[var(--card)]"
          onSubmit={(e) => void deleteAccount(e)}
        >
          <div className="border-b border-red-100 px-5 py-4 dark:border-red-900/60">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-900/50">
                <ShieldOff className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-red-600">
                  Danger Zone
                </h2>
                <p className="text-xs text-red-500">
                  Permanently delete your account and all associated data
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-white p-4 dark:border-red-900">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div className="text-sm text-red-600">
                <p className="font-semibold text-red-600">
                  This action is permanent and cannot be undone
                </p>
                <p className="mt-1 text-red-500">
                  Deleting your account will remove your profile, products, customers, invoices,
                  stock logs, and subscription access
                  {user ? (
                    <>
                      {" "}
                      for <strong className="text-red-600">@{user.username}</strong>
                    </>
                  ) : null}
                  .
                </p>
              </div>
            </div>

            {deleteError ? (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-600">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <p>{deleteError}</p>
              </div>
            ) : null}

            <FloatField
              id="delete_password"
              label="Enter your password"
              type={showDeletePassword ? "text" : "password"}
              icon={Lock}
              value={deletePassword}
              onChange={setDeletePassword}
              autoComplete="current-password"
              borderClass="border-red-200 bg-white"
              extra={
                <PasswordToggle
                  shown={showDeletePassword}
                  onToggle={() => setShowDeletePassword((v) => !v)}
                />
              }
            />

            <div>
              <p className="mb-2 text-sm text-red-600">
                To confirm, type{" "}
                <code className="rounded bg-red-50 px-1.5 py-0.5 font-mono text-xs font-bold tracking-normal text-red-600">
                  {CONFIRM_PHRASE}
                </code>{" "}
                below
              </p>
              <FloatField
                id="confirm_phrase"
                label="delete-my-account"
                icon={Type}
                value={confirmInput}
                onChange={setConfirmInput}
                autoComplete="off"
                required={false}
                spellCheck={false}
                mono
                borderClass={
                  confirmInput && confirmInput !== CONFIRM_PHRASE
                    ? "border-red-400 bg-white"
                    : confirmInput === CONFIRM_PHRASE
                      ? "border-emerald-400 bg-white"
                      : "border-red-200 bg-white"
                }
              />
              {confirmInput && confirmInput !== CONFIRM_PHRASE ? (
                <p className="mt-1 px-1 text-xs text-red-600">
                  Phrase does not match. Please type exactly:{" "}
                  <strong className="font-mono">{CONFIRM_PHRASE}</strong>
                </p>
              ) : confirmInput === CONFIRM_PHRASE ? (
                <p className="mt-1 flex items-center gap-1 px-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Phrase confirmed
                </p>
              ) : null}
            </div>

            <div className="border-t border-red-100 pt-4 dark:border-red-900/50">
              <button
                type="submit"
                disabled={!canDelete || deleteBusy}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed ${
                  canDelete && !deleteBusy
                    ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                    : "bg-slate-200 text-slate-400 focus:ring-slate-300"
                }`}
              >
                <Trash2 className="h-4 w-4" />
                {deleteBusy ? "Deleting Account…" : "Delete this account"}
              </button>
              {!canDelete ? (
                <p className="mt-2 text-xs text-red-500">
                  Enter your password and type{" "}
                  <span className="font-mono font-semibold">{CONFIRM_PHRASE}</span> to enable
                  deletion.
                </p>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
