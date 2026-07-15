// Canonical service-category list — the single source of truth.
//
// Running this (a) ensures the categories.sector column exists, (b) upserts every category into
// the live DB, and (c) regenerates scripts/seed.sql so the DB and the file can never drift.
// Array order defines sort_order (1-based).
//
// The SLUG is the stable key: jobs.category and provider_profiles.primary_category store it, so a
// slug that is already in use must never be renamed or removed — only its display `name`, `icon`,
// `sector` or `sort_order` may change (hence ON CONFLICT (slug) DO UPDATE). Several of the client's
// finer-grained services are FOLDED into an existing category rather than given a near-duplicate
// slug (which would split the provider pool):
//   Babysitting            -> childcare  (name broadened to "Babysitting & Childcare")
//   Elderly companionship  -> home-care
//   Photography for events -> photography      Videography for events -> videography
//   Security (events)      -> security         Garden labour          -> gardening
//   Battery jumpstart      -> roadside         Construction assistants-> construction
//   Mechanical repairs     -> mechanic         Car washing (mobile)   -> car-wash
//   Security installation  -> cctv
//
// Run: node --env-file=.env.local scripts/seed-categories.mjs
import { neon } from "@neondatabase/serverless";
import { writeFileSync } from "node:fs";

const sql = neon(process.env.DATABASE_URL);

// [slug, name, icon (Ionicons)] grouped under a sector. Array order == sort_order.
const SECTORS = [
  ["Home & Property", [
    ["cleaning", "Cleaning", "sparkles"],
    ["laundry", "Laundry & Ironing", "shirt"],
    ["gardening", "Gardening", "leaf"],
    ["landscaping", "Landscaping & Paving", "flower"],
    ["plumbing", "Plumbing", "water"],
    ["electrical", "Electrical", "flash"],
    ["appliance", "Appliance Repair", "hardware-chip"],
    ["painting", "Painting & Renovations", "color-fill"],
    ["carpentry", "Carpentry & Furniture Repair", "construct"],
    ["tiling", "Tiling & Flooring", "grid"],
    ["ceiling", "Ceiling & Drywall", "layers"],
    ["roofing", "Roofing", "home"],
    ["masonry", "Bricklaying & Masonry", "business"],
    ["welding", "Welding & Metalwork", "flame"],
    ["glazing", "Glass & Window Fitting", "square"],
    ["fencing", "Fencing & Gates", "lock-closed"],
    ["handyman", "General Handyman", "hammer"],
    ["repairs", "Repairs & Maintenance", "build"],
    ["pest-control", "Pest Control", "bug"],
    ["hvac", "Refrigeration & Air-Con", "snow"],
    ["generator", "Generator Repair", "battery-charging"],
    ["borehole", "Borehole & Water Pumps", "water"],
    ["solar", "Solar Installation & Maintenance", "sunny"],
    ["waste-removal", "Waste Removal", "trash"],
  ]],
  ["Moving, Delivery & Errands", [
    ["moving", "Moving & Relocation", "cube"],
    ["furniture-delivery", "Furniture Delivery & Hauling", "cart"],
    ["driving", "Driving & Delivery", "bus"],
    ["loading", "Loaders & Offloaders", "barbell"],
    ["grocery", "Grocery Shopping & Delivery", "basket"],
    ["errands", "Personal Errands", "walk"],
  ]],
  ["Home & Family Care", [
    ["home-organization", "Home Organization", "file-tray-stacked"],
    ["childcare", "Babysitting & Childcare", "people"],
    ["home-care", "Elderly Care & Companionship", "heart"],
    ["pet-care", "Pet Sitting & Dog Walking", "paw"],
    ["pet-grooming", "Pet Grooming", "cut"],
  ]],
  ["Education & Professional", [
    ["tutoring", "Tutoring", "school"],
    ["language-lessons", "Language Lessons", "language"],
    ["tech-installation", "Tech Installation", "tv"],
    ["cv-writing", "CV Writing", "document-text"],
    ["career-coaching", "Career Coaching", "briefcase"],
    ["accounting", "Accounting & Bookkeeping", "calculator"],
    ["legal", "Legal Consultation", "library"],
  ]],
  ["Creative & Digital", [
    ["graphic-design", "Graphic Design", "color-palette"],
    ["photography", "Photography", "camera"],
    ["videography", "Videography", "videocam"],
    ["video-editing", "Video Editing", "film"],
    ["interior-design", "Interior Design", "bed"],
  ]],
  ["Events & Entertainment", [
    ["catering", "Catering & Cooking", "restaurant"],
    ["event-planning", "Event Planning", "calendar"],
    ["event-decor", "Event Decoration & Setup", "balloon"],
    ["dj", "DJ Services", "disc"],
    ["mc-host", "MC & Host Services", "mic"],
    ["makeup", "Makeup Artist", "color-wand"],
    ["hair-styling", "Hair Styling", "cut"],
    ["beauty", "Beauty & Nails", "cut"],
    ["equipment-hire", "Tent & Equipment Hire", "umbrella"],
    ["sound-hire", "Sound System Hire", "volume-high"],
  ]],
  ["Automotive", [
    ["mechanic", "Auto Mechanic", "car-sport"],
    ["panel-beating", "Panel Beating & Spraying", "brush"],
    ["car-wash", "Mobile Car Wash", "car"],
    ["tyre-service", "Tyre Repair & Replacement", "ellipse"],
    ["roadside", "Roadside Assistance", "warning"],
  ]],
  ["Labour & Security", [
    ["construction", "Construction & Building Assistants", "build"],
    ["general-labour", "General Labour", "body"],
    ["farm-work", "Farm Work (Seasonal)", "leaf"],
    ["security", "Security Personnel", "shield"],
    ["cctv", "CCTV & Alarm Installation", "videocam"],
  ]],
  ["Health & Wellness", [
    ["fitness", "Fitness Training", "barbell"],
    ["nutrition", "Nutrition Coaching", "nutrition"],
    ["wellness", "Mental Wellness Support", "happy"],
  ]],
];

