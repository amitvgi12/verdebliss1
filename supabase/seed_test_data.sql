-- ═══════════════════════════════════════════════════════════════════════
--  VerdeBliss — Idempotent Test Data Seed Script
--  Source: current app catalogue + current audit-fixed schema
--
--  Run order:
--    1. Run supabase/schema.sql first.
--    2. Run this file in Supabase Dashboard → SQL Editor.
--
--  This script is safe to re-run. It refreshes only deterministic test data:
--    - the 8 current VerdeBliss catalogue products
--    - 3 test customers / profiles
--    - test orders, order_items, payment_events, loyalty_ledger
--    - wishlist, reviews, addresses, contact/newsletter consent test rows
--
--  Test password for seeded auth users: TestPass123!
--  Test users:
--    kavya@verdebliss.test  — Gold Botanist
--    rahul@verdebliss.test  — Green Leaf
--    priya@verdebliss.test  — Platinum Alchemist
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────────────────
-- 1) Product catalogue compatibility
--    Existing projects may have public.products.id as uuid.
--    New audit-fixed installs use text IDs. This seed supports both.
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id            text primary key,
  slug          text unique,
  name          text not null,
  description   text,
  price         numeric(10,2) not null check (price >= 0),
  mrp           numeric(10,2),
  price_valid_until timestamptz,
  category      text not null,
  skin_types    text[] default '{}',
  badges        text[] default '{}',
  ingredient    text,
  emoji         text,
  bg_color      text default '#EBF0E9',
  image_url     text,
  rating        numeric(3,2) check (rating between 0 and 5),
  review_count  int default 0 check (review_count >= 0),
  stock         int default 100 check (stock >= 0),
  active        boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  constraint products_mrp_gt_price_check check (mrp is null or mrp > price)
);

alter table public.products add column if not exists slug text;
alter table public.products add column if not exists description text;
alter table public.products add column if not exists price numeric(10,2);
alter table public.products add column if not exists mrp numeric(10,2);
alter table public.products add column if not exists price_valid_until timestamptz;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists skin_types text[] default '{}';
alter table public.products add column if not exists badges text[] default '{}';
alter table public.products add column if not exists ingredient text;
alter table public.products add column if not exists emoji text;
alter table public.products add column if not exists bg_color text default '#EBF0E9';
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists rating numeric(3,2);
alter table public.products alter column rating drop default;
alter table public.products add column if not exists review_count int default 0;
alter table public.products add column if not exists stock int default 100;
alter table public.products add column if not exists active boolean default true;
alter table public.products add column if not exists created_at timestamptz default now();
alter table public.products add column if not exists updated_at timestamptz default now();

update public.products
   set mrp = null,
       price_valid_until = null,
       updated_at = now()
 where mrp is not null
   and mrp <= price;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_mrp_gt_price_check'
  ) then
    alter table public.products
      add constraint products_mrp_gt_price_check
      check (mrp is null or mrp > price)
      not valid;
  end if;
end $$;

alter table public.products validate constraint products_mrp_gt_price_check;

create unique index if not exists products_slug_unique_idx on public.products (slug) where slug is not null;
create index if not exists products_active_idx on public.products (active);

do $$
declare
  product_id_data_type text;
  product_id_cast_type text;
  chosen_id text;
  affected int;
  p record;
