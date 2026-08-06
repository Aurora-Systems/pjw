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

/** Document MIME types a chat attachment may use, on top of the image types. */
export const CHAT_DOC_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];

/** `accept` attribute for the chat attachment file picker. */
export const CHAT_ACCEPT = ["image/*", ".pdf", ".doc", ".docx", ".txt"].join(",");

/** Extension → MIME, for browsers that hand us an empty `file.type`. */
const EXT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  txt: "text/plain",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * Upload a chat attachment (image or document) to R2 under the "chat" kind, which is the
 * only upload kind the API accepts documents for. Returns what the message row needs.
 */
export async function uploadChatFile(
  file: File
): Promise<{ url: string; type: string; name: string }> {
  if (file.size > MAX_BYTES) throw new Error("File too large (max 6MB)");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = file.type || EXT_MIME[ext] || "";
  if (!mime) throw new Error("Unsupported file type");
  const { uploadUrl, url } = await api.signUpload({ kind: "chat", mime, size: file.size });
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mime },
    body: file,
  });
  if (!res.ok) throw new Error("Upload failed");
  return { url, type: mime, name: file.name };
}
