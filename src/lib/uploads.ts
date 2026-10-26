import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { headObject, keyFromUrl, presignPut, publicUrl } from "./storage";
import { MAX_IMAGE_BYTES, UPLOAD_FOLDERS, type UploadFolder } from "./upload-limits";

const RASTER = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif" } as const;
const SVG = "image/svg+xml";
// Keys we hand out: <folder>/<timestamp>-<8 hex chars>.<ext>
const KEY_PATTERN = /^(logos|screenshots|avatars)\/\d+-[0-9a-f]{8}\.(png|jpg|webp|gif|svg)$/;

export class UploadError extends Error {}

type Options = { allowSvg?: boolean };

/**
 * Public (non-admin) uploads pass allowSvg=false: SVGs can carry script.
 * Returns the file extension for an accepted type.
 */
function extensionFor(contentType: string, { allowSvg = false }: Options) {
  const ext: string | undefined = RASTER[contentType as keyof typeof RASTER];
  if (ext) return ext;
  if (allowSvg && contentType === SVG) return ".svg";
  throw new UploadError("Use a PNG, JPG, WebP or GIF image");
}

function checkSize(size: number) {
  if (!(size > 0)) throw new UploadError("Empty file");
  if (size > MAX_IMAGE_BYTES) throw new UploadError("Images must be 5 MB or smaller");
}

/**
 * Route handler body for issuing a presigned upload. The caller must already have checked auth.
 * Expects JSON { folder, contentType, size } and returns { uploadUrl, url }.
 */
export async function presignResponse(request: Request, options: Options = {}) {
  const input = await request.json().catch(() => null);
  const folder = input?.folder as UploadFolder;
  if (!UPLOAD_FOLDERS.includes(folder)) return NextResponse.json({ error: "Unknown upload folder" }, { status: 400 });

  try {
    checkSize(Number(input?.size));
    const contentType = String(input?.contentType ?? "");
    const key = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}${extensionFor(contentType, options)}`;
    return NextResponse.json({ uploadUrl: await presignPut(key, contentType), url: publicUrl(key) });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }
}

/**
 * Confirms a URL the browser sent back points at a file it really uploaded to our bucket, in the
 * expected folder, within the size limit (a presigned PUT can't cap size, so we check afterwards).
 */
export async function verifyUpload(url: string, folder: UploadFolder, options: Options = {}) {
  const key = keyFromUrl(url);
  if (!key || !KEY_PATTERN.test(key) || !key.startsWith(`${folder}/`)) throw new UploadError("Upload the image again");

  const head = await headObject(key);
  if (!head) throw new UploadError("Upload the image again");
  checkSize(head.size);
  extensionFor(head.contentType, options);
  return url;
}

/** Verified upload URLs posted under `key` (the browser replaces picked files with their URLs). */
export async function uploadedImages(form: FormData, key: string, folder: UploadFolder, options: Options = {}) {
  const urls = form.getAll(key).filter((value): value is string => typeof value === "string" && value.length > 0);
  return Promise.all(urls.map((url) => verifyUpload(url, folder, options)));
}