begin
  select data_type
    into product_id_data_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'products'
    and column_name = 'id';

  product_id_cast_type := case
    when product_id_data_type = 'uuid' then 'uuid'
    else 'text'
  end;

  for p in
    select * from (values
      (
        '1', '1d40699e-80f0-4779-b3d9-577c2f75fb84',
        'bakuchiol-renewal-serum',
        'Bakuchiol Renewal Serum',
        'Plant-based retinol alternative for visible cell renewal without irritation.',
        250.00::numeric, null::numeric, null::timestamptz, 'Serum',
        array['Dry','Combination']::text[], array['Vegan','Organic Certified']::text[],
        'Bakuchiol', '🌿', '#EBF0E9', '/images/products/serum.webp', null::numeric, 0, 100
      ),
      (
        '2', '2d40699e-80f0-4779-b3d9-577c2f75fb84',
        'rose-hip-glow-moisturiser',
        'Rose Hip Glow Moisturiser',
        'Rich cloud-like hydration with rosehip oil and ceramides for lasting softness.',
        390.00::numeric, null::numeric, null::timestamptz, 'Moisturiser',
        array['Dry','Sensitive']::text[], array['Cruelty-Free','Vegan']::text[],
        'Rose Hip', '🌹', '#F6EDE8', '/images/products/moisturiser.webp', null::numeric, 0, 100
      ),
      (
        '3', '3d40699e-80f0-4779-b3d9-577c2f75fb84',
        'green-tea-clarity-toner',
        'Green Tea Clarity Toner',
        'Balance oil and refine pores with antioxidant-rich green tea extract.',
        450.00::numeric, null::numeric, null::timestamptz, 'Toner',
        array['Oily','Combination']::text[], array['Vegan','Organic Certified']::text[],
        'Green Tea', '🍃', '#E8F2EA', '/images/products/toner.webp', null::numeric, 0, 100
      ),
      (
        '4', '4d40699e-80f0-4779-b3d9-577c2f75fb84',
        'turmeric-brightening-cleanser',
        'Turmeric Brightening Cleanser',
        'Gentle foam cleanser with turmeric and neem for a luminous complexion.',
        250.00::numeric, null::numeric, null::timestamptz, 'Cleanser',
        array['All Types']::text[], array['Cruelty-Free','Organic Certified']::text[],
        'Turmeric', '✨', '#F5F0E4', '/images/products/cleanser.webp', null::numeric, 0, 100
      ),
      (
        '5', '5d40699e-80f0-4779-b3d9-577c2f75fb84',
        'botanical-spf-50-shield',
        'Botanical SPF 50 Shield',
        'Featherlight mineral sunscreen with zinc oxide and soothing aloe vera.',
        220.00::numeric, null::numeric, null::timestamptz, 'SPF',
        array['All Types']::text[], array['Vegan','Cruelty-Free']::text[],
        'Zinc Oxide', '☀️', '#FFF8E8', '/images/products/spf.webp', null::numeric, 0, 100
      ),
      (
        '6', '6d40699e-80f0-4779-b3d9-577c2f75fb84',
        'wild-berry-lip-elixir',
        'Wild Berry Lip Elixir',
        'Nourishing lip treatment with acai berry and shea for pillowy softness.',
        490.00::numeric, null::numeric, null::timestamptz, 'Lip Care',
        array['All Types']::text[], array['Vegan','Organic Certified']::text[],
        'Acai Berry', '🫐', '#F0E8F5', '/images/products/lip-elixir.webp', null::numeric, 0, 100
      ),
      (
        '7', '7d40699e-80f0-4779-b3d9-577c2f75fb84',
        'niacinamide-pore-serum',
        'Niacinamide Pore Serum',
        'Minimise pores and control sebum with a 10% niacinamide complex.',
        350.00::numeric, null::numeric, null::timestamptz, 'Serum',
        array['Oily','Combination']::text[], array['Vegan','Cruelty-Free']::text[],
        'Niacinamide', '💧', '#E8EFF5', '/images/products/niacinamide-serum.webp', null::numeric, 0, 100
      ),
      (
        '8', '8d40699e-80f0-4779-b3d9-577c2f75fb84',
        'shea-butter-night-cream',
        'Shea Butter Night Cream',
        'Intensive overnight repair with shea butter and vitamin E for morning glow.',
        550.00::numeric, null::numeric, null::timestamptz, 'Moisturiser',
        array['Dry','Sensitive']::text[], array['Organic Certified','Cruelty-Free']::text[],
        'Shea Butter', '🌙', '#F5EBF0', '/images/products/night-cream.webp', null::numeric, 0, 100
      )
    ) as product_seed(
      id_text, id_uuid, slug, name, description, price, mrp, price_valid_until, category,
      skin_types, badges, ingredient, emoji, bg_color, image_url,
      rating, review_count, stock
    )
  loop
    -- Prefer updating the product row already visible in the Supabase table.
    update public.products
       set slug = p.slug,
           description = p.description,
           price = p.price,
           mrp = p.mrp,
           price_valid_until = p.price_valid_until,
           category = p.category,
           skin_types = p.skin_types,
           badges = p.badges,
           ingredient = p.ingredient,
           emoji = p.emoji,
           bg_color = p.bg_color,
           image_url = p.image_url,
           rating = p.rating,
           review_count = p.review_count,
           stock = p.stock,
           active = true,
           updated_at = now()
     where lower(name) = lower(p.name);

    get diagnostics affected = row_count;

    if affected = 0 then
      chosen_id := case when product_id_cast_type = 'uuid' then p.id_uuid else p.id_text end;

      execute format(
        'insert into public.products (
           id, slug, name, description, price, mrp, price_valid_until, category, skin_types, badges,
           ingredient, emoji, bg_color, image_url, rating, review_count, stock,
           active, created_at, updated_at
         ) values (
           $1::%s, $2, $3, $4, $5, $6, $7, $8, $9, $10,
           $11, $12, $13, $14, $15, $16, $17,
           true, now(), now()
         )',
        product_id_cast_type
      ) using
        chosen_id, p.slug, p.name, p.description, p.price, p.mrp, p.price_valid_until,
        p.category, p.skin_types, p.badges, p.ingredient, p.emoji, p.bg_color,
        p.image_url, p.rating, p.review_count, p.stock;
    end if;
  end loop;

  raise notice 'Product catalogue seeded/updated using % product IDs.', product_id_cast_type;
