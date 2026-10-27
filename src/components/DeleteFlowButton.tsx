"use client";

import { useState } from "react";
import { useRouterTransition } from "@/lib/use-router-transition";
import { Spinner } from "./Spinner";

/** Author-only delete on a flow's page, with a confirm step. */
export function DeleteFlowButton({ id, title }: { id: string; title: string }) {
  const router = useRouterTransition();
  const [deleting, setDeleting] = useState(false);
  // Stays busy until the account page has loaded.
  const busy = deleting || router.pending;

  async function remove() {
    if (!window.confirm(`Delete “${title}”? This can't be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/flows/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      window.alert("Could not delete this flow. Please try again.");
      return;
    }
    router.push("/account");
    // Drops pages preloaded before the delete (flow lists, home, saved), so the flow is gone from them too.
    router.refresh();
  }

  return (
    <button type="button" onClick={remove} disabled={busy} className="btn btn-ghost btn-lg text-[var(--danger)]">
      {busy ? <Spinner /> : null}
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
