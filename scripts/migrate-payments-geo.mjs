// One-off migration: payments table, booking payment status, provider geo coords.
// Run: node --env-file=.env.local scripts/migrate-payments-geo.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const statements = [
  `CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reference_number TEXT UNIQUE,
    poll_url TEXT,
    redirect_url TEXT,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    method TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','cancelled')),
    raw_status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference_number)`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','pending','paid','refunded'))`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ`,
  // provider live/base location
  `ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION`,
  `ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION`,
  // live tracking of an active job (provider's current position)
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_lat DOUBLE PRECISION`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_lng DOUBLE PRECISION`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_location_at TIMESTAMPTZ`,
  // customer job location (where the work happens)
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION`,
];

// Seed approximate Harare coordinates for the demo providers.
const coords = [
  ["22222222-2222-2222-2222-222222222221", -17.8003, 31.0408], // Avondale
  ["22222222-2222-2222-2222-222222222222", -17.8312, 31.0530],
  ["22222222-2222-2222-2222-222222222223", -17.7612, 31.0411], // Mt Pleasant
  ["22222222-2222-2222-2222-222222222224", -17.8650, 31.0290],
  ["22222222-2222-2222-2222-222222222225", -17.8190, 31.0620],
];

for (const s of statements) {
  await sql.query(s);
  console.log("ok:", s.split("\n")[0].slice(0, 70));
}
for (const [id, lat, lng] of coords) {
  await sql.query(
    `UPDATE provider_profiles SET lat = $2, lng = $3 WHERE user_id = $1 AND lat IS NULL`,
    [id, lat, lng]
  );
}
console.log("seeded provider coordinates");
console.log("DONE");
