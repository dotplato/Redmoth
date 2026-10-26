"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SiteLogo } from "@/components/SiteLogo";
import { Spinner } from "@/components/Spinner";
import { authClient, authErrorMessage } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [navigating, startNavigation] = useTransition();
  // Busy until signed in and the dashboard has loaded.
  const loading = sending || navigating;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSending(true);
    const form = new FormData(event.currentTarget);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    setSending(false);
    if (error) {
      // NOT_ADMIN: a valid non-admin account (blocked by the session hook in src/lib/auth.ts).
      setError(error.code === "NOT_ADMIN" ? "This account doesn't have admin access." : authErrorMessage(error));
      return;
    }
    startNavigation(() => {
      router.replace("/admin");
      router.refresh();
    });
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12">
      <div className="glow pointer-events-none absolute inset-0" />
      <div className="paper-grain pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <SiteLogo className="h-8" />
          <span className="text-sm text-[var(--faint)]">Admin</span>
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
              {loading ? <Spinner /> : null}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
