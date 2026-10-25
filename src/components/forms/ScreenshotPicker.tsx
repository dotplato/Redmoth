"use client";

import { useRef, useState } from "react";
import { MAX_IMAGE_BYTES, MAX_SCREENSHOTS, RASTER_TYPES } from "@/lib/upload-limits";

export type PickedShot = { id: string; file: File; src: string };

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

/**
 * Screenshot list that grows with each pick (a plain file input replaces its selection every time).
 * Accepts clicks and drag-and-drop, previews each image, and stops at MAX_SCREENSHOTS.
 */
export function ScreenshotPicker({
  shots,
  onChange,
  max = MAX_SCREENSHOTS,
  allowSvg = false,
  compact = false,
  id = "f-screenshots",
}: {
  shots: PickedShot[];
  onChange: (shots: PickedShot[]) => void;
  /** How many may be picked here (e.g. fewer when a tool already has screenshots saved). */
  max?: number;
  /** Admin-only: SVGs can carry script, so public forms never accept them. */
  allowSvg?: boolean;
  /** Two-column layout for narrow side panels. */
  compact?: boolean;
  id?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const full = shots.length >= max;
  const types: readonly string[] = allowSvg ? [...RASTER_TYPES, "image/svg+xml"] : RASTER_TYPES;
  const typeLabel = allowSvg ? "PNG, JPG, WebP, GIF, SVG" : "PNG, JPG, WebP, GIF";

  async function add(files: FileList | File[]) {
    const incoming = Array.from(files);
    const valid = incoming.filter(
      (file) => types.includes(file.type) && file.size <= MAX_IMAGE_BYTES,
    );
    const room = max - shots.length;
    const accepted = valid.slice(0, Math.max(room, 0));
    const problems = [
      valid.length < incoming.length ? `some files weren’t ${typeLabel} under 5 MB` : "",
      valid.length > accepted.length ? `the limit is ${max} screenshot${max === 1 ? "" : "s"}` : "",
    ].filter(Boolean);
    setNotice(problems.length ? `Skipped: ${problems.join("; ")}.` : "");
    if (!accepted.length) return;
    const added = await Promise.all(
      accepted.map(async (file) => ({ id: `${file.name}-${file.size}-${Math.random()}`, file, src: await readAsDataUrl(file) })),
    );
    onChange([...shots, ...added]);
  }

  return (
    <div className="grid gap-3">
      <input
        ref={inputRef}
        id={id}
        type="file"
        multiple
        accept={types.join(",")}
        className="sr-only"
        onChange={(event) => {
          if (event.target.files) void add(event.target.files);
          event.target.value = ""; // allow picking the same file again after removing it
        }}
      />

      <div className={`grid grid-cols-2 gap-2.5 ${compact ? "" : "sm:grid-cols-3"}`}>
        {shots.map((shot, index) => (
          <div key={shot.id} className="group relative overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-deep)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot.src} alt={`Screenshot ${index + 1}`} className="aspect-[16/10] w-full object-cover" />
            <span className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-1.5 text-[10px] font-bold">{index + 1}</span>
            <button
              type="button"
              onClick={() => {
                setNotice("");
                onChange(shots.filter((item) => item.id !== shot.id));
              }}
              aria-label={`Remove screenshot ${index + 1}`}
              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-sm text-[var(--danger)] shadow transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}

        {full ? null : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void add(event.dataTransfer.files);
            }}
            className={`grid aspect-[16/10] w-full place-items-center rounded-xl border-2 border-dashed text-center transition ${
              dragging
                ? "border-[var(--ink)] bg-[var(--accent-soft)]"
                : "border-[var(--line-strong)] bg-[var(--surface)] hover:border-[var(--ink)]"
            } ${shots.length ? "" : `col-span-2 aspect-auto py-8 ${compact ? "" : "sm:col-span-3"}`}`}
          >
            <span>
              <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-[var(--accent)] text-lg font-bold">+</span>
              <span className="mt-2 block text-sm font-bold">{shots.length ? "Add more" : "Add screenshots"}</span>
              <span className="block px-2 text-xs text-[var(--faint)]">Click or drop images · {typeLabel} · 5 MB each</span>
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={full ? "font-bold text-[var(--ink)]" : "text-[var(--muted)]"}>
          {shots.length}/{max} screenshots{full ? " · limit reached" : ""}
        </span>
        {notice ? (
          <span role="status" className="text-[var(--warn)]">
            {notice}
          </span>
        ) : null}
      </div>
    </div>
  );
}
