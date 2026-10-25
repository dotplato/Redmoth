"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode, next = "/account" }: { mode: "signup" | "login"; next?: string }) {
  const forSubmit = next === "/submit";
  const swapHref = `${mode === "signup" ? "/login" : "/signup"}${next === "/account" ? "" : `?next=${encodeURIComponent(next)}`}`;
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const signup = mode === "signup";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const res = await fetch(`/api/creator/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      setErrors(json.errors ?? { form: json.error ?? "Something went wrong." });
      return;
    }
    router.replace(next);
    router.refresh();
  }

  const err = (key: string) => (errors[key] ? <span className="text-xs font-bold text-[var(--danger)]">{errors[key]}</span> : null);

  return (
    <div className="card w-full max-w-md p-7 shadow-[var(--shadow-lg)] sm:p-8">
      {forSubmit ? (
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] ring-1 ring-[var(--ink)]" />
          Step 1 of 2 · then the submit form
        </p>
      ) : null}
      <h1 className="text-4xl leading-none">
        {forSubmit ? (signup ? "Sign up to submit" : "Log in to submit") : signup ? "Join as a creator" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {forSubmit
          ? "A free creator account lets you list apps and track their review. You’ll go straight to the form."
          : signup
            ? "Get a profile page, and manage the apps you list on ToolsMade."
            : "Log in to manage your profile and listings."}
      </p>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        {signup ? (
          <label className="field">
            Name or studio
            <input name="name" required autoComplete="name" className="input" placeholder="e.g. Nova Labs" />
            {err("name")}
          </label>
        ) : null}
        <label className="field">
          Email
          <input name="email" type="email" required autoComplete="email" className="input" />
          {err("email")}
        </label>
        <label className="field">
          <span>
            Password {signup ? <span className="field-hint">· 8+ characters</span> : null}
          </span>
          <input
            name="password"
            type="password"
            required
            minLength={signup ? 8 : undefined}
            autoComplete={signup ? "new-password" : "current-password"}
            className="input"
          />
          {err("password")}
        </label>
        {errors.form ? (
          <p role="alert" className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
            {errors.form}
          </p>
        ) : null}
        <button disabled={loading} className="btn btn-primary btn-lg mt-1 w-full">
          {loading ? "One moment…" : signup ? "Create account" : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        {signup ? "Already have an account? " : "New here? "}
        <Link href={swapHref} className="font-bold text-[var(--ink)] underline underline-offset-4">
          {signup ? "Log in" : "Create a creator account"}
        </Link>
      </p>
    </div>
  );
}
