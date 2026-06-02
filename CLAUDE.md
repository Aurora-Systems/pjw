# Pocket Jobs Web — Project Guide

## Overview
Pocket Jobs is a freelance job marketplace platform (similar to Upwork). This is the **web application** built with Next.js. There is a separate mobile app (handled independently).

Platform Website: https://pocketjobs.co

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 (via @tailwindcss/postcss)
- **Database**: Neon (PostgreSQL) — not yet integrated
- **Package Manager**: pnpm
- **Deployment**: TBD (likely Vercel)

## Project Structure
```
pocket_jobs_web/
├── app/
│   ├── components/       # Shared UI components (Navbar, Footer, Button)
│   ├── company/          # Company detail pages (about, contact, careers, etc.)
│   ├── resources/        # Resource detail pages (support, blog, reviews, etc.)
│   ├── login/            # Login page (UI only)
│   ├── signup/           # Sign up page (UI only)
│   ├── globals.css       # Global styles & design tokens
│   ├── layout.tsx        # Root layout with metadata
│   └── page.tsx          # Marketing home page
├── public/
│   ├── logo.svg          # Pocket Jobs logo
│   └── icons/            # SVG icons
├── CLAUDE.md             # This file
├── MEMORY.md             # Project context & handoff notes
└── package.json
```

## Development Commands
```bash
pnpm install        # Install dependencies
pnpm dev            # Start dev server (http://localhost:3000)
pnpm build          # Production build
pnpm start          # Start production server
pnpm lint           # Run ESLint
```

## Design System
- **Theme**: Blue (#2563EB) and White (#FFFFFF)
- **Font**: Inter (from Google Fonts via next/font)
- **Colors**:
  - Primary: blue-600 (#2563EB)
  - Primary Dark: blue-700 (#1D4ED8)
  - Primary Light: blue-500 (#3B82F6)
  - Accent: sky-500 (#0EA5E9)
  - Background: white, slate-50 (#F8FAFC), blue-50 (#EFF6FF)
  - Text: slate-900 (#0F172A), slate-500 (#475569)

## Coding Conventions
- Use TypeScript for all files
- Use Next.js App Router conventions (page.tsx, layout.tsx)
- Components go in `app/components/`
- Use Tailwind CSS utility classes for styling
- Keep components focused and reusable
- Use `'use client'` directive only when needed (interactivity, hooks)

## Current Status
- ✅ Marketing landing page (home page)
- ✅ Official SOW Zimbabwe labor marketplace categories
- ✅ Login page (UI only)
- ✅ Sign up page (UI only)
- ✅ Navbar with mobile menu
- ✅ Footer with active Next.js links
- ✅ 10 custom Company & Resources detail pages
- ✅ **Backend API routes** under `app/api/` — consumed by the mobile app (Ionic). Auth (JWT via `jose`
  + bcrypt), categories, providers, jobs/bids, bookings, reviews, notifications. Shared libs in `lib/`
  (`db.ts` Neon client, `auth.ts`, `http.ts` CORS). Env in `.env.local` (`DATABASE_URL`, `JWT_SECRET`).
- ✅ **Neon database integration** — Postgres `pocket_jobs` (project `bitter-cloud-47367937`), schema +
  seed data live. Tables: users, provider_profiles, provider_services, categories, jobs, bids, bookings,
  reviews, conversations, messages, notifications.
- ✅ **Auth = Neon Auth passwordless email OTP** (Better Auth, provisioned on this Neon project; schema
  `neon_auth` in the `neondb` DB). Our API proxies it (`lib/neonauth.ts`) and, on verify, maps the Neon Auth
  user to a local `users` row and issues our own app JWT (`lib/auth.ts`). Local `users.auth_id` links the two.
- ✅ **Functional web app** (consumes the API; auth via Neon Auth email OTP). Login/Signup are wired to OTP
  (+ role & individual/company choice, with a dev-login shortcut). Authenticated area lives under the `app/(app)/`
  route group with a client `AuthProvider` + role-aware shell + guard. Client API layer: `app/lib/{api,types,auth-context}.ts`;
  shared UI in `app/components/ui.tsx`.
  - **Customer**: `/dashboard`, `/browse`, `/providers/[id]` (book), `/post-job`, `/jobs`, `/jobs/[id]` (accept bid), `/bookings` (track + review).
  - **Provider**: `/dashboard`, `/work` (bid), `/my-bids`, `/earnings`.
  - **Corporate/Individual**: `/dashboard`, `/hiring` (+ company KYC modal), `/hiring/new`.
  - **Admin**: `/dashboard`, `/admin` (verification queue + disputes).
  - Marketing Navbar shows "Go to dashboard" when a token is present.

## API routes (for the mobile app)
All under `app/api/`, `runtime = "nodejs"`, CORS-enabled. Bearer-token (app JWT) auth where noted.
- **auth**: `POST auth/otp/request`, `POST auth/otp/verify`, `POST auth/dev-login` (gated by `ALLOW_DEV_LOGIN`), `GET auth/me`
- `GET categories`; `GET providers` (filters: category, q, verified, maxRate, sort), `GET providers/:id`
- `GET/POST jobs`, `GET jobs/:id`, `POST jobs/:id/bids` (provider), `POST bids/:id/accept` (customer)
- `GET/POST bookings`, `PATCH bookings/:id`; `POST reviews`; `GET notifications`, `POST notifications/read`
- **provider**: `GET provider/{dashboard,jobs,bids,earnings,profile,reviews}`, `PATCH provider/profile`, `POST provider/boost`
- **corporate**: `GET corporate/dashboard`, `GET/PATCH corporate/profile`, `GET/POST workforce`
- **admin**: `GET admin/metrics`, `GET/PATCH admin/verifications`, `GET/PATCH admin/disputes`
- **chat**: `GET/POST conversations`, `GET/POST conversations/:id/messages`

Env (`.env.local`): `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_ORIGIN`, `JWT_SECRET`, `ALLOW_DEV_LOGIN`, `CORS_ALLOW_ORIGIN`.
New tables vs. earlier: `workforce_requests`, `disputes`, and `users.auth_id`/`company_*`/`verification_status` columns.

## Important Notes
- The **mobile** app lives at `/Users/macbook/work/aurora/pocket-jobs` (Ionic React). It is the primary
  consumer of these API routes. Keep the two repos' CLAUDE.md/MEMORY.md cross-references consistent.
- Web marketing auth pages are still **UI-only placeholders** (not yet wired to the API above).
- No dark mode — the marketing site uses a clean white/blue theme.
