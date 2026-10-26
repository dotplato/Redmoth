"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ToolLogo } from "./ToolLogo";

export type SimilarApp = {
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
};

// Fired by the page-header Compare button so the list opens ready to pick.
export const START_COMPARE_EVENT = "redmoth:start-compare";

const MAX_COMPARE = 3; // plus the current app = 4 columns on the compare page

export function SimilarApps({ current, apps }: { current: { slug: string; name: string }; apps: SimilarApp[] }) {
  const [comparing, setComparing] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    const start = () => setComparing(true);
    window.addEventListener(START_COMPARE_EVENT, start);
    return () => window.removeEventListener(START_COMPARE_EVENT, start);
  }, []);
  const href = `/compare?apps=${[current.slug, ...picked].map(encodeURIComponent).join(",")}`;

  function toggle(slug: string) {
    setPicked((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length >= MAX_COMPARE ? prev : [...prev, slug],
    );
  }

  function stopComparing() {
    setComparing(false);
    setPicked([]);
  }

  return (
    <section id="similar" aria-labelledby="similar-title" className="card scroll-mt-24 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
        <h2 id="similar-title" className="text-lg">
          More like this
        </h2>
        {apps.length ? (
          comparing ? (
            <button type="button" onClick={stopComparing} className="btn btn-ghost btn-sm">
              Cancel
            </button>
          ) : (
            <button type="button" onClick={() => setComparing(true)} className="btn btn-outline btn-sm">
              Compare
            </button>
          )
        ) : null}
      </div>

      {comparing ? (
        <p className="mx-5 mb-2 rounded-lg bg-[var(--bg)] px-3 py-2 text-xs leading-5 text-[var(--muted)]">
          Pick up to {MAX_COMPARE} apps to compare side by side with <span className="font-bold text-[var(--ink)]">{current.name}</span>.
        </p>
      ) : null}

      {apps.length ? (
        <ul className="pb-2">
          {apps.map((app) => {
            const on = picked.includes(app.slug);
            const full = !on && picked.length >= MAX_COMPARE;
            const body = (
              <>
                <ToolLogo src={app.logoUrl} name={app.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{app.name}</span>
                  <span className="block truncate text-xs text-[var(--muted)]">{app.tagline}</span>
                </span>
              </>
            );
            return (
              <li key={app.slug}>
                {comparing ? (
                  <label
                    className={`flex cursor-pointer items-center gap-3 px-5 py-2.5 transition hover:bg-[var(--bg)] ${full ? "cursor-not-allowed opacity-45" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={full}
                      onChange={() => toggle(app.slug)}
                      className="h-4 w-4 shrink-0 accent-[var(--ink)]"
                    />
                    {body}
                  </label>
                ) : (
                  <Link href={`/tools/${app.slug}`} className="flex items-center gap-3 px-5 py-2.5 transition hover:bg-[var(--bg)]">
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-5 pb-6 text-sm text-[var(--muted)]">No similar apps listed yet.</p>
      )}

      {comparing ? (
        <div className="border-t border-[var(--line)] p-4">
          {picked.length ? (
            <Link href={href} className="btn btn-primary w-full">
              Compare {picked.length + 1} apps
            </Link>
          ) : (
            <p className="text-center text-xs text-[var(--faint)]">Select at least one app</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

/** Header button: scrolls to "More like this" and switches it into compare mode. */
export function CompareJumpButton({ className = "" }: { className?: string }) {
  return (
    <a
      href="#similar"
      onClick={(event) => {
        const target = document.getElementById("similar");
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.dispatchEvent(new Event(START_COMPARE_EVENT));
      }}
      className={`btn btn-outline btn-lg ${className}`}
    >
      <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4.5h8.5M9.5 2.5l2 2-2 2M13 11.5H4.5M6.5 9.5l-2 2 2 2" />
      </svg>
      Compare
    </a>
  );
}
