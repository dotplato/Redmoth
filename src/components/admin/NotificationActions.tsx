"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function mark(body: object) {
  await fetch("/api/admin/notifications", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function MarkAllRead({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={async () => {
        setBusy(true);
        await mark({ all: true });
        setBusy(false);
        router.refresh();
      }}
      className="btn btn-outline btn-sm"
    >
      Mark all read
    </button>
  );
}

export function ToggleRead({ id, read }: { id: string; read: boolean }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await mark({ ids: [id], read: !read });
        router.refresh();
      }}
      className="btn btn-ghost btn-sm"
    >
      {read ? "Mark unread" : "Mark read"}
    </button>
  );
}
