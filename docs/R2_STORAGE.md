# Image storage — Cloudflare R2

User-uploaded images (avatars, job photos, review photos, provider portfolio) are
stored in the Cloudflare **R2** bucket `pocketjobs` and served publicly from
`https://cdn.pocketjobs.co/uploads/...` (the same custom domain already used for
`web_assets/`).

Uploads are **direct-to-R2 via a short-lived presigned PUT URL** — the bytes never
pass through our API/Netlify functions.

## Flow

1. Client calls `POST /api/uploads` with `{ kind, mime, size }` → gets `{ key, uploadUrl, url }`.
2. Client `PUT`s the raw bytes to `uploadUrl` with header `Content-Type: <mime>`.
3. Client stores `url` (e.g. on `users.avatar_url`, `jobs.photos[]`, `reviews.photos[]`,
   or `provider_portfolio.url`).

`size` (the exact byte length) is validated server-side against `MAX_UPLOAD_BYTES` (6MB)
and **signed into the presigned URL as `Content-Length`** — the upload is rejected by R2 if
it doesn't send exactly that many bytes, so the cap can't be bypassed from the client.
Write endpoints (`/api/provider/portfolio`, `/api/account`, `/api/jobs`, `/api/reviews`)
additionally reject/strip any image URL that isn't under `R2_PUBLIC_BASE_URL/<prefix>`.

> Not yet implemented: per-user rate limiting on `POST /api/uploads`. Each call mints a
> fresh ~5-min upload URL; consider adding a rate limit (and an R2 lifecycle rule) if abuse
> becomes a concern.

Web: `app/lib/upload.ts` (`uploadFile`). Mobile: `src/lib/upload.ts` (`captureAndUpload`).
Server helpers: `lib/r2.ts`.

## Required environment variables

Set in `.env.local` (local) **and** in the Netlify site env (Production). These are
**server-only secrets** — never put `R2_SECRET_ACCESS_KEY` in the mobile app `.env`.

| Var | Value |
| --- | --- |
| `R2_ACCOUNT_ID` | `979516a8f3aae04f45bd52b2d3fc1962` |
| `R2_BUCKET` | `pocketjobs` |
| `R2_ACCESS_KEY_ID` | from the R2 API token (Account → R2 → Manage API Tokens) |
| `R2_SECRET_ACCESS_KEY` | from the same R2 API token |
| `R2_PUBLIC_BASE_URL` | `https://cdn.pocketjobs.co` |
| `R2_KEY_PREFIX` | `uploads` (optional, default `uploads`) |

> An R2 S3 API token is a **pair**: Access Key ID + Secret Access Key. Create one with
> **Object Read & Write** permission scoped to the `pocketjobs` bucket.

## Bucket CORS (required for direct uploads)

Browser/webview PUTs to R2 are cross-origin, so the bucket needs a CORS policy.
In the Cloudflare dashboard → R2 → `pocketjobs` → Settings → CORS Policy, add:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

`AllowedOrigins: ["*"]` is safe here because authorization is the presigned signature,
not cookies. To tighten it, replace `*` with the exact origins:
`https://pocketjobs.co`, `http://localhost:3000`, `http://localhost:5173`,
`capacitor://localhost`, `http://localhost`, `https://localhost`.

## Custom domain

`cdn.pocketjobs.co` must be connected to the `pocketjobs` bucket as a public custom
domain (R2 → bucket → Settings → Public access → Custom Domains). Public reads of
`/uploads/...` then need no CORS (they're plain `<img>` GETs).

## One-time migration from Postgres

Older images were stored as `bytea` in the `uploads` table and served by
`GET /api/uploads/:id` (now removed). Migrate them and drop the legacy table:

```bash
node --env-file=.env.local scripts/migrate-uploads-to-r2.mjs
```

The script copies each blob to R2, rewrites every reference
(`users.avatar_url`, `jobs.photos`, `reviews.photos`, `provider_portfolio.url`),
verifies nothing still points at `/api/uploads/`, then drops
`provider_portfolio.upload_id` and the `uploads` table. It aborts before dropping
if verification finds any leftover reference.
