-- =====================================================================
-- Zivo — seed data (3 categories, 9 products, UK sizes 6–11 with stock)
-- Run this SECOND, after schema.sql. Safe to run more than once.
-- Product images are served from the website's /public/products folder.
-- =====================================================================

-- Categories
insert into public.categories (name, slug, description, image_url, sort_order) values
  ('Sneakers',      'sneakers',      'Everyday classics and street-ready styles.',          '/products/sneakers/classic-high-top.jpg', 1),
  ('Running Shoes', 'running-shoes', 'Light, cushioned and built to go the distance.',       '/products/running-shoes/aerostride.jpg',  2),
  ('Boots',         'boots',         'Rugged boots for the city, the trail and everything between.', '/products/boots/timber-classic.jpg', 3)
on conflict (slug) do nothing;

-- Products (prices are in paise: ₹2,499 = 249900)
insert into public.products (category_id, name, slug, description, price_paise, compare_at_paise, is_featured)
select c.id, p.name, p.slug, p.description, p.price_paise, p.compare_at_paise, p.is_featured
from (values
  ('sneakers', 'Classic High-Top', 'classic-high-top',
   'A timeless canvas high-top in ocean blue. Breathable cotton upper, cushioned insole and a grippy vulcanised rubber sole. Pairs with everything from jeans to shorts.',
   249900, 299900, true),
  ('sneakers', 'Classic Low', 'classic-low',
   'The low-top everyone needs. Deep navy canvas, white toe cap and a flexible rubber sole that is comfortable from the first wear.',
   229900, null, false),
  ('sneakers', 'Metro Strap Mid', 'metro-strap-mid',
   'Mid-top sneaker with a grab-and-go hook-and-loop strap, heathered grey panels and a pop of orange at the collar. Easy on, easy off.',
   279900, null, false),
  ('running-shoes', 'AeroStride', 'aerostride',
   'Our lightest daily trainer. Engineered knit mesh keeps your feet cool while the responsive foam midsole returns energy on every stride.',
   449900, 549900, true),
  ('running-shoes', 'MeshRun Street', 'meshrun-street',
   'Open-grid mesh upper with a sock-like fit and neon accents. Built for city runs, gym sessions and everyday wear.',
   399900, null, false),
  ('running-shoes', 'Pace Pro', 'pace-pro',
   'Stable, supportive and fast. A layered upper, orange heel counter for lockdown and a thick cushioned sole for long-distance comfort.',
   529900, null, true),
  ('boots', 'Timber Classic', 'timber-classic',
   'The iconic wheat nubuck work boot. Padded leather collar, lug rubber outsole and sturdy stitching made to last season after season.',
   599900, 699900, true),
  ('boots', 'Desert Trek', 'desert-trek',
   'Lightweight tactical boot in desert tan. Suede and textile upper, reinforced toe and a high-traction sole for rough ground.',
   499900, null, false),
  ('boots', 'Urban Moc-Toe', 'urban-moc-toe',
   'Polished black leather with a moc-toe silhouette and a chunky commando sole. Smart enough for the office, tough enough for the weekend.',
   649900, null, true)
) as p (category_slug, name, slug, description, price_paise, compare_at_paise, is_featured)
join public.categories c on c.slug = p.category_slug
on conflict (slug) do nothing;

-- One primary image per product
insert into public.product_images (product_id, url, description, sort_order, is_primary)
select pr.id, i.url, i.description, 0, true
from (values
  ('classic-high-top', '/products/sneakers/classic-high-top.jpg',      'Pair of blue canvas high-top sneakers with white laces'),
  ('classic-low',      '/products/sneakers/classic-low.jpg',           'Pair of navy canvas low-top sneakers with white toe caps'),
  ('metro-strap-mid',  '/products/sneakers/metro-strap-mid.jpg',       'Pair of grey mid-top sneakers with a velcro strap'),
  ('aerostride',       '/products/running-shoes/aerostride.jpg',       'Pair of bright blue knit running shoes'),
  ('meshrun-street',   '/products/running-shoes/meshrun-street.jpg',   'Grey open-mesh running shoes with neon yellow accents'),
  ('pace-pro',         '/products/running-shoes/pace-pro.jpg',         'White and grey running shoes with an orange heel'),
  ('timber-classic',   '/products/boots/timber-classic.jpg',           'Pair of wheat nubuck lace-up work boots'),
  ('desert-trek',      '/products/boots/desert-trek.jpg',              'Pair of tan suede tactical boots'),
  ('urban-moc-toe',    '/products/boots/urban-moc-toe.jpg',            'Pair of black leather moc-toe boots')
) as i (slug, url, description)
join public.products pr on pr.slug = i.slug
where not exists (select 1 from public.product_images x where x.product_id = pr.id);

-- Sizes UK 6–11 with stock (a few low / sold-out sizes to show stock badges)
insert into public.product_variants (product_id, size, stock)
select pr.id, s.size, s.stock
from (values
  ('classic-high-top', '6', 8), ('classic-high-top', '7', 12), ('classic-high-top', '8', 15), ('classic-high-top', '9', 10), ('classic-high-top', '10', 6), ('classic-high-top', '11', 3),
  ('classic-low',      '6', 10), ('classic-low', '7', 14), ('classic-low', '8', 20), ('classic-low', '9', 18), ('classic-low', '10', 9), ('classic-low', '11', 4),
  ('metro-strap-mid',  '6', 5), ('metro-strap-mid', '7', 7), ('metro-strap-mid', '8', 0), ('metro-strap-mid', '9', 6), ('metro-strap-mid', '10', 2), ('metro-strap-mid', '11', 0),
  ('aerostride',       '6', 6), ('aerostride', '7', 10), ('aerostride', '8', 14), ('aerostride', '9', 12), ('aerostride', '10', 8), ('aerostride', '11', 5),
  ('meshrun-street',   '6', 4), ('meshrun-street', '7', 9), ('meshrun-street', '8', 11), ('meshrun-street', '9', 7), ('meshrun-street', '10', 3), ('meshrun-street', '11', 2),
  ('pace-pro',         '6', 3), ('pace-pro', '7', 8), ('pace-pro', '8', 10), ('pace-pro', '9', 9), ('pace-pro', '10', 5), ('pace-pro', '11', 1),
  ('timber-classic',   '6', 4), ('timber-classic', '7', 6), ('timber-classic', '8', 9), ('timber-classic', '9', 9), ('timber-classic', '10', 7), ('timber-classic', '11', 4),
  ('desert-trek',      '6', 2), ('desert-trek', '7', 5), ('desert-trek', '8', 8), ('desert-trek', '9', 6), ('desert-trek', '10', 4), ('desert-trek', '11', 0),
  ('urban-moc-toe',    '6', 3), ('urban-moc-toe', '7', 5), ('urban-moc-toe', '8', 7), ('urban-moc-toe', '9', 7), ('urban-moc-toe', '10', 4), ('urban-moc-toe', '11', 2)
) as s (slug, size, stock)
join public.products pr on pr.slug = s.slug
on conflict (product_id, size) do nothing;
