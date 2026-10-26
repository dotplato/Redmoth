"use client";

import { useState } from "react";
import { useRouterTransition } from "@/lib/use-router-transition";
import { Spinner } from "../Spinner";

async function mark(body: object) {
  await fetch("/api/admin/notifications", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Marks notifications read/unread; busy until the refreshed inbox has loaded. */
function useMark() {
  const router = useRouterTransition();
  const [saving, setSaving] = useState(false);
  const run = async (body: object) => {
    setSaving(true);
    await mark(body);
    setSaving(false);
    router.refresh();
  };
  return { busy: saving || router.pending, run };
}

export function MarkAllRead({ disabled }: { disabled: boolean }) {
  const { busy, run } = useMark();
  return (
    <button type="button" disabled={disabled || busy} onClick={() => run({ all: true })} className="btn btn-outline btn-sm">
      {busy ? <Spinner /> : null}
      Mark all read
    </button>
  );
}

export function ToggleRead({ id, read }: { id: string; read: boolean }) {
  const { busy, run } = useMark();
  return (
    <button type="button" disabled={busy} onClick={() => run({ ids: [id], read: !read })} className="btn btn-ghost btn-sm">
      {busy ? <Spinner /> : null}
      {read ? "Mark unread" : "Mark read"}
    </button>
  );
}
