"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// Remembers which app a signed-out visitor tried to save, so it's saved right after they log in.
const PENDING_KEY = "redmoth:pending-save";

export type SaveKind = "tool" | "flow";

type SavedContext = {
  signedIn: boolean;
  isSaved: (id: string) => boolean;
  toggle: (id: string, kind?: SaveKind) => void;
  count: number;
};

const Context = createContext<SavedContext | null>(null);

async function persist(id: string, kind: SaveKind, save: boolean) {
  const res = await fetch("/api/saved", {
    method: save ? "POST" : "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(kind === "flow" ? { flowId: id } : { toolId: id }),
  });
  return res.ok;
}

/** Holds the signed-in creator's saved app and flow ids (cuids never collide) for every save button on the page. */
export function SavedProvider({ signedIn, initial, children }: { signedIn: boolean; initial: string[]; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [saved, setSaved] = useState(() => new Set(initial));

  // Finish a save that was interrupted by the login redirect.
  useEffect(() => {
    if (!signedIn) return;
    let pending: { id: string; kind: SaveKind } | null = null;
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      sessionStorage.removeItem(PENDING_KEY);
      // Older entries were a bare app id.
      if (raw) pending = raw.startsWith("{") ? JSON.parse(raw) : { id: raw, kind: "tool" };
    } catch {}
    if (!pending) return;
    const { id, kind } = pending;
    void persist(id, kind, true).then((ok) => {
      if (!ok) return;
      setSaved((prev) => new Set(prev).add(id));
      router.refresh();
    });
  }, [signedIn, router]);

  const toggle = useCallback(
    (toolId: string, kind: SaveKind = "tool") => {
      if (!signedIn) {
        try {
          sessionStorage.setItem(PENDING_KEY, JSON.stringify({ id: toolId, kind }));
        } catch {}
        const back = `${pathname}${window.location.search}`;
        router.push(`/login?next=${encodeURIComponent(back)}`);
        return;
      }
      const next = !saved.has(toolId);
      // Optimistic: flip now, roll back if the request fails.
      setSaved((prev) => {
        const copy = new Set(prev);
        if (next) copy.add(toolId);
        else copy.delete(toolId);
        return copy;
      });
      void persist(toolId, kind, next).then((ok) => {
        if (!ok) {
          setSaved((prev) => {
            const copy = new Set(prev);
            if (next) copy.delete(toolId);
            else copy.add(toolId);
            return copy;
          });
          return;
        }
        router.refresh(); // keeps the header count and /saved list in sync
      });
    },
    [signedIn, saved, pathname, router],
  );

  const value = useMemo(
    () => ({ signedIn, isSaved: (id: string) => saved.has(id), toggle, count: saved.size }),
    [signedIn, saved, toggle],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSaved() {
  const value = useContext(Context);
  if (!value) throw new Error("useSaved must be used inside <SavedProvider>");
  return value;
}
