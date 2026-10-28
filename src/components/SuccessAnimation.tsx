"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { onCelebrate } from "@/lib/success";

// Trimmed to the 1.6s burst. Safari and every iOS browser (all WebKit) draw a WebM's transparent
// pixels as black, so WebKit gets the same animation as an animated WebP; reduced motion gets a still.
const VIDEO_SRC = "/animations/success.webm";
const WEBP_SRC = "/animations/success.webp";
const STILL_SRC = "/animations/success.png";
const VISIBLE_MS = 1900;
// Matches the overlay's duration-300 fade.
const FADE_MS = 300;

type Mode = "video" | "webp" | "still";

function pickMode(): Mode {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "still";
  const ua = navigator.userAgent;
  // WebKit without Blink: desktop Safari, and Safari/Chrome/Firefox on iOS ("CriOS"/"FxiOS" have no "Chrome/").
  const webkitOnly = /AppleWebKit/.test(ua) && !/Chrome\/|Chromium\/|Android/.test(ua);
  return webkitOnly ? "webp" : "video";
}

const subscribeNever = () => () => {};

// Fetched once per page; each play gets its own blob URL because an animated image only restarts under a new URL.
let webpBlob: Promise<Blob> | null = null;

/** The success check animation: plays once on mount and stays on the final tick. Sized by `className`. */
export function SuccessMark({ className = "" }: { className?: string }) {
  // Browser-only checks; null while server rendering, so the server and first client render match.
  const mode = useSyncExternalStore(subscribeNever, pickMode, () => null);
  const [webpUrl, setWebpUrl] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "webp") return;
    let url: string | null = null;
    let cancelled = false;
    webpBlob ??= fetch(WEBP_SRC).then((res) => res.blob());
    void webpBlob.then((blob) => {
      if (cancelled) return;
      url = URL.createObjectURL(blob);
      setWebpUrl(url);
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [mode]);

  return (
    <span aria-hidden className={`block ${className}`}>
      {mode === "video" ? (
        <video src={VIDEO_SRC} muted playsInline autoPlay preload="auto" className="size-full" />
      ) : mode === "still" || webpUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- blob URLs and an animated image; next/image would re-encode it.
        <img src={mode === "still" ? STILL_SRC : webpUrl!} alt="" className="size-full" />
      ) : null}
    </span>
  );
}

/** Plays the success animation over the page whenever `celebrate()` is called. Mounted once. */
export function SuccessAnimation() {
  const [play, setPlay] = useState<{ id: number; message: string } | null>(null);
  const [fading, setFading] = useState(false);

  useEffect(
    () =>
      onCelebrate((message) => {
        setFading(false);
        setPlay((prev) => ({ id: (prev?.id ?? 0) + 1, message }));
      }),
    [],
  );

  useEffect(() => {
    if (!play) return;
    const fade = window.setTimeout(() => setFading(true), VISIBLE_MS);
    const hide = window.setTimeout(() => setPlay(null), VISIBLE_MS + FADE_MS);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(hide);
    };
  }, [play]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-0 z-[70] grid place-items-center">
      <span className="sr-only">{play?.message}</span>
      {play ? (
        // Keyed by play, so each celebrate() mounts a fresh mark that starts from the beginning.
        <SuccessMark
          key={play.id}
          className={`size-48 transition-opacity duration-300 sm:size-56 ${fading ? "opacity-0" : "opacity-100"}`}
        />
      ) : null}
    </div>
  );
}
