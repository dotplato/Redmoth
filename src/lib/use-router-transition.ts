"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * Router navigation/refresh wrapped in a transition, so `pending` stays true until the new server data
 * has actually arrived. Buttons that save and then refresh should treat "request running || pending"
 * as busy; otherwise they look finished while the page is still showing stale data.
 */
export function useRouterTransition() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return {
    pending,
    /** `update` runs inside the same transition, so local UI changes land together with the fresh data. */
    refresh: (update?: () => void) =>
      startTransition(() => {
        update?.();
        router.refresh();
      }),
    push: (href: string) => startTransition(() => router.push(href)),
    replace: (href: string) => startTransition(() => router.replace(href)),
  };
}
