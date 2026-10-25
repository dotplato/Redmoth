"use client";

import { useState } from "react";
import { KEYWORD_LIMITS, parseKeywords } from "@/lib/keywords";

/**
 * Tag-style keyword field: type and press Enter or comma to add, Backspace or ✕ to remove, paste a
 * comma list to add many. Posts as a single comma-separated `name` value; controlled when `value` is given.
 */
export function KeywordsInput({
  id,
  name,
  value,
  defaultValue = "",
  onChange,
  placeholder = "e.g. ai writing assistant",
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  const [own, setOwn] = useState(defaultValue);
  const [draft, setDraft] = useState("");
  const keywords = parseKeywords(value ?? own);
  const full = keywords.length >= KEYWORD_LIMITS.max;

  function commit(next: string[]) {
    const joined = parseKeywords(next.join(",")).join(", ");
    if (value === undefined) setOwn(joined);
    onChange?.(joined);
  }

  function add(text: string) {
    if (!text.trim()) return;
    commit([...keywords, ...text.split(/[,\n]/)]);
    setDraft("");
  }

  return (
    <div>
      <div
        className="input flex min-h-11 flex-wrap items-center gap-1.5 py-1.5"
        onClick={(event) => (event.currentTarget.querySelector("input:not([type=hidden])") as HTMLInputElement | null)?.focus()}
      >
        {keywords.map((keyword, i) => (
          <span key={keyword} className="flex items-center gap-1 rounded-full border border-[var(--line-strong)] bg-[var(--bg)] py-0.5 pl-2.5 pr-1 text-[13px]">
            {keyword}
            <button
              type="button"
              onClick={() => commit(keywords.filter((_, j) => j !== i))}
              aria-label={`Remove keyword ${keyword}`}
              className="grid h-5 w-5 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--bg-deep)] hover:text-[var(--danger)]"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          disabled={full}
          maxLength={KEYWORD_LIMITS.maxLength * 4}
          onChange={(event) => {
            const text = event.target.value;
            // A typed or pasted comma finishes the keyword(s) before it.
            if (/[,\n]/.test(text)) add(text);
            else setDraft(text);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(draft);
            } else if (event.key === "Backspace" && !draft && keywords.length) {
              commit(keywords.slice(0, -1));
            }
          }}
          onBlur={() => add(draft)}
          placeholder={full ? "Keyword limit reached" : keywords.length ? "Add another…" : placeholder}
          aria-label="Add SEO keyword"
          className="h-7 min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--faint)]"
        />
      </div>
      {name ? <input type="hidden" name={name} value={keywords.join(", ")} /> : null}
      <p className="mt-1 text-xs text-[var(--faint)]">
        {keywords.length}/{KEYWORD_LIMITS.max} · press Enter or comma to add
      </p>
    </div>
  );
}
