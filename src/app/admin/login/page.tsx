"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient, authErrorMessage } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (error) {
      setLoading(false);
      // FORBIDDEN: a valid non-admin account (blocked by the session hook in src/lib/auth.ts).
      setError(error.status === 403 ? "This account doesn't have admin access." : authErrorMessage(error));
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12">
      <div className="glow pointer-events-none absolute inset-0" />
      <div className="paper-grain pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center rounded-[11px] bg-[var(--ink)]">
            <span className="font-display text-[21px] leading-none text-white">T</span>
            <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          </span>
          <span className="font-bold tracking-tight">redmoth Admin</span>
        </div>
        <div className="card p-7 shadow-[var(--shadow-lg)]">
          <h1 className="font-display text-4xl leading-none">Welcome back</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Sign in to manage redmoth.</p>
          <form onSubmit={onSubmit} className="mt-6 grid gap-4">
            <label className="field">
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                className="input"
                defaultValue="admin@redmoth.local"
              />
            </label>
            <label className="field">
              Password
              <input name="password" type="password" required autoComplete="current-password" className="input" autoFocus />
            </label>
            {error ? (
              <p role="alert" className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                {error}
              </p>
            ) : null}
            <button disabled={loading} className="btn btn-primary btn-lg mt-1 w-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
