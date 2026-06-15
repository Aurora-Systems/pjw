import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

/**
 * Cloudflare R2 (S3-compatible) object storage for user-uploaded images.
 *
 * - Bytes are uploaded straight from the client via a short-lived presigned PUT
 *   URL (the API never proxies the image), and served publicly from
 *   R2_PUBLIC_BASE_URL (the custom domain bound to the bucket, e.g.
 *   https://cdn.pocketjobs.co) under the R2_KEY_PREFIX (default "uploads").
 * - S3 endpoint: https://<account>.r2.cloudflarestorage.com
 *
 * Required env (web .env.local + Netlify, never the mobile bundle):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET,
 *   R2_PUBLIC_BASE_URL  (optional: R2_KEY_PREFIX, default "uploads")
 */

const PREFIX = (process.env.R2_KEY_PREFIX || "uploads").replace(/^\/+|\/+$/g, "");

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024; // 6MB

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_BASE_URL
  );
}

function bucket(): string {
  const b = process.env.R2_BUCKET;
  if (!b) throw new Error("R2 is not configured (R2_BUCKET missing).");
  return b;
}

function publicBase(): string {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) throw new Error("R2 is not configured (R2_PUBLIC_BASE_URL missing).");
  return base.replace(/\/+$/, "");
}

let _client: S3Client | null = null;
function client(): S3Client {
  if (_client) return _client;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 is not configured (account id / access keys missing).");
  }
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

/** A random, collision-proof object key for a new upload (e.g. uploads/avatar/ab12….jpg). */
export function newKey(kind: string, mime: string): string {
  const safeKind = (kind || "other").replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "other";
  const ext = EXT[mime] || "bin";
  return `${PREFIX}/${safeKind}/${crypto.randomUUID()}.${ext}`;
}

/** Absolute public URL for an object key, served from the bucket's custom domain. */
export function publicUrl(key: string): string {
  return `${publicBase()}/${key.replace(/^\/+/, "")}`;
}

/** Reverse of publicUrl: extract the object key from one of our public URLs (else null). */
export function keyFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const base = publicBase();
  if (!url.startsWith(base + "/")) return null;
  return url.slice(base.length + 1);
}

/**
 * A short-lived presigned PUT URL the client uses to upload bytes directly to R2.
 * `contentLength` is signed into the request, so the actual upload must send exactly
 * that many bytes — this caps the object size server-side (the caller validates the
 * size against MAX_UPLOAD_BYTES before signing).
 */
export function presignPut(
  key: string,
  contentType: string,
  contentLength: number,
  expiresInSeconds = 300
): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  return getSignedUrl(client(), cmd, { expiresIn: expiresInSeconds });
}

/** True if `url` is one of our public R2 upload URLs (under the public base + key prefix). */
export function isOurUploadUrl(url: string | null | undefined): boolean {
  const key = keyFromPublicUrl(url);
  return key != null && (key === PREFIX || key.startsWith(`${PREFIX}/`));
}

/** Server-side upload (used by the one-time migration from Postgres bytea). */
export async function putObject(key: string, body: Buffer | Uint8Array, contentType: string): Promise<void> {
  await client().send(
    new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType })
  );
}

/** Best-effort delete of an object (e.g. when a portfolio item is removed). */
export async function deleteObject(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}
