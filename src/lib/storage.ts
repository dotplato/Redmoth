import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 through its S3-compatible API. Browsers upload straight to the bucket with a
// short-lived presigned PUT (Vercel caps request bodies at 4.5 MB), then send us only the public URL.

const PRESIGN_TTL_SECONDS = 5 * 60;

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

let client: S3Client | undefined;

function r2() {
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env("R2_ACCESS_KEY_ID"), secretAccessKey: env("R2_SECRET_ACCESS_KEY") },
  });
  return client;
}

function publicBase() {
  return env("R2_PUBLIC_URL").replace(/\/+$/, "");
}

export function publicUrl(key: string) {
  return `${publicBase()}/${key}`;
}

/** The object key behind one of our public URLs, or null for anything else (pasted URLs, legacy paths). */
export function keyFromUrl(url: string) {
  const prefix = `${publicBase()}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

export async function presignPut(key: string, contentType: string) {
  const command = new PutObjectCommand({ Bucket: env("R2_BUCKET"), Key: key, ContentType: contentType });
  return getSignedUrl(r2(), command, { expiresIn: PRESIGN_TTL_SECONDS });
}

/** Size and type of an uploaded object, or null when it doesn't exist. */
export async function headObject(key: string) {
  try {
    const head = await r2().send(new HeadObjectCommand({ Bucket: env("R2_BUCKET"), Key: key }));
    return { size: head.ContentLength ?? 0, contentType: head.ContentType ?? "" };
  } catch {
    return null;
  }
}

export async function putObject(key: string, body: string | Uint8Array, contentType: string) {
  await r2().send(new PutObjectCommand({ Bucket: env("R2_BUCKET"), Key: key, Body: body, ContentType: contentType }));
  return publicUrl(key);
}

/** Best-effort delete of a file we stored; URLs outside the bucket are left alone. */
export async function deleteByUrl(url: string | null | undefined) {
  const key = url ? keyFromUrl(url) : null;
  if (!key) return;
  await r2()
    .send(new DeleteObjectCommand({ Bucket: env("R2_BUCKET"), Key: key }))
    .catch((err) => console.error("[storage] delete failed", key, err));
}
