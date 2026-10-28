import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { exportToolsCsv, importToolsCsv } from "@/lib/tool-csv";

// Generous for a CSV of tools (long descriptions included), small enough to read into memory.
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

/** Every tool as a CSV download. */
export async function GET(request: Request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const csv = await exportToolsCsv();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="redmoth-tools-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}

/** Creates/updates tools from a CSV in the export's format (the request body is the file's text). */
export async function POST(request: Request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_IMPORT_BYTES) {
    return NextResponse.json({ ok: false, errors: ["The file is over 5 MB. Split it into smaller files."] }, { status: 413 });
  }
  const text = await request.text();
  if (text.length > MAX_IMPORT_BYTES) {
    return NextResponse.json({ ok: false, errors: ["The file is over 5 MB. Split it into smaller files."] }, { status: 413 });
  }

  const result = await importToolsCsv(text);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