// Flatten to [slug, name, icon, sector] in order.
const CATEGORIES = SECTORS.flatMap(([sector, items]) => items.map(([slug, name, icon]) => [slug, name, icon, sector]));

// Guard against a typo producing a duplicate slug (which would silently drop a category).
const slugs = new Set();
for (const [slug] of CATEGORIES) {
  if (slugs.has(slug)) throw new Error(`Duplicate slug in list: ${slug}`);
  slugs.add(slug);
}

// 0) Ensure the sector column exists (additive, idempotent).
await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS sector text`;

// 1) Upsert into the live DB.
let i = 0;
for (const [slug, name, icon, sector] of CATEGORIES) {
  i++;
  await sql`
    INSERT INTO categories (name, slug, icon, sort_order, sector)
    VALUES (${name}, ${slug}, ${icon}, ${i}, ${sector})
    ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name, icon = EXCLUDED.icon,
          sort_order = EXCLUDED.sort_order, sector = EXCLUDED.sector
  `;
}
console.log(`ok: upserted ${CATEGORIES.length} categories across ${SECTORS.length} sectors`);

// 2) Regenerate scripts/seed.sql from the same list.
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const rows = CATEGORIES.map(([slug, name, icon, sector], idx) =>
  `  (${q(name).padEnd(38)}, ${q(slug).padEnd(22)}, ${q(icon).padEnd(20)}, ${idx + 1}, ${q(sector)})`
).join(",\n");
const seed = `-- Seed: service categories. Generated by scripts/seed-categories.mjs — edit THAT, not this.
-- Idempotent: the slug is the stable key, so re-running reconciles name/icon/sort_order/sector
-- without ever touching a slug that jobs.category / provider_profiles.primary_category references.
INSERT INTO categories (name, slug, icon, sort_order, sector) VALUES
${rows}
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, icon = EXCLUDED.icon,
      sort_order = EXCLUDED.sort_order, sector = EXCLUDED.sector;
`;
writeFileSync(new URL("./seed.sql", import.meta.url), seed);
console.log("ok: wrote scripts/seed.sql");

const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM categories`;
console.log(`DONE — categories table now has ${n} rows`);
