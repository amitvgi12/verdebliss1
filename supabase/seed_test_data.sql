-- ═══════════════════════════════════════════════════════════════════════
--  VerdeBliss — Test Data Seed Script
--  Run in: Supabase Dashboard → SQL Editor → New Query → Run
--
--  What this creates:
--    1. Schema extensions (RLS policies for chatbot orders query)
--    2. 3 test users (via auth.users + profiles)
--    3. Sample orders with realistic statuses (Processing, Shipped, Delivered)
--    4. Sample wishlist entries and loyalty points
--
--  Test login credentials (use Supabase Auth → Users tab to set passwords,
--  OR use the sign-up flow on verdebliss.com/account):
--    kavya@verdebliss.test  — Gold Botanist, 3 orders
--    rahul@verdebliss.test  — Green Leaf, 1 order
--    priya@verdebliss.test  — Platinum Alchemist, 5 orders
-- ═══════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────
-- STEP 1: Ensure extension exists
-- ──────────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────────────────
-- STEP 2: Add RLS policy so the chatbot server-side function can read
--         orders (the Supabase client in ChatBot.jsx runs as the logged-in
--         user, so the existing "Owner can read orders" policy already
--         covers it — this is just a reminder comment, no change needed).
-- ──────────────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────────────
-- STEP 3: Create test auth users
--
-- Supabase's auth.users table is managed. We insert directly here
-- which works in the SQL Editor with service_role access.
-- Password for all test accounts: TestPass123!
-- (SHA-256 bcrypt stored by Supabase — set via Dashboard or use below)
-- ──────────────────────────────────────────────────────────────────────

-- Use fixed UUIDs so orders can reference them reliably
do $$
declare
  uid_kavya  uuid := 'a1b2c3d4-0001-0001-0001-000000000001';
  uid_rahul  uuid := 'a1b2c3d4-0002-0002-0002-000000000002';
  uid_priya  uuid := 'a1b2c3d4-0003-0003-0003-000000000003';
