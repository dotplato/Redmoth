"use client";

import { useState } from "react";
import { useRouterTransition } from "@/lib/use-router-transition";
import { Spinner } from "../Spinner";

/** Feature toggle + delete for one row of the admin Flows table. */
export function FlowAdminActions({ id, title, featured }: { id: string; title: string; featured: boolean }) {
  const router = useRouterTransition();
  const [action, setAction] = useState<"feature" | "delete" | null>(null);
  const [saving, setSaving] = useState(false);
  const [on, setOn] = useState(featured);
  // Busy until the request is done and the refreshed table has arrived; `action` picks the spinner.
  const busy = saving || router.pending;

  async function toggle() {
    const next = !on;
    setAction("feature");
    setOn(next); // optimistic; rolled back on failure
    setSaving(true);
    const res = await fetch(`/api/admin/flows/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ featured: next }),
    });
    setSaving(false);
    if (!res.ok) {
      setOn(!next);
      return;
    }
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`Delete “${title}”? The author can't undo this.`)) return;
    setAction("delete");
    setSaving(true);
    const res = await fetch(`/api/admin/flows/${id}`, { method: "DELETE" });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`Feature ${title}`}
        disabled={busy}
        onClick={toggle}
        className={`btn btn-sm ${on ? "btn-primary" : "btn-outline"}`}
      >
        {busy && action === "feature" ? <Spinner /> : null}
        {on ? "★ Featured" : "☆ Feature"}
      </button>
      <button type="button" disabled={busy} onClick={remove} className="btn btn-danger btn-sm">
        {busy && action === "delete" ? <Spinner /> : null}
        {busy && action === "delete" ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