end $$;

-- ──────────────────────────────────────────────────────────────────────
-- 2) Test customers, orders, ledger, reviews, wishlist and consent rows
-- ──────────────────────────────────────────────────────────────────────
do $$
declare
  uid_kavya uuid;
  uid_rahul uuid;
  uid_priya uuid;

  pid_bakuchiol text;
  pid_rosehip text;
  pid_toner text;
  pid_cleanser text;
  pid_spf text;
  pid_lip text;
  pid_niacinamide text;
  pid_nightcream text;

  kavya_addr jsonb := '{
    "name": "Kavya Menon",
    "email": "kavya@verdebliss.test",
    "line1": "Flat 4B, Green Heights",
    "line2": "Kharadi",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411014",
    "phone": "9876543210"
  }'::jsonb;

  rahul_addr jsonb := '{
    "name": "Rahul Sharma",
    "email": "rahul@verdebliss.test",
    "line1": "12, MG Road",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001",
    "phone": "9988776655"
  }'::jsonb;

  priya_addr jsonb := '{
    "name": "Priya Nair",
    "email": "priya@verdebliss.test",
    "line1": "C-302, Sea View Apartments",
    "line2": "Bandra West",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400050",
    "phone": "9123456789"
  }'::jsonb;
begin
  -- This seed is an admin maintenance script. The app correctly protects
  -- points/tier/staff writes from customer sessions, so mark only this block
  -- as service-role scoped for the deterministic loyalty recompute below.
  perform set_config('request.jwt.claim.role', 'service_role', true);

  -- Reuse already-created auth users if these test emails exist.
  select id into uid_kavya from auth.users where lower(email) = 'kavya@verdebliss.test' limit 1;
  if uid_kavya is null then
    uid_kavya := 'a1b2c3d4-0001-0001-0001-000000000001';
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
      is_super_admin, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      uid_kavya, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', 'kavya@verdebliss.test',
      crypt('TestPass123!', gen_salt('bf')), now(), now(), now(),
      '{"full_name":"Kavya Menon","skin_type":"Dry"}'::jsonb,
      '{"provider":"email","providers":["email"]}'::jsonb,
      false, '', '', '', ''
    );
  end if;

  select id into uid_rahul from auth.users where lower(email) = 'rahul@verdebliss.test' limit 1;
  if uid_rahul is null then
    uid_rahul := 'a1b2c3d4-0002-0002-0002-000000000002';
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
      is_super_admin, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      uid_rahul, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', 'rahul@verdebliss.test',
      crypt('TestPass123!', gen_salt('bf')), now(), now(), now(),
      '{"full_name":"Rahul Sharma","skin_type":"Oily"}'::jsonb,
      '{"provider":"email","providers":["email"]}'::jsonb,
      false, '', '', '', ''
    );
  end if;

  select id into uid_priya from auth.users where lower(email) = 'priya@verdebliss.test' limit 1;
  if uid_priya is null then
    uid_priya := 'a1b2c3d4-0003-0003-0003-000000000003';
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
      is_super_admin, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      uid_priya, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', 'priya@verdebliss.test',
      crypt('TestPass123!', gen_salt('bf')), now(), now(), now(),
      '{"full_name":"Priya Nair","skin_type":"Combination"}'::jsonb,
      '{"provider":"email","providers":["email"]}'::jsonb,
      false, '', '', '', ''
    );
  end if;

  insert into public.profiles (id, full_name, skin_type, created_at, updated_at)
  values
    (uid_kavya, 'Kavya Menon', 'Dry', now() - interval '90 days', now()),
    (uid_rahul, 'Rahul Sharma', 'Oily', now() - interval '30 days', now()),
    (uid_priya, 'Priya Nair', 'Combination', now() - interval '180 days', now())
  on conflict (id) do update
    set full_name = excluded.full_name,
        skin_type = excluded.skin_type,
        updated_at = now();

  -- Fetch actual product IDs, whether this project stores text IDs or uuid IDs.
  select id::text into pid_bakuchiol from public.products where lower(name) = lower('Bakuchiol Renewal Serum') limit 1;
  select id::text into pid_rosehip from public.products where lower(name) = lower('Rose Hip Glow Moisturiser') limit 1;
  select id::text into pid_toner from public.products where lower(name) = lower('Green Tea Clarity Toner') limit 1;
  select id::text into pid_cleanser from public.products where lower(name) = lower('Turmeric Brightening Cleanser') limit 1;
  select id::text into pid_spf from public.products where lower(name) = lower('Botanical SPF 50 Shield') limit 1;
  select id::text into pid_lip from public.products where lower(name) = lower('Wild Berry Lip Elixir') limit 1;
  select id::text into pid_niacinamide from public.products where lower(name) = lower('Niacinamide Pore Serum') limit 1;
  select id::text into pid_nightcream from public.products where lower(name) = lower('Shea Butter Night Cream') limit 1;

  if pid_bakuchiol is null or pid_rosehip is null or pid_toner is null or pid_cleanser is null
     or pid_spf is null or pid_lip is null or pid_niacinamide is null or pid_nightcream is null then
    raise exception 'Product seed failed: one or more required products are missing.';
  end if;

  -- Remove only deterministic test rows so re-running this seed does not duplicate data.
  delete from public.payment_events
   where provider_payment_id like 'pay_test_%'
      or order_id in (select id from public.orders where user_id = any(array[uid_kavya, uid_rahul, uid_priya]));

  delete from public.order_items
   where order_id in (select id from public.orders where user_id = any(array[uid_kavya, uid_rahul, uid_priya]));

  delete from public.loyalty_ledger where user_id = any(array[uid_kavya, uid_rahul, uid_priya]);
  delete from public.refunds where user_id = any(array[uid_kavya, uid_rahul, uid_priya]);
  delete from public.wishlist where user_id = any(array[uid_kavya, uid_rahul, uid_priya]);
  delete from public.reviews where user_id = any(array[uid_kavya, uid_rahul, uid_priya]);
  delete from public.addresses where user_id = any(array[uid_kavya, uid_rahul, uid_priya]);
  delete from public.orders where user_id = any(array[uid_kavya, uid_rahul, uid_priya]) or payment_id like 'pay_test_%';
  delete from public.contact_tickets where email like '%@verdebliss.test';
  delete from public.customer_consents where email like '%@verdebliss.test';

  -- Addresses.
  insert into public.addresses (user_id, label, line1, line2, city, state, pincode, is_default, created_at)
  values
    (uid_kavya, 'Home', 'Flat 4B, Green Heights', 'Kharadi', 'Pune', 'Maharashtra', '411014', true, now() - interval '80 days'),
    (uid_rahul, 'Home', '12, MG Road', null, 'Bangalore', 'Karnataka', '560001', true, now() - interval '25 days'),
    (uid_priya, 'Home', 'C-302, Sea View Apartments', 'Bandra West', 'Mumbai', 'Maharashtra', '400050', true, now() - interval '160 days');

  -- Orders use current catalogue prices and the app shipping rule: free shipping at ₹499+; otherwise ₹79.
  insert into public.orders (
    user_id, status, subtotal, shipping, total, points_earned, items, address,
    payment_id, payment_order_id, payment_method, payment_status, created_at, updated_at
  ) values
  (
    uid_kavya, 'Delivered', 640, 0, 640, 64,
    jsonb_build_array(
      jsonb_build_object('id', pid_bakuchiol, 'name', 'Bakuchiol Renewal Serum', 'price', 250, 'qty', 1, 'ingredient', 'Bakuchiol', 'emoji', '🌿', 'bg_color', '#EBF0E9', 'image_url', '/images/products/serum.webp'),
      jsonb_build_object('id', pid_rosehip, 'name', 'Rose Hip Glow Moisturiser', 'price', 390, 'qty', 1, 'ingredient', 'Rose Hip', 'emoji', '🌹', 'bg_color', '#F6EDE8', 'image_url', '/images/products/moisturiser.webp')
    ),
    kavya_addr || '{"payment_method":"Razorpay"}'::jsonb,
    'pay_test_Kav001Delivered', 'order_test_Kav001', 'Razorpay · UPI', 'paid', now() - interval '45 days', now() - interval '38 days'
  ),
  (
    uid_kavya, 'Shipped', 350, 79, 429, 35,
    jsonb_build_array(
      jsonb_build_object('id', pid_niacinamide, 'name', 'Niacinamide Pore Serum', 'price', 350, 'qty', 1, 'ingredient', 'Niacinamide', 'emoji', '💧', 'bg_color', '#E8EFF5', 'image_url', '/images/products/niacinamide-serum.webp')
    ),
    kavya_addr || '{"payment_method":"Razorpay"}'::jsonb,
    'pay_test_Kav002Shipped', 'order_test_Kav002', 'Razorpay · Card', 'paid', now() - interval '5 days', now() - interval '3 days'
  ),
  (
    uid_kavya, 'Processing', 670, 0, 670, 67,
    jsonb_build_array(
      jsonb_build_object('id', pid_spf, 'name', 'Botanical SPF 50 Shield', 'price', 220, 'qty', 1, 'ingredient', 'Zinc Oxide', 'emoji', '☀️', 'bg_color', '#FFF8E8', 'image_url', '/images/products/spf.webp'),
      jsonb_build_object('id', pid_toner, 'name', 'Green Tea Clarity Toner', 'price', 450, 'qty', 1, 'ingredient', 'Green Tea', 'emoji', '🍃', 'bg_color', '#E8F2EA', 'image_url', '/images/products/toner.webp')
    ),
    kavya_addr || '{"payment_method":"Razorpay"}'::jsonb,
    'pay_test_Kav003Processing', 'order_test_Kav003', 'Razorpay · Net Banking', 'paid', now() - interval '1 day', now() - interval '1 day'
  ),
  (
    uid_rahul, 'Processing', 800, 0, 800, 80,
    jsonb_build_array(
      jsonb_build_object('id', pid_niacinamide, 'name', 'Niacinamide Pore Serum', 'price', 350, 'qty', 1, 'ingredient', 'Niacinamide', 'emoji', '💧', 'bg_color', '#E8EFF5', 'image_url', '/images/products/niacinamide-serum.webp'),
      jsonb_build_object('id', pid_toner, 'name', 'Green Tea Clarity Toner', 'price', 450, 'qty', 1, 'ingredient', 'Green Tea', 'emoji', '🍃', 'bg_color', '#E8F2EA', 'image_url', '/images/products/toner.webp')
    ),
    rahul_addr || '{"payment_method":"Razorpay"}'::jsonb,
    'pay_test_Rah001Processing', 'order_test_Rah001', 'Razorpay · Wallet', 'paid', now() - interval '2 days', now() - interval '2 days'
  ),
  (
    uid_priya, 'Delivered', 1290, 0, 1290, 129,
    jsonb_build_array(
      jsonb_build_object('id', pid_bakuchiol, 'name', 'Bakuchiol Renewal Serum', 'price', 250, 'qty', 1, 'ingredient', 'Bakuchiol', 'emoji', '🌿', 'bg_color', '#EBF0E9', 'image_url', '/images/products/serum.webp'),
      jsonb_build_object('id', pid_nightcream, 'name', 'Shea Butter Night Cream', 'price', 550, 'qty', 1, 'ingredient', 'Shea Butter', 'emoji', '🌙', 'bg_color', '#F5EBF0', 'image_url', '/images/products/night-cream.webp'),
      jsonb_build_object('id', pid_lip, 'name', 'Wild Berry Lip Elixir', 'price', 490, 'qty', 1, 'ingredient', 'Acai Berry', 'emoji', '🫐', 'bg_color', '#F0E8F5', 'image_url', '/images/products/lip-elixir.webp')
    ),
    priya_addr || '{"payment_method":"Razorpay"}'::jsonb,
    'pay_test_Pri001Delivered', 'order_test_Pri001', 'Razorpay · UPI', 'paid', now() - interval '120 days', now() - interval '115 days'
  ),
  (
    uid_priya, 'Delivered', 640, 0, 640, 64,
    jsonb_build_array(
      jsonb_build_object('id', pid_bakuchiol, 'name', 'Bakuchiol Renewal Serum', 'price', 250, 'qty', 1, 'ingredient', 'Bakuchiol', 'emoji', '🌿', 'bg_color', '#EBF0E9', 'image_url', '/images/products/serum.webp'),
      jsonb_build_object('id', pid_rosehip, 'name', 'Rose Hip Glow Moisturiser', 'price', 390, 'qty', 1, 'ingredient', 'Rose Hip', 'emoji', '🌹', 'bg_color', '#F6EDE8', 'image_url', '/images/products/moisturiser.webp')
    ),
    priya_addr || '{"payment_method":"Razorpay"}'::jsonb,
    'pay_test_Pri002Delivered', 'order_test_Pri002', 'Razorpay · Card', 'paid', now() - interval '90 days', now() - interval '83 days'
  ),
  (
    uid_priya, 'Delivered', 220, 79, 299, 22,
    jsonb_build_array(
      jsonb_build_object('id', pid_spf, 'name', 'Botanical SPF 50 Shield', 'price', 220, 'qty', 1, 'ingredient', 'Zinc Oxide', 'emoji', '☀️', 'bg_color', '#FFF8E8', 'image_url', '/images/products/spf.webp')
    ),
    priya_addr || '{"payment_method":"Cash on Delivery"}'::jsonb,
    'pay_test_Pri003Delivered', 'order_test_Pri003', 'Cash on Delivery', 'cod_pending', now() - interval '60 days', now() - interval '54 days'
  ),
  (
    uid_priya, 'Shipped', 600, 0, 600, 60,
    jsonb_build_array(
      jsonb_build_object('id', pid_bakuchiol, 'name', 'Bakuchiol Renewal Serum', 'price', 250, 'qty', 1, 'ingredient', 'Bakuchiol', 'emoji', '🌿', 'bg_color', '#EBF0E9', 'image_url', '/images/products/serum.webp'),
      jsonb_build_object('id', pid_niacinamide, 'name', 'Niacinamide Pore Serum', 'price', 350, 'qty', 1, 'ingredient', 'Niacinamide', 'emoji', '💧', 'bg_color', '#E8EFF5', 'image_url', '/images/products/niacinamide-serum.webp')
    ),
    priya_addr || '{"payment_method":"Razorpay"}'::jsonb,
    'pay_test_Pri004Shipped', 'order_test_Pri004', 'Razorpay · UPI', 'paid', now() - interval '8 days', now() - interval '6 days'
  ),
  (
    uid_priya, 'Processing', 250, 79, 329, 25,
    jsonb_build_array(
      jsonb_build_object('id', pid_cleanser, 'name', 'Turmeric Brightening Cleanser', 'price', 250, 'qty', 1, 'ingredient', 'Turmeric', 'emoji', '✨', 'bg_color', '#F5F0E4', 'image_url', '/images/products/cleanser.webp')
    ),
    priya_addr || '{"payment_method":"Cash on Delivery"}'::jsonb,
    'pay_test_Pri005Processing', 'order_test_Pri005', 'Cash on Delivery', 'cod_pending', now() - interval '6 hours', now() - interval '6 hours'
  );

  -- Normalized order items used by admin/reporting/payment reconciliation tests.
  insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, line_total, created_at)
  select
    o.id,
    item->>'id',
    item->>'name',
    (item->>'qty')::int,
    (item->>'price')::numeric,
    ((item->>'qty')::int * (item->>'price')::numeric)::numeric(10,2),
    o.created_at
  from public.orders o
  cross join lateral jsonb_array_elements(o.items) item
  where o.payment_id like 'pay_test_%';

  insert into public.payment_events (
    order_id, provider, provider_order_id, provider_payment_id,
    event_type, amount, currency, verified, payload, created_at
  )
  select
    o.id,
    case when o.payment_status = 'paid' then 'razorpay' else 'cod' end,
    o.payment_order_id,
    o.payment_id,
    o.payment_status,
    o.total,
    'INR',
    o.payment_status = 'paid',
    jsonb_build_object('seed', true, 'status', o.status, 'source', 'seed_test_data.sql'),
    o.created_at
  from public.orders o
  where o.payment_id like 'pay_test_%';

  insert into public.loyalty_ledger (user_id, order_id, event_type, points_delta, reason, created_at)
  select
    o.user_id,
    o.id,
    case when o.payment_status = 'paid' then 'order_payment_verified' else 'cod_order_created' end,
    o.points_earned,
    'Seeded loyalty movement for test order ' || o.payment_id,
    o.created_at
  from public.orders o
  where o.payment_id like 'pay_test_%';

  insert into public.wishlist (user_id, product_id, created_at) values
    (uid_kavya, pid_spf, now() - interval '10 days'),
    (uid_kavya, pid_nightcream, now() - interval '9 days'),
    (uid_priya, pid_bakuchiol, now() - interval '20 days'),
    (uid_priya, pid_toner, now() - interval '18 days'),
    (uid_priya, pid_lip, now() - interval '16 days')
  on conflict (user_id, product_id) do nothing;

  insert into public.reviews (product_id, user_id, rating, title, body, approved, created_at, updated_at) values
    (pid_bakuchiol, uid_kavya, 5, 'Visible glow without irritation', 'My dry skin handled this serum well and looked smoother after two weeks.', true, now() - interval '35 days', now() - interval '35 days'),
    (pid_rosehip, uid_priya, 5, 'Soft hydrated finish', 'Lightweight but nourishing. Works well under sunscreen.', true, now() - interval '30 days', now() - interval '30 days'),
    (pid_toner, uid_rahul, 4, 'Good for oily skin', 'Helped control shine without making my skin feel tight.', true, now() - interval '12 days', now() - interval '12 days'),
    (pid_spf, uid_priya, 5, 'No heavy white cast', 'Comfortable mineral SPF for daily wear.', true, now() - interval '8 days', now() - interval '8 days'),
    (pid_cleanser, uid_priya, 4, 'Gentle cleanser', 'Good morning cleanser and does not feel harsh.', false, now() - interval '2 days', now() - interval '2 days');

  -- Product-card review summaries must mirror real approved reviews, never
  -- screenshot-era marketing numbers.
  update public.products p
     set rating = aggregates.rating,
         review_count = aggregates.review_count,
         updated_at = now()
    from (
      select
        product_id::text as product_id,
        round(avg(rating)::numeric, 2) as rating,
        count(*)::int as review_count
      from public.reviews
      where approved = true
      group by product_id
    ) aggregates
   where p.id::text = aggregates.product_id;

  update public.products
     set rating = null,
         review_count = 0,
         updated_at = now()
   where id::text = any(array[
     pid_bakuchiol,
     pid_rosehip,
     pid_toner,
     pid_cleanser,
     pid_spf,
     pid_lip,
     pid_niacinamide,
     pid_nightcream
   ])
     and id::text not in (
       select product_id::text
       from public.reviews
       where approved = true
     );

  insert into public.refunds (user_id, order_id, reason, details, status, response, created_at, updated_at)
  select
    uid_priya,
    o.id,
    'Changed my mind',
    jsonb_build_object('seed', true, 'preferred_resolution', 'store_credit'),
    'requested',
    null,
    now() - interval '1 day',
    now() - interval '1 day'
  from public.orders o
  where o.payment_id = 'pay_test_Pri005Processing'
  limit 1;

  insert into public.contact_tickets (name, email, topic, message, source, status, created_at, updated_at) values
    ('Kavya Menon', 'kavya@verdebliss.test', 'Order Support', 'Can you confirm when my SPF order will be delivered?', 'seed_test_data', 'new', now() - interval '2 days', now() - interval '2 days'),
    ('Rahul Sharma', 'rahul@verdebliss.test', 'Product Advice', 'Which product should I pair with the niacinamide serum for oily skin?', 'seed_test_data', 'new', now() - interval '1 day', now() - interval '1 day');

  insert into public.customer_consents (
    email, consent_type, source, consented, consented_at, confirmed_at, created_at
  ) values
    ('kavya@verdebliss.test', 'newsletter', 'seed_test_data', true, now() - interval '60 days', now() - interval '60 days', now() - interval '60 days'),
    ('rahul@verdebliss.test', 'newsletter', 'seed_test_data', true, now() - interval '20 days', now() - interval '20 days', now() - interval '20 days'),
    ('priya@verdebliss.test', 'newsletter', 'seed_test_data', true, now() - interval '120 days', now() - interval '120 days', now() - interval '120 days')
  on conflict (email, consent_type) do update
    set source = excluded.source,
        consented = excluded.consented,
        consented_at = excluded.consented_at,
        confirmed_at = excluded.confirmed_at,
        revoked_at = null,
        confirmation_token_hash = null,
        confirmation_expires_at = null;

  -- Tier calibration bonus entries keep account-dashboard tests meaningful even
  -- with the current catalogue's low demo product prices.
  insert into public.loyalty_ledger (user_id, order_id, event_type, points_delta, reason, created_at) values
    (uid_kavya, null, 'seed_tier_calibration', 454, 'Seed bonus to exercise Gold Botanist UI state', now() - interval '44 days'),
    (uid_priya, null, 'seed_tier_calibration', 1450, 'Seed bonus to exercise Platinum Alchemist UI state', now() - interval '119 days');

  -- Align profile points with the generated loyalty ledger.
  update public.profiles p
     set points = coalesce((
           select sum(points_delta)::int
           from public.loyalty_ledger l
           where l.user_id = p.id
         ), 0),
         tier = case
           when coalesce((select sum(points_delta)::int from public.loyalty_ledger l where l.user_id = p.id), 0) >= 1500 then 'Platinum Alchemist'
           when coalesce((select sum(points_delta)::int from public.loyalty_ledger l where l.user_id = p.id), 0) >= 500 then 'Gold Botanist'
           else 'Green Leaf'
         end,
         is_staff = false,
         updated_at = now()
   where p.id = any(array[uid_kavya, uid_rahul, uid_priya]);

  raise notice 'Seeded products, users, orders, order_items, payment events, loyalty ledger, reviews, wishlist and consent rows.';
