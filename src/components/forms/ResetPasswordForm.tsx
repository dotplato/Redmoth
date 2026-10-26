"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-limits";

/** `token` comes from the emailed link; null when the link was invalid or expired. */
export function ResetPasswordForm({ token }: { token: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password") ?? "");
    if (newPassword !== String(form.get("confirm") ?? "")) return setError("The two passwords don't match.");
    setLoading(true);
    setError("");
    const { error } = await authClient.resetPassword({ newPassword, token: token! });
    setLoading(false);
    if (error) return setError(authErrorMessage(error));
    setDone(true);
  }

  if (!token || done) {
    return (
      <div className="card w-full max-w-md p-7 shadow-[var(--shadow-lg)] sm:p-8">
        <h1 className="text-4xl leading-none">{done ? "Password updated" : "Link expired"}</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {done
            ? "You can now log in with your new password. For safety, you've been signed out everywhere else."
            : "This reset link is invalid or has expired. Reset links work once and last 1 hour."}
        </p>
        <Link href={done ? "/login" : "/forgot-password"} className="btn btn-primary btn-lg mt-6 w-full">
          {done ? "Log in" : "Send a new link"}
        </Link>
      </div>
    );
  }

  return (
    <div className="card w-full max-w-md p-7 shadow-[var(--shadow-lg)] sm:p-8">
      <h1 className="text-4xl leading-none">Choose a new password</h1>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <label className="field">
          <span>
            New password <span className="field-hint">· {MIN_PASSWORD_LENGTH}+ characters</span>
          </span>
          <input name="password" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className="input" />
        </label>
        <label className="field">
          Confirm new password
          <input name="confirm" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className="input" />
        </label>
        {error ? (
          <p role="alert" className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}
        <button disabled={loading} className="btn btn-primary btn-lg mt-1 w-full">
          {loading ? "One moment…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
