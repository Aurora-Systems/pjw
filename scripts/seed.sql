-- Seed: service categories (idempotent on slug). Run after schema.sql.
-- The slug is the stable key: jobs.category and provider_profiles.primary_category store it.
-- Never rename a slug that is already in use — change the display `name` instead.
INSERT INTO categories (name, slug, icon, sort_order) VALUES
  -- Core
  ('Cleaning', 'cleaning', 'sparkles', 1),
  ('Plumbing', 'plumbing', 'water', 2),
  ('Electrical', 'electrical', 'flash', 3),
  ('Moving', 'moving', 'cube', 4),
  ('Tutoring', 'tutoring', 'school', 5),
  ('Beauty', 'beauty', 'cut', 6),
  ('Gardening', 'gardening', 'leaf', 7),
  ('Repairs', 'repairs', 'hammer', 8),
  -- Building & construction trades
  ('Painting & Decorating',     'painting',      'color-fill',        9),
  ('Carpentry & Joinery',       'carpentry',     'construct',        10),
  ('Welding & Metalwork',       'welding',       'flame',            11),
  ('Bricklaying & Masonry',     'masonry',       'business',         12),
  ('Roofing',                   'roofing',       'home',             13),
  ('Tiling & Flooring',         'tiling',        'grid',             14),
  ('Ceiling & Drywall',         'ceiling',       'layers',           15),
  ('Construction Labour',       'construction',  'build',            16),
  ('Glass & Window Fitting',    'glazing',       'square',           17),
  ('Fencing & Gates',           'fencing',       'lock-closed',      18),
  -- Technical & installation
  ('Solar Installation',        'solar',         'sunny',            19),
  ('Borehole & Water Pumps',    'borehole',      'water',            20),
  ('Refrigeration & Air-Con',   'hvac',          'snow',             21),
  ('Generator Repair',          'generator',     'battery-charging', 22),
  ('Appliance Repair',          'appliance',     'hardware-chip',    23),
  -- Automotive
  ('Auto Mechanic',             'mechanic',      'car-sport',        24),
  ('Panel Beating & Spraying',  'panel-beating', 'brush',            25),
  ('Car Wash & Valet',          'car-wash',      'car',              26),
  ('Driving & Delivery',        'driving',       'bus',              27),
  -- Security & grounds
  ('Security Guard',            'security',      'shield',           28),
  ('CCTV & Alarm Installation', 'cctv',          'videocam',         29),
  ('Pest Control',              'pest-control',  'bug',              30),
  ('Waste Removal',             'waste-removal', 'trash',            31),
  ('Landscaping & Paving',      'landscaping',   'flower',           32),
  -- Domestic & care
  ('Catering & Cooking',        'catering',      'restaurant',       33),
  ('Laundry & Ironing',         'laundry',       'shirt',            34),
  ('Childcare & Nanny',         'childcare',     'people',           35),
  ('Elderly & Home Care',       'home-care',     'heart',            36),
  ('General Handyman',          'handyman',      'hammer',           37)
ON CONFLICT (slug) DO NOTHING;