begin

  -- ── Insert into auth.users ────────────────────────────────────────
  -- These are test users. In production users are created via sign-up.
  insert into auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data,
    is_super_admin, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values
  (
    uid_kavya, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'kavya@verdebliss.test',
    crypt('TestPass123!', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Kavya Menon","skin_type":"Dry"}',
    '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    uid_rahul, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'rahul@verdebliss.test',
    crypt('TestPass123!', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Rahul Sharma","skin_type":"Oily"}',
    '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    uid_priya, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'priya@verdebliss.test',
    crypt('TestPass123!', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Priya Nair","skin_type":"Combination"}',
    '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  )
  on conflict (id) do nothing;

  -- ── Create / update profiles ──────────────────────────────────────
  insert into public.profiles (id, full_name, skin_type, points, tier, created_at, updated_at)
  values
    (uid_kavya, 'Kavya Menon',  'Dry',         620, 'Gold Botanist',       now() - interval '90 days', now()),
    (uid_rahul, 'Rahul Sharma', 'Oily',         85, 'Green Leaf',          now() - interval '30 days', now()),
    (uid_priya, 'Priya Nair',   'Combination', 1750,'Platinum Alchemist',   now() - interval '180 days', now())
  on conflict (id) do update
    set full_name  = excluded.full_name,
        skin_type  = excluded.skin_type,
        points     = excluded.points,
        tier       = excluded.tier,
        updated_at = now();

  raise notice 'Test users created: kavya@verdebliss.test | rahul@verdebliss.test | priya@verdebliss.test';

end $$;

-- ──────────────────────────────────────────────────────────────────────
-- STEP 4: Sample orders
-- ──────────────────────────────────────────────────────────────────────

-- Fetch product IDs for realistic order items
do $$
declare
  uid_kavya  uuid := 'a1b2c3d4-0001-0001-0001-000000000001';
  uid_rahul  uuid := 'a1b2c3d4-0002-0002-0002-000000000002';
  uid_priya  uuid := 'a1b2c3d4-0003-0003-0003-000000000003';

  kavya_addr jsonb := '{
    "name": "Kavya Menon",
    "line1": "Flat 4B, Green Heights",
    "line2": "Kharadi",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411014",
    "phone": "9876543210"
  }';

  rahul_addr jsonb := '{
    "name": "Rahul Sharma",
    "line1": "12, MG Road",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001",
    "phone": "9988776655"
  }';

  priya_addr jsonb := '{
    "name": "Priya Nair",
    "line1": "C-302, Sea View Apartments",
    "line2": "Bandra West",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400050",
    "phone": "9123456789"
  }';

begin

  -- ── Kavya's orders ────────────────────────────────────────────────
  -- Order 1: Delivered (oldest)
  insert into public.orders (user_id, status, total, points_earned, items, address, payment_id, created_at, updated_at)
  values (
    uid_kavya, 'Delivered', 4840, 484,
    '[
      {"id":"prod-bakuchiol","name":"Bakuchiol Renewal Serum","price":2850,"qty":1,"ingredient":"Bakuchiol","emoji":"🌿","bg_color":"#EBF0E9"},
      {"id":"prod-rosehip","name":"Rose Hip Glow Moisturiser","price":1990,"qty":1,"ingredient":"Rose Hip","emoji":"🌹","bg_color":"#F6EDE8"}
    ]'::jsonb,
    kavya_addr,
    'pay_test_Kav001Delivered',
    now() - interval '45 days',
    now() - interval '38 days'
  );

  -- Order 2: Shipped (recent)
  insert into public.orders (user_id, status, total, points_earned, items, address, payment_id, created_at, updated_at)
  values (
    uid_kavya, 'Shipped', 2450, 245,
    '[
      {"id":"prod-niacinamide","name":"Niacinamide Pore Serum","price":2450,"qty":1,"ingredient":"Niacinamide","emoji":"💧","bg_color":"#E8EFF5"}
    ]'::jsonb,
    kavya_addr,
    'pay_test_Kav002Shipped',
    now() - interval '5 days',
    now() - interval '3 days'
  );

  -- Order 3: Processing (latest)
  insert into public.orders (user_id, status, total, points_earned, items, address, payment_id, created_at, updated_at)
  values (
    uid_kavya, 'Processing', 3140, 314,
    '[
      {"id":"prod-spf","name":"Botanical SPF 50 Shield","price":2200,"qty":1,"ingredient":"Zinc Oxide","emoji":"☀️","bg_color":"#FFF8E8"},
      {"id":"prod-toner","name":"Green Tea Clarity Toner","price":940,"qty":1,"ingredient":"Green Tea","emoji":"🍃","bg_color":"#E8F2EA"}
    ]'::jsonb,
    kavya_addr,
    'pay_test_Kav003Processing',
    now() - interval '1 day',
    now() - interval '1 day'
  );

  -- ── Rahul's orders ────────────────────────────────────────────────
  -- Order 1: Processing (first order, new customer)
  insert into public.orders (user_id, status, total, points_earned, items, address, payment_id, created_at, updated_at)
  values (
    uid_rahul, 'Processing', 3700, 370,
    '[
      {"id":"prod-niacinamide","name":"Niacinamide Pore Serum","price":2450,"qty":1,"ingredient":"Niacinamide","emoji":"💧","bg_color":"#E8EFF5"},
      {"id":"prod-toner","name":"Green Tea Clarity Toner","price":1450,"qty":1,"ingredient":"Green Tea","emoji":"🍃","bg_color":"#E8F2EA"}
    ]'::jsonb,
    rahul_addr,
    'pay_test_Rah001Processing',
    now() - interval '2 days',
    now() - interval '2 days'
  );

  -- ── Priya's orders (Platinum customer) ────────────────────────────
  -- Order 1: Delivered
  insert into public.orders (user_id, status, total, points_earned, items, address, payment_id, created_at, updated_at)
  values (
    uid_priya, 'Delivered', 5740, 574,
    '[
      {"id":"prod-bakuchiol","name":"Bakuchiol Renewal Serum","price":2850,"qty":1,"ingredient":"Bakuchiol","emoji":"🌿","bg_color":"#EBF0E9"},
      {"id":"prod-nightcream","name":"Shea Butter Night Cream","price":2650,"qty":1,"ingredient":"Shea Butter","emoji":"🌙","bg_color":"#F5EBF0"},
      {"id":"prod-lip","name":"Wild Berry Lip Elixir","price":240,"qty":1,"ingredient":"Acai Berry","emoji":"🫐","bg_color":"#F0E8F5"}
    ]'::jsonb,
    priya_addr,
    'pay_test_Pri001Delivered',
    now() - interval '120 days',
    now() - interval '115 days'
  );

  -- Order 2: Delivered
  insert into public.orders (user_id, status, total, points_earned, items, address, payment_id, created_at, updated_at)
  values (
    uid_priya, 'Delivered', 4840, 484,
    '[
      {"id":"prod-bakuchiol","name":"Bakuchiol Renewal Serum","price":2850,"qty":1,"ingredient":"Bakuchiol","emoji":"🌿","bg_color":"#EBF0E9"},
      {"id":"prod-rosehip","name":"Rose Hip Glow Moisturiser","price":1990,"qty":1,"ingredient":"Rose Hip","emoji":"🌹","bg_color":"#F6EDE8"}
    ]'::jsonb,
    priya_addr,
    'pay_test_Pri002Delivered',
    now() - interval '90 days',
    now() - interval '83 days'
  );

  -- Order 3: Delivered
  insert into public.orders (user_id, status, total, points_earned, items, address, payment_id, created_at, updated_at)
  values (
    uid_priya, 'Delivered', 2200, 220,
    '[
      {"id":"prod-spf","name":"Botanical SPF 50 Shield","price":2200,"qty":1,"ingredient":"Zinc Oxide","emoji":"☀️","bg_color":"#FFF8E8"}
    ]'::jsonb,
    priya_addr,
    'pay_test_Pri003Delivered',
    now() - interval '60 days',
    now() - interval '54 days'
  );

  -- Order 4: Shipped
  insert into public.orders (user_id, status, total, points_earned, items, address, payment_id, created_at, updated_at)
  values (
    uid_priya, 'Shipped', 5300, 530,
    '[
      {"id":"prod-bakuchiol","name":"Bakuchiol Renewal Serum","price":2850,"qty":1,"ingredient":"Bakuchiol","emoji":"🌿","bg_color":"#EBF0E9"},
      {"id":"prod-niacinamide","name":"Niacinamide Pore Serum","price":2450,"qty":1,"ingredient":"Niacinamide","emoji":"💧","bg_color":"#E8EFF5"}
    ]'::jsonb,
    priya_addr,
    'pay_test_Pri004Shipped',
    now() - interval '8 days',
    now() - interval '6 days'
  );

  -- Order 5: Processing (latest)
  insert into public.orders (user_id, status, total, points_earned, items, address, payment_id, created_at, updated_at)
  values (
    uid_priya, 'Processing', 1250, 125,
    '[
      {"id":"prod-cleanser","name":"Turmeric Brightening Cleanser","price":1250,"qty":1,"ingredient":"Turmeric","emoji":"✨","bg_color":"#F5F0E4"}
    ]'::jsonb,
    priya_addr,
    'pay_test_Pri005Processing',
    now() - interval '6 hours',
    now() - interval '6 hours'
  );

  raise notice 'Orders created: 3 for Kavya, 1 for Rahul, 5 for Priya';

