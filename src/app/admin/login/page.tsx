"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    if (!res.ok) {
      setLoading(false);
      setError("That email and password don't match.");
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
          <span className="font-bold tracking-tight">ToolsMade Admin</span>
        </div>
        <div className="card p-7 shadow-[var(--shadow-lg)]">
          <h1 className="font-display text-4xl leading-none">Welcome back</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Sign in to manage ToolsMade.</p>
          <form onSubmit={onSubmit} className="mt-6 grid gap-4">
            <label className="field">
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                className="input"
                defaultValue="admin@toolsmade.local"
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
