import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local");
}

/**
 * Neon serverless SQL client (HTTP). Use as a tagged template:
 *   const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
 * Values interpolated in the template are sent as parameters (safe from injection).
 */
export const sql = neon(process.env.DATABASE_URL);
