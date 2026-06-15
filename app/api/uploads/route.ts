import type { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";
import {
  isR2Configured,
  newKey,
  presignPut,
  publicUrl,
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/lib/r2";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/uploads — mint a short-lived presigned URL for a direct-to-R2 upload.
 * Body: { kind?, mime, size } where `size` is the exact byte length of the image.
 * Returns { key, uploadUrl, url } — the client PUTs exactly `size` bytes to `uploadUrl`
 * with header `Content-Type: <mime>`, then stores `url` (the public cdn.pocketjobs.co URL).
 *
 * `size` is validated here and signed into the URL (as Content-Length), so the upload
 * cannot exceed MAX_UPLOAD_BYTES even if the client check is bypassed.
 */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (!isR2Configured()) return error("Image storage is not configured", 503);

  let body: { kind?: string; mime?: string; size?: number };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  const mime = body.mime;
  if (!mime) return error("mime is required");
  if (!ALLOWED_IMAGE_TYPES.includes(mime)) return error("Unsupported image type");

  const size = body.size;
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return error("size (byte length) is required");
  }
  if (size > MAX_UPLOAD_BYTES) return error("Image too large (max 6MB)", 413);

  const key = newKey(body.kind ?? "other", mime);
  const uploadUrl = await presignPut(key, mime, size);
  return json({ key, uploadUrl, url: publicUrl(key) }, { status: 201 });
}
