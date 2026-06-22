import type { NextRequest } from "next/server";
import { z, type ZodType } from "zod";
import { HttpError } from "@/lib/http";

/**
 * Parse + validate a JSON request body against a zod schema. Throws HttpError(400)
 * (caught by safe()) with a readable message on malformed JSON or schema mismatch.
 * Use instead of hand-rolled `try { body = await req.json() }` + ad-hoc checks.
 */
export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError("Invalid JSON body", 400);
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path?.join(".");
    throw new HttpError(path ? `${path}: ${first.message}` : first?.message || "Invalid request body", 400);
  }
  return result.data;
}

/** Common reusable field schemas. */
export const zMoney = z.number().finite().nonnegative().max(1_000_000);
export const zShortText = z.string().trim().min(1).max(200);
export const zLongText = z.string().trim().max(5000);
export const zUuid = z.string().uuid();
