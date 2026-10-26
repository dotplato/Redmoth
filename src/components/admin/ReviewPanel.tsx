"use client";

import { useState } from "react";
import { useRouterTransition } from "@/lib/use-router-transition";
import { Spinner } from "../Spinner";

type Props = {
  toolId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "REJECTED";
  submitterEmail: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
};

const fmt = (iso: string) => new Date(iso).toLocaleString("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Publish / reject a public submission, with feedback emailed to the person who submitted it. */
export function ReviewPanel({ toolId, status, submitterEmail, submittedAt, reviewedAt, reviewNote }: Props) {
  const router = useRouterTransition();
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [clicked, setClicked] = useState<"publish" | "reject" | null>(null); // which button shows the spinner
  // Busy until the decision is saved and the page shows the new status.
  const busy = sending || router.pending ? clicked : null;
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const pending = status === "DRAFT";

  async function decide(decision: "publish" | "reject") {
    setError("");
    setNotice("");
    if (decision === "reject" && feedback.trim().length < 10) {
      setError("Add feedback for the maker before rejecting (at least 10 characters).");
      return;
    }
    setClicked(decision);
    setSending(true);
    const res = await fetch(`/api/admin/tools/${toolId}/review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision, feedback }),
    });
    const json = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(json.error ?? "Could not save the review.");
      return;
    }
    const mail =
      json.email?.status === "SENT"
        ? `Email sent to ${submitterEmail}.`
        : json.email?.status === "SKIPPED"
          ? "Email saved to the outbox (no email provider configured yet)."
          : json.email?.status === "FAILED"
            ? `Email failed: ${json.email.error}`
            : "No submitter email on file.";
    setNotice(`${decision === "publish" ? "Published" : "Rejected"}. ${mail}`);
    setFeedback("");
    router.refresh();
  }

  return (
    <section className="card mb-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--accent-soft)] px-5 py-4">
        <div>
          <p className="font-bold">{pending ? "Waiting for review" : "Reviewed submission"}</p>
          <p className="text-sm text-[var(--ink-soft)]">
            Submitted {fmt(submittedAt)} {submitterEmail ? <>by <span className="font-bold">{submitterEmail}</span></> : null}
            {reviewedAt ? ` · reviewed ${fmt(reviewedAt)}` : ""}
          </p>
        </div>
        <span className="tag-submitted">{pending ? "Needs review" : status === "PUBLISHED" ? "Approved" : status === "REJECTED" ? "Rejected" : status}</span>
      </div>

      <div className="grid gap-4 p-5">
        {reviewNote ? (
          <p className="rounded-xl bg-[var(--bg)] p-3 text-sm leading-6 text-[var(--ink-soft)]">
            <span className="font-bold text-[var(--ink)]">Last feedback sent:</span> {reviewNote}
          </p>
        ) : null}

        <label className="field">
          <span>
            Feedback for the maker <span className="field-hint">· required to reject, optional when publishing</span>
          </span>
          <textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            maxLength={2000}
            placeholder="e.g. Please replace the screenshots with in-app screens and add your pricing details."
            className="input min-h-24"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={busy !== null} onClick={() => decide("publish")} className="btn btn-accent">
            {busy === "publish" ? <Spinner /> : null}
            {busy === "publish" ? "Publishing…" : status === "PUBLISHED" ? "Re-send approval" : "Publish"}
          </button>
          <button type="button" disabled={busy !== null} onClick={() => decide("reject")} className="btn btn-outline !border-[var(--danger)] !text-[var(--danger)]">
            {busy === "reject" ? <Spinner /> : null}
            {busy === "reject" ? "Rejecting…" : "Reject"}
          </button>
          <span className="text-xs text-[var(--muted)]">
            {submitterEmail ? `The decision and feedback are emailed to ${submitterEmail}.` : "No email on file — the decision is saved only."}
          </span>
        </div>

        {error ? <p role="alert" className="text-sm font-bold text-[var(--danger)]">{error}</p> : null}
        {notice ? <p role="status" className="text-sm font-bold text-[var(--ok)]">{notice}</p> : null}
      </div>
    </section>
  );
}
