"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

/**
 * Below md, the header keeps only Discover and "Submit an app"; everything else lives in this menu.
 * Closes on Escape, on a click outside, and whenever the page changes. The main links preload in full
 * when the menu opens (like the desktop header's), so most taps land on an already-loaded page.
 */
export function MobileMenu({ signedIn, savedCount }: { signedIn: boolean; savedCount: number }) {
  const [openOn, setOpenOn] = useState<string | null>(null);
  const pathname = usePathname();
  // Open only on the page it was opened on, so any navigation closes it without an effect.
  const open = openOn === pathname;
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenOn(null);
      toggle.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpenOn(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const close = () => setOpenOn(null);
  const item = "flex h-12 items-center justify-between rounded-xl px-4 text-[15px] font-bold hover:bg-[var(--bg-deep)]";

  return (
    <div ref={root} className="md:hidden">
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpenOn(open ? null : pathname)}
        className="btn btn-ghost w-9 px-0"
      >
        <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          {open ? <path d="M4 4l10 10M14 4L4 14" /> : <path d="M3 5h12M3 9h12M3 13h12" />}
        </svg>
      </button>

      {open ? (
        <nav
          id={panelId}
          aria-label="Menu"
          className="absolute inset-x-0 top-full border-b border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]"
        >
          <div className="container-page grid gap-1 py-3">
            <Link href="/tools" prefetch onClick={close} className={item}>
              Tools
            </Link>
            <Link href="/flows" prefetch onClick={close} className={item}>
              Flows
            </Link>
            {signedIn ? (
              <>
                <Link href="/saved" prefetch onClick={close} className={item}>
                  Saved
                  {savedCount ? <span className="text-sm font-normal text-[var(--muted)]">{savedCount}</span> : null}
                </Link>
                <Link href="/account" onClick={close} className={item}>
                  Account
                </Link>
              </>
            ) : (
              <Link href="/login" onClick={close} className={item}>
                Creator login
              </Link>
            )}
            <Link href="/flows/new" onClick={close} className="btn btn-outline mt-2 h-12 w-full">
              <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M8 3v10M3 8h10" />
              </svg>
              Create Flow
            </Link>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
