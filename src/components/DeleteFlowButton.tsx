"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Author-only delete on a flow's page, with a confirm step. */
export function DeleteFlowButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete “${title}”? This can't be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/flows/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setBusy(false);
      window.alert("Could not delete this flow. Please try again.");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <button type="button" onClick={remove} disabled={busy} className="btn btn-ghost btn-lg text-[var(--danger)]">
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
