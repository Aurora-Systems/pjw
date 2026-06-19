-- Seed: service categories (idempotent on slug). Run after schema.sql.
INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Cleaning', 'cleaning', 'sparkles', 1),
  ('Plumbing', 'plumbing', 'water', 2),
  ('Electrical', 'electrical', 'flash', 3),
  ('Moving', 'moving', 'cube', 4),
  ('Tutoring', 'tutoring', 'school', 5),
  ('Beauty', 'beauty', 'cut', 6),
  ('Gardening', 'gardening', 'leaf', 7),
  ('Repairs', 'repairs', 'hammer', 8)
ON CONFLICT (slug) DO NOTHING;