end $$;

-- ──────────────────────────────────────────────────────────────────────
-- 3) Verification output
-- ──────────────────────────────────────────────────────────────────────
select
  id::text as product_id,
  name,
  description,
  price,
  category,
  slug,
  rating,
  review_count,
  active
from public.products
where name in (
  'Bakuchiol Renewal Serum',
  'Rose Hip Glow Moisturiser',
  'Green Tea Clarity Toner',
  'Turmeric Brightening Cleanser',
  'Botanical SPF 50 Shield',
  'Wild Berry Lip Elixir',
  'Niacinamide Pore Serum',
  'Shea Butter Night Cream'
)
order by case name
  when 'Bakuchiol Renewal Serum' then 1
  when 'Rose Hip Glow Moisturiser' then 2
  when 'Green Tea Clarity Toner' then 3
  when 'Turmeric Brightening Cleanser' then 4
  when 'Botanical SPF 50 Shield' then 5
  when 'Wild Berry Lip Elixir' then 6
  when 'Niacinamide Pore Serum' then 7
  when 'Shea Butter Night Cream' then 8
  else 99
end;

select
  p.full_name,
  u.email,
  p.tier,
  p.points,
  p.skin_type,
  count(distinct o.id) as order_count,
  coalesce(sum(o.total), 0) as lifetime_spend,
  coalesce(sum(o.points_earned), 0) as order_points
from public.profiles p
join auth.users u on u.id = p.id
left join public.orders o on o.user_id = p.id and o.payment_id like 'pay_test_%'
where u.email in (
  'kavya@verdebliss.test',
  'rahul@verdebliss.test',
  'priya@verdebliss.test'
)
group by p.id, p.full_name, u.email, p.tier, p.points, p.skin_type
order by lifetime_spend desc;
