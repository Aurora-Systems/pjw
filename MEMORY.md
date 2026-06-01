# Pocket Jobs — Project Memory & Context

## What is Pocket Jobs?
Pocket Jobs is a **freelance job marketplace platform** that connects businesses with skilled freelancers. Think of it as an Upwork/Fiverr-style platform with the tagline "Find the right talent. Right in your pocket."

- **Website**: https://pocketjobs.co
- **Version**: 1.0 (initial build)

## Platform Components
| Component | Status | Owner |
|-----------|--------|-------|
| Marketing Website (Next.js) | In Progress | This Codebase |
| Mobile App | Separate Development | Handled by team independently |
| Backend API | Not Started | TBD |
| Database (Neon) | Not Started | PostgreSQL on Neon |

## Design Decisions

### Theme & Branding
- **Primary Color**: Blue (#2563EB) — chosen to convey trust and professionalism
- **Secondary Color**: White — clean, modern look
- **Font**: Inter — modern, highly readable
- **Logo**: Blue toolbox icon with wrench (matches SOW branding document)
- **Inspiration**: Upwork.com design patterns (layout, sections, navigation)

### Architecture Decisions
- **Next.js App Router** chosen for SEO benefits (SSR/SSG) on marketing pages
- **Tailwind CSS 4** for rapid, consistent styling
- **No dark mode** on marketing site (clean white brand identity)
- **Neon PostgreSQL** selected as database (serverless, auto-scaling)
- **Auth pages are UI-only** — backend auth will be added later (likely NextAuth.js)

## Feature Roadmap

### Phase 1 — Marketing Website (Current)
- [x] Landing page with hero, features, categories, testimonials, CTA
- [x] Navigation with auth buttons
- [x] Login & Signup page UI
- [x] Responsive design (mobile/tablet/desktop)
- [x] SEO meta tags
- [x] Official SOW categories (Home & Property, Moving & Delivery, Family & Personal Care, Education & Professional, Creative & Digital, Events & Entertainment, Automotive, Labour & Construction, Health, Wellness & Fitness)
- [x] Fully functional Company and Resources pages for all footer links (10 custom page routes)

### Phase 2 — Authentication & Database
- [ ] Set up Neon PostgreSQL database
- [ ] Design database schema (users, jobs, proposals, payments)
- [ ] Implement NextAuth.js or similar auth
- [ ] Connect Login/Signup forms to backend
- [ ] Email verification flow

### Phase 3 — Core Platform
- [ ] User dashboard (client & freelancer views)
- [ ] Job posting & management
- [ ] Freelancer profiles
- [ ] Proposal submission system
- [ ] Search & filtering
- [ ] Messaging system

### Phase 4 — Payments & Advanced Features
- [ ] Payment integration (Stripe or similar)
- [ ] Escrow system
- [ ] Reviews & ratings
- [ ] AI-powered job matching
- [ ] Analytics dashboard

## Key Contacts & Resources
- **SOW Document**: Pocket Jobs Scope of Work v1.0
- **Platform URL**: https://pocketjobs.co

## Handoff Notes for Other Agents
1. The marketing site is complete and production-ready.
2. The 9 categories on the home page match the exact Zimbabwean workforce categories from SOW Section 5.1.
3. Every footer link is fully wired to Next.js routes. The 10 specific pages exist in `app/company/` and `app/resources/` with clean copy and consistent layout structures.
4. Next step is Phase 2: setting up Neon DB and authentication.
5. When implementing auth, use the existing Login/Signup page components — just wire them to the backend.
6. The Navbar already has Log In / Sign Up buttons that link to /login and /signup.
7. The mobile app is a SEPARATE project — do not modify this codebase for mobile concerns.
8. All styling uses Tailwind CSS 4 — maintain consistency with the existing design tokens in globals.css.
9. The Button component (`app/components/Button.tsx`) supports variants: primary, secondary, outline, ghost.
