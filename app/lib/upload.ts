"use client";

import { api } from "./api";

const MAX_BYTES = 6 * 1024 * 1024; // 6MB — keep in sync with lib/r2.ts

/**
 * Upload an image directly to Cloudflare R2 via a short-lived presigned URL, then
 * return its public URL (served from cdn.pocketjobs.co). The bytes never pass
 * through our API.
 */
export async function uploadFile(file: File, kind: string): Promise<{ url: string }> {
  if (file.size > MAX_BYTES) throw new Error("Image too large (max 6MB)");
  const mime = file.type || "image/jpeg";
  const { uploadUrl, url } = await api.signUpload({ kind, mime, size: file.size });
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mime },
    body: file,
  });
  if (!res.ok) throw new Error("Upload failed");
  return { url };
}
