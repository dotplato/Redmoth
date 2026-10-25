import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { MAX_IMAGE_BYTES } from "./upload-limits";

const RASTER = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif" } as const;

export class UploadError extends Error {}

/**
 * Saves an uploaded image under public/uploads/<folder> and returns its public URL.
 * Public (non-admin) uploads pass allowSvg=false: SVGs can carry script and are served from our origin.
 */
export async function saveImage(file: File, folder: "logos" | "screenshots" | "avatars", { allowSvg = false } = {}) {
  if (file.size === 0) throw new UploadError("Empty file");
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError("Images must be 5 MB or smaller");

  let ext: string | undefined = RASTER[file.type as keyof typeof RASTER];
  if (!ext && allowSvg && (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg"))) ext = ".svg";
  if (!ext) throw new UploadError("Use a PNG, JPG, WebP or GIF image");

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${folder}/${filename}`;
}

export function imageFiles(form: FormData, key: string) {
  return form.getAll(key).filter((value): value is File => value instanceof File && value.size > 0);
}
