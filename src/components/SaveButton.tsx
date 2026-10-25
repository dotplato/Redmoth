"use client";

import { useSaved, type SaveKind } from "./SavedProvider";

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M4 2.5h8a.5.5 0 0 1 .5.5v10.6a.3.3 0 0 1-.48.24L8 10.9l-4.02 2.94a.3.3 0 0 1-.48-.24V3a.5.5 0 0 1 .5-.5Z" />
    </svg>
  );
}

/**
 * Save-to-collection toggle. "icon" sits on cards (shown on hover, or always once saved / on touch screens);
 * "full" is the labelled button on the app page. Signed-out clicks go to login and save afterwards.
 */
export function SaveButton({
  toolId,
  name,
  variant = "icon",
  kind = "tool",
}: {
  /** The app's id, or the flow's id when kind is "flow". */
  toolId: string;
  name: string;
  variant?: "icon" | "full";
  kind?: SaveKind;
}) {
  const { isSaved, toggle, signedIn } = useSaved();
  const saved = isSaved(toolId);
  const label = saved ? `Remove ${name} from saved` : signedIn ? `Save ${name}` : `Log in to save ${name}`;

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => toggle(toolId, kind)}
        aria-pressed={saved}
        aria-label={label}
        title={label}
        className={`btn btn-lg ${saved ? "btn-primary" : "btn-outline"}`}
      >
        <BookmarkIcon filled={saved} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(toolId, kind);
      }}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border transition ${
        saved
          ? "border-[var(--ink)] bg-[var(--accent)] text-[var(--ink)]"
          : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--ink)] hover:text-[var(--ink)] sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      }`}
    >
      <BookmarkIcon filled={saved} />
    </button>
  );
}
