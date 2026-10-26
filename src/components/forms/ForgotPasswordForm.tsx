"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authClient, authErrorMessage } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    // The emailed link opens /reset-password with a token.
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setLoading(false);
    if (error) return setError(authErrorMessage(error));
    setSentTo(email);
  }

  return (
    <div className="card w-full max-w-md p-7 shadow-[var(--shadow-lg)] sm:p-8">
      <h1 className="text-4xl leading-none">{sentTo ? "Check your inbox" : "Forgot your password?"}</h1>
      {sentTo ? (
        // Same message whether or not the account exists, so this page can't be used to look up emails.
        <p className="mt-3 text-sm text-[var(--muted)]">
          If <strong className="text-[var(--ink)]">{sentTo}</strong> has an account, we sent it a link to choose a new password. It
          expires in 1 hour.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-[var(--muted)]">Enter your account email and we&rsquo;ll send you a reset link.</p>
          <form onSubmit={onSubmit} className="mt-6 grid gap-4">
            <label className="field">
              Email
              <input name="email" type="email" required autoComplete="email" className="input" />
            </label>
            {error ? (
              <p role="alert" className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                {error}
              </p>
            ) : null}
            <button disabled={loading} className="btn btn-primary btn-lg mt-1 w-full">
              {loading ? "One moment…" : "Send reset link"}
            </button>
          </form>
        </>
      )}
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        <Link href="/login" className="font-bold text-[var(--ink)] underline underline-offset-4">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
