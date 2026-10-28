"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouterTransition } from "@/lib/use-router-transition";
import type { ToolImportResult } from "@/lib/tool-csv";
import { Spinner } from "../Spinner";

const CSV_URL = "/api/admin/tools/csv";

/** Export every tool as CSV, or import a CSV in the same format (matched by slug). */
export function ToolCsvActions() {
  const router = useRouterTransition();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ToolImportResult | null>(null);
  // Busy until the import is done and the refreshed list is on screen.
  const busy = uploading || router.pending;

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Let the same file be picked again after fixing it.
    event.target.value = "";
    if (!file) return;
    const ok = window.confirm(
      `Import “${file.name}”?\n\nRows whose slug matches an existing tool update that tool; new slugs create new tools. Nothing is deleted. If any row has a problem, nothing is imported.`,
    );
    if (!ok) return;

    setUploading(true);
    setResult(null);
    try {
      const res = await fetch(CSV_URL, { method: "POST", headers: { "content-type": "text/csv" }, body: await file.text() });
      const json = (await res.json().catch(() => null)) as ToolImportResult | null;
      setResult(json ?? { ok: false, errors: ["Something went wrong. Please try again."] });
      if (json?.ok) router.refresh();
    } catch {
      setResult({ ok: false, errors: ["Could not reach the server. Check your connection and try again."] });
    } finally {
      setUploading(false);
    }
  }

  return (
    // The result panel hangs under the buttons so it doesn't push the header's other actions around.
    <div className="relative flex flex-wrap items-center gap-2">
      <a href={CSV_URL} download className="btn btn-outline">
        Export CSV
      </a>
      <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn btn-outline">
        {busy ? <Spinner /> : null}
        {busy ? "Importing…" : "Import CSV"}
      </button>
      <input ref={input} type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" aria-label="CSV file to import" />

      {result ? (
        <div
          role={result.ok ? "status" : "alert"}
          className="card absolute right-0 top-full z-20 mt-2 flex w-[min(36rem,calc(100vw-2rem))] items-start gap-3 p-4 text-sm shadow-[var(--shadow-lg)]"
        >
          <div className="max-h-64 min-w-0 flex-1 overflow-y-auto">
            {result.ok ? (
              <p className="font-bold">
                Imported: {result.created} created, {result.updated} updated, {result.unchanged} unchanged.
              </p>
            ) : (
              <>
                <p className="font-bold text-[var(--danger)]">Nothing was imported. Fix these and try again:</p>
                <ul className="mt-2 grid list-disc gap-1 pl-5 text-[var(--ink-soft)]">
                  {result.errors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <button type="button" onClick={() => setResult(null)} aria-label="Dismiss" className="btn btn-ghost btn-sm w-8 shrink-0 px-0">
            <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}
