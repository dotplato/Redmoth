"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HERO_SLOTS, heroSlotPoint } from "@/lib/hero-slots";
import { ToolLogo } from "../ToolLogo";

type App = { id: string; name: string; tagline: string; logoUrl: string | null };

const RING_LABEL = { inner: "Inner ring", left: "Left side", right: "Right side" } as const;
const RECENT_COUNT = 8;

/** Admin editor for the 14 hero tiles: click a tile on the map, then pick, replace or remove its app. */
export function HeroEditor({
  apps,
  initial,
  curated,
  siteUrl,
}: {
  /** Published apps, most recently added first. */
  apps: App[];
  initial: (string | null)[];
  curated: boolean;
  siteUrl: string;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const searchBox = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<(string | null)[]>(initial);
  const [isCurated, setIsCurated] = useState(curated);
  const [editing, setEditing] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const byId = new Map(apps.map((app) => [app.id, app]));

  useEffect(() => {
    if (editing === null) return;
    dialog.current?.showModal();
    searchBox.current?.focus();
  }, [editing]);

  function open(index: number) {
    setQuery("");
    setError("");
    setEditing(index);
  }

  function close() {
    dialog.current?.close();
  }

  async function save(next: (string | null)[], done: string) {
    setSaving(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/admin/hero", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ toolIds: next }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "Could not save the hero.");
      return false;
    }
    setSlots(next);
    setIsCurated(json.mode === "curated");
    setMessage(json.mode === "curated" ? done : "Reset — the hero fills itself automatically again.");
    router.refresh();
    return true;
  }

  async function place(index: number, toolId: string | null) {
    const app = toolId ? byId.get(toolId) : null;
    // Placing an app that's already in another slot moves it here.
    const next = slots.map((id, i) => (i === index ? toolId : id === toolId ? null : id));
    const done = app ? `${app.name} is now in slot ${index + 1}.` : `Slot ${index + 1} is empty again.`;
    if (await save(next, done)) close();
  }

  const term = query.trim().toLowerCase();
  const results = term
    ? apps.filter((app) => app.name.toLowerCase().includes(term) || app.tagline.toLowerCase().includes(term))
    : apps.slice(0, RECENT_COUNT);
  const current = editing !== null && slots[editing] ? byId.get(slots[editing]!) : null;

  // Slot map scaled from the animation's coordinates (x −560…560, y −140…140).
  const points = HERO_SLOTS.map((_, i) => heroSlotPoint(i));

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="card p-4 sm:p-6">
        <p className="eyebrow mb-3">Slot map · click a spot to add or change its app</p>
        <div className="relative mx-auto aspect-[1180/330] w-full max-w-3xl">
          <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 rotate-45 place-items-center rounded-md bg-[var(--ink)]">
            <span className="-rotate-45 font-display text-sm text-white">T</span>
          </span>
          {points.map((point, i) => {
            const app = slots[i] ? byId.get(slots[i]!) : null;
            return (
              <button
                key={i}
                type="button"
                onClick={() => open(i)}
                title={app ? `Slot ${i + 1}: ${app.name}` : `Slot ${i + 1}: add an app`}
                aria-label={`Slot ${i + 1}: ${app ? app.name : "empty, add an app"}`}
                className={`group absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl border-2 bg-[var(--surface)] text-xs font-bold transition hover:-translate-y-[calc(50%+2px)] hover:shadow-[0_0_0_3px_var(--accent)] ${
                  editing === i
                    ? "border-[var(--ink)] shadow-[0_0_0_3px_var(--accent)]"
                    : app
                      ? "border-[var(--line-strong)]"
                      : "border-dashed border-[var(--line-strong)] text-[var(--faint)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
                }`}
                style={{ left: `${50 + (point.x / 1180) * 100}%`, top: `${50 + (point.y / 330) * 100}%` }}
              >
                {app ? (
                  <ToolLogo src={app.logoUrl} name={app.name} size="sm" />
                ) : (
                  <>
                    <span className="group-hover:hidden">{i + 1}</span>
                    <span aria-hidden className="hidden text-base group-hover:inline">
                      +
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <aside className="card grid gap-4 p-5 lg:sticky lg:top-6">
        <div>
          <p className="font-bold">{isCurated ? "Curated hero" : "Automatic hero"}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {isCurated
              ? "Only the apps you chose are shown; empty spots invite makers with “Your app here”."
              : "Published apps fill the spots on their own (logos first). Add an app to any spot to take control."}
          </p>
        </div>
        <p className="text-sm text-[var(--ink-soft)]">
          <span className="font-bold">{slots.filter(Boolean).length}</span> of {HERO_SLOTS.length} spots filled
        </p>
        <button
          type="button"
          disabled={saving || (!isCurated && !slots.some(Boolean))}
          onClick={() => save(Array(HERO_SLOTS.length).fill(null), "")}
          className="btn btn-outline"
        >
          Reset to automatic
        </button>
        {editing === null && error ? (
          <p role="alert" className="text-sm font-bold text-[var(--danger)]">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="text-sm font-bold text-[var(--ok)]">
            {message}
          </p>
        ) : null}
        <a href={`${siteUrl}/`} target="_blank" rel="noopener" className="text-sm font-bold underline underline-offset-4">
          View the home page ↗
        </a>
      </aside>

      <dialog
        ref={dialog}
        onClose={() => setEditing(null)}
        onClick={(event) => event.target === dialog.current && close()}
        aria-labelledby="hero-slot-title"
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-0 text-[var(--ink)] shadow-[var(--shadow-lg)] backdrop:bg-black/40"
      >
        {editing !== null ? (
          <div className="flex max-h-[80vh] flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
              <div>
                <h2 id="hero-slot-title" className="text-xl">
                  Slot {editing + 1}
                </h2>
                <p className="text-xs text-[var(--muted)]">{RING_LABEL[HERO_SLOTS[editing].ring]}</p>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="btn btn-ghost btn-sm">
                ✕
              </button>
            </div>

            {current ? (
              <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--bg)] px-5 py-3">
                <ToolLogo src={current.logoUrl} name={current.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--faint)]">In this spot now</p>
                  <p className="truncate font-bold">{current.name}</p>
                </div>
                <button type="button" disabled={saving} onClick={() => place(editing, null)} className="btn btn-danger btn-sm">
                  Remove
                </button>
              </div>
            ) : null}

            <div className="px-5 pt-4">
              <input
                ref={searchBox}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search all published apps…"
                aria-label="Search apps"
                className="input h-11 w-full"
              />
              <p className="eyebrow mt-4">{term ? `${results.length} match${results.length === 1 ? "" : "es"}` : "Recently added"}</p>
            </div>

            <ul className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-2">
              {results.map((app) => {
                const at = slots.indexOf(app.id);
                const here = at === editing;
                return (
                  <li key={app.id}>
                    <button
                      type="button"
                      disabled={saving || here}
                      onClick={() => place(editing, app.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[var(--accent-soft)] disabled:opacity-60 disabled:hover:bg-transparent"
                    >
                      <ToolLogo src={app.logoUrl} name={app.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{app.name}</span>
                        <span className="block truncate text-xs text-[var(--muted)]">{app.tagline}</span>
                      </span>
                      {here ? (
                        <span className="text-xs font-bold text-[var(--ok)]">Here</span>
                      ) : at >= 0 ? (
                        <span className="whitespace-nowrap text-xs text-[var(--faint)]">Slot {at + 1} · move</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
              {!results.length ? <li className="px-2 py-6 text-center text-sm text-[var(--muted)]">No published app matches “{query}”.</li> : null}
            </ul>

            {error ? (
              <p role="alert" className="border-t border-[var(--line)] px-5 py-3 text-sm font-bold text-[var(--danger)]">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
