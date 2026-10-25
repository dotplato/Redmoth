"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Feature toggle + delete for one row of the admin Flows table. */
export function FlowAdminActions({ id, title, featured }: { id: string; title: string; featured: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [on, setOn] = useState(featured);

  async function toggle() {
    setBusy(true);
    const res = await fetch(`/api/admin/flows/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ featured: !on }),
    });
    setBusy(false);
    if (res.ok) {
      setOn(!on);
      router.refresh();
    }
  }

  async function remove() {
    if (!window.confirm(`Delete “${title}”? The author can't undo this.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/flows/${id}`, { method: "DELETE" });
    setBusy(false);
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
        {on ? "★ Featured" : "☆ Feature"}
      </button>
      <button type="button" disabled={busy} onClick={remove} className="btn btn-danger btn-sm">
        Delete
      </button>
    </div>
  );
}