end $$;

-- ──────────────────────────────────────────────────────────────────────
-- STEP 5: Wishlist entries
-- ──────────────────────────────────────────────────────────────────────
insert into public.wishlist (user_id, product_id)
select
  'a1b2c3d4-0001-0001-0001-000000000001',
  id
from public.products
where name in ('Botanical SPF 50 Shield', 'Shea Butter Night Cream')
on conflict (user_id, product_id) do nothing;

insert into public.wishlist (user_id, product_id)
select
  'a1b2c3d4-0003-0003-0003-000000000003',
  id
from public.products
where name in ('Bakuchiol Renewal Serum', 'Green Tea Clarity Toner', 'Wild Berry Lip Elixir')
on conflict (user_id, product_id) do nothing;

-- ──────────────────────────────────────────────────────────────────────
-- STEP 6: Verify seed data
-- ──────────────────────────────────────────────────────────────────────
select
  p.full_name,
  p.tier,
  p.points,
  p.skin_type,
  count(o.id) as order_count,
  coalesce(sum(o.total), 0) as lifetime_spend
from public.profiles p
left join public.orders o on o.user_id = p.id
where p.id in (
  'a1b2c3d4-0001-0001-0001-000000000001',
  'a1b2c3d4-0002-0002-0002-000000000002',
  'a1b2c3d4-0003-0003-0003-000000000003'
)
group by p.id, p.full_name, p.tier, p.points, p.skin_type
order by lifetime_spend desc;