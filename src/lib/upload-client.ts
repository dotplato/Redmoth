import type { UploadFolder } from "./upload-limits";

// Browser side of direct-to-R2 uploads: ask our API for a presigned URL, PUT the file to it,
// and keep only the resulting public URL. Admin pages must use the admin endpoint (other
// /api routes are blocked on the admin host).

type Endpoint = "/api/uploads" | "/api/admin/uploads";

export class UploadFailed extends Error {
  constructor(public field: string, message: string) {
    super(message);
  }
}

/** Some browsers leave `type` empty for SVGs. */
function contentType(file: File) {
  if (file.type) return file.type;
  return file.name.toLowerCase().endsWith(".svg") ? "image/svg+xml" : "";
}

export async function uploadImage(file: File, folder: UploadFolder, endpoint: Endpoint = "/api/uploads") {
  const type = contentType(file);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ folder, contentType: type, size: file.size }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Could not upload the image.");

  const put = await fetch(json.uploadUrl, { method: "PUT", headers: { "content-type": type }, body: file });
  if (!put.ok) throw new Error("Could not upload the image.");
  return json.url as string;
}

/**
 * Uploads every picked file under each field and swaps it for its URL in the same FormData,
 * so the API receives strings only. Throws UploadFailed naming the field that failed.
 */
export async function uploadFormFiles(form: FormData, fields: Record<string, UploadFolder>, endpoint?: Endpoint) {
  for (const [field, folder] of Object.entries(fields)) {
    const files = form.getAll(field).filter((value): value is File => value instanceof File && value.size > 0);
    form.delete(field);
    try {
      const urls = await Promise.all(files.map((file) => uploadImage(file, folder, endpoint)));
      for (const url of urls) form.append(field, url);
    } catch (err) {
      throw new UploadFailed(field, err instanceof Error ? err.message : "Could not upload the image.");
    }
  }
}
