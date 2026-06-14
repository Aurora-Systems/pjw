"use client";

import { api } from "./api";

/** Read a File as base64 (no data: prefix) and upload it to the API. */
export async function uploadFile(file: File, kind: string): Promise<{ id: string; url: string }> {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
  return api.uploadImage({ kind, mime: file.type || "image/jpeg", data });
}
