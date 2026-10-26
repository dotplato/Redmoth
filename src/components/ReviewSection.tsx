"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouterTransition } from "@/lib/use-router-transition";
import { Spinner } from "./Spinner";
import { STAR_PATH, Stars } from "./Stars";
import { ToolLogo } from "./ToolLogo";
import type { ReviewKind, ReviewView } from "@/lib/reviews";

const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
const PAGE = 5;

/** Ratings summary + histogram, the viewer's own review form, and the review list. */
export function ReviewSection({
  kind,
  id,
  name,
  data,
  signedIn,
  isOwner,
}: {
  kind: ReviewKind;
  id: string;
  name: string;
  data: { reviews: ReviewView[]; count: number; avg: number; histogram: { stars: number; count: number }[]; mine: ReviewView | null };
  signedIn: boolean;
  isOwner: boolean;
}) {
  const router = useRouterTransition();
  const pathname = usePathname();
  const [editing, setEditing] = useState(!data.mine);
  const [rating, setRating] = useState(data.mine?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(data.mine?.body ?? "");
  const [sending, setSending] = useState(false);
  const [method, setMethod] = useState<"POST" | "DELETE">("POST"); // which button shows the spinner
  // Busy until the request is done and the page shows the updated reviews.
  const busy = sending || router.pending;
  const [error, setError] = useState("");
  const [shown, setShown] = useState(PAGE);
  const others = data.reviews.filter((review) => !review.mine);

  async function send(nextMethod: "POST" | "DELETE") {
    if (nextMethod === "POST" && !rating) {
      setError("Pick a star rating first.");
      return;
    }
    setSending(true);
    setMethod(nextMethod);
    setError("");
    const res = await fetch("/api/reviews", {
      method: nextMethod,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, id, rating, body }),
    });
    const json = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(json.error ?? "Something went wrong. Please try again.");
      return;
    }
    // Switch views together with the refreshed reviews, not before them.
    router.refresh(() => {
      if (nextMethod === "DELETE") {
        setRating(0);
        setBody("");
        setEditing(true);
      } else setEditing(false);
    });
  }

  const live = hover || rating;

  return (
    <section aria-labelledby={`reviews-${id}`} className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
      <div>
        <p className="eyebrow">Reviews</p>
        <h2 id={`reviews-${id}`} className="mt-2 text-3xl">
          {data.count ? "What people say" : "No reviews yet"}
        </h2>
        <div className="mt-5 flex items-end gap-3">
          <span className="font-display text-6xl leading-none">{data.count ? data.avg.toFixed(1) : "–"}</span>
          <div className="pb-1">
            <Stars value={data.avg} size={18} />
            <p className="mt-1 text-xs text-[var(--muted)]">
              {data.count} {data.count === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
        <ul className="mt-5 grid gap-1.5">
          {data.histogram.map((row) => (
            <li key={row.stars} className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <span className="w-3 text-right font-bold">{row.stars}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-deep)]">
                <span
                  className="block h-full rounded-full bg-[#e0a800] transition-all duration-500"
                  style={{ width: data.count ? `${(row.count / data.count) * 100}%` : "0%" }}
                />
              </span>
              <span className="w-5 tabular-nums">{row.count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid min-w-0 content-start gap-4">
        {isOwner ? (
          <p className="rounded-2xl border border-dashed border-[var(--line-strong)] px-5 py-4 text-sm text-[var(--muted)]">
            This is yours, so you can&rsquo;t review it. Reviews from others will show up here.
          </p>
        ) : !signedIn ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <p className="text-sm text-[var(--ink-soft)]">Used {name}? Share how it went.</p>
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn btn-outline btn-sm">
              Log in to review
            </Link>
          </div>
        ) : editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send("POST");
            }}
            className="card grid gap-4 p-5"
          >
            <div>
              <p className="text-sm font-bold">{data.mine ? "Edit your review" : `Rate ${name}`}</p>
              <div className="mt-2 flex items-center gap-3" onMouseLeave={() => setHover(0)}>
                <div role="radiogroup" aria-label="Your rating" className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={rating === value}
                      aria-label={`${value} star${value === 1 ? "" : "s"}`}
                      onMouseEnter={() => setHover(value)}
                      onFocus={() => setHover(value)}
                      onBlur={() => setHover(0)}
                      onClick={() => {
                        setRating(value);
                        setError("");
                      }}
                      className="grid h-9 w-9 place-items-center rounded-lg transition hover:scale-110"
                    >
                      <svg aria-hidden width="26" height="26" viewBox="0 0 16 16" className={value <= live ? "text-[#e0a800]" : "text-[var(--line-strong)]"}>
                        <path d={STAR_PATH} fill="currentColor" />
                      </svg>
                    </button>
                  ))}
                </div>
                <span className="text-sm font-bold text-[var(--muted)]">{LABELS[live]}</span>
              </div>
            </div>
            <label className="field">
              <span>
                Your review<span className="field-hint"> · optional</span>
              </span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="What did you use it for, and how did it go?"
                className="input min-h-20 py-2.5"
              />
            </label>
            {error ? (
              <p role="alert" className="text-sm font-bold text-[var(--danger)]">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} className="btn btn-primary btn-sm">
                {busy && method === "POST" ? <Spinner /> : null}
                {busy && method === "POST" ? "Saving…" : data.mine ? "Update review" : "Post review"}
              </button>
              {data.mine ? (
                <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        ) : data.mine ? (
          <ReviewItem review={data.mine}>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setEditing(true)} className="btn btn-outline btn-sm">
                Edit
              </button>
              <button type="button" disabled={busy} onClick={() => send("DELETE")} className="btn btn-ghost btn-sm text-[var(--danger)]">
                {busy && method === "DELETE" ? <Spinner /> : null}
                {busy && method === "DELETE" ? "Deleting…" : "Delete"}
              </button>
            </div>
            {error ? <p className="mt-2 text-sm font-bold text-[var(--danger)]">{error}</p> : null}
          </ReviewItem>
        ) : null}

        {others.length ? (
          <ul className="grid gap-3">
            {others.slice(0, shown).map((review) => (
              <li key={review.id}>
                <ReviewItem review={review} />
              </li>
            ))}
          </ul>
        ) : !data.mine && !isOwner ? (
          <p className="text-sm text-[var(--muted)]">Be the first to review {name}.</p>
        ) : null}
        {others.length > shown ? (
          <button type="button" onClick={() => setShown((n) => n + PAGE)} className="btn btn-outline btn-sm justify-self-start">
            Show more reviews ({others.length - shown})
          </button>
        ) : null}
      </div>
    </section>
  );
}

function ReviewItem({ review, children }: { review: ReviewView; children?: React.ReactNode }) {
  return (
    <article className={`rounded-2xl border p-5 ${review.mine ? "border-[var(--ink)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--surface)]"}`}>
      <div className="flex items-center gap-3">
        <ToolLogo src={review.author.avatarUrl} name={review.author.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">
            {review.author.name}
            {review.mine ? <span className="ml-2 text-xs font-normal text-[var(--muted)]">Your review</span> : null}
          </p>
          <div className="flex items-center gap-2">
            <Stars value={review.rating} size={13} />
            <time dateTime={review.createdAt} className="text-xs text-[var(--faint)]">
              {new Date(review.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
            </time>
          </div>
        </div>
      </div>
      {review.body ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--ink-soft)]">{review.body}</p> : null}
      {children}
    </article>
  );
}
