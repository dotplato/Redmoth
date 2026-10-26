"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-limits";

// Errors shown under a field instead of above the button.
const FIELD_FOR_CODE: Record<string, string> = {
  INVALID_EMAIL: "email",
  PASSWORD_TOO_SHORT: "password",
  PASSWORD_TOO_LONG: "password",
};

export function AuthForm({ mode, next = "/account" }: { mode: "signup" | "login"; next?: string }) {
  const forSubmit = next === "/submit";
  const swapHref = `${mode === "signup" ? "/login" : "/signup"}${next === "/account" ? "" : `?next=${encodeURIComponent(next)}`}`;
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  // Signup (or logging in unverified) ends with a verification email instead of a session.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const signup = mode === "signup";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    // The verification link signs the user in and lands them on `next`.
    const { error } = signup
      ? await authClient.signUp.email({ name: String(form.get("name") ?? "").trim(), email, password, callbackURL: next })
      : await authClient.signIn.email({ email, password, callbackURL: next });
    setLoading(false);

    if (signup && !error) return setSentTo(email);
    if (error?.code === "EMAIL_NOT_VERIFIED") return setSentTo(email);
    if (error) return setErrors({ [FIELD_FOR_CODE[error.code ?? ""] ?? "form"]: authErrorMessage(error) });
    router.replace(next);
    router.refresh();
  }

  if (sentTo) {
    return (
      <div className="card w-full max-w-md p-7 shadow-[var(--shadow-lg)] sm:p-8">
        <h1 className="text-4xl leading-none">Check your inbox</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {signup ? "We sent a confirmation link to " : "Confirm your email before logging in. We sent a new link to "}
          <strong className="text-[var(--ink)]">{sentTo}</strong>. It expires in 1 hour.
        </p>
        <p className="mt-3 text-sm text-[var(--muted)]">
          No email? Check spam, or{" "}
          <Link href={`/login${next === "/account" ? "" : `?next=${encodeURIComponent(next)}`}`} onClick={() => setSentTo(null)} className="font-bold text-[var(--ink)] underline underline-offset-4">
            log in again
          </Link>{" "}
          to get a new link.
        </p>
      </div>
    );
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
            ? "Get a profile page, and manage the apps you list on redmoth."
            : "Log in to manage your profile and listings."}
      </p>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        {signup ? (
          <label className="field">
            Name or studio
            <input name="name" required minLength={2} autoComplete="name" className="input" placeholder="e.g. Nova Labs" />
            {err("name")}
          </label>
        ) : null}
        <label className="field">
          Email
          <input name="email" type="email" required autoComplete="email" className="input" />
          {err("email")}
        </label>
        <label className="field">
          <span className="flex items-baseline justify-between">
            <span>
              Password {signup ? <span className="field-hint">· {MIN_PASSWORD_LENGTH}+ characters</span> : null}
            </span>
            {signup ? null : (
              <Link href="/forgot-password" className="text-xs font-bold text-[var(--muted)] underline underline-offset-4 hover:text-[var(--ink)]">
                Forgot password?
              </Link>
            )}
          </span>
          <input
            name="password"
            type="password"
            required
            minLength={signup ? MIN_PASSWORD_LENGTH : undefined}
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
