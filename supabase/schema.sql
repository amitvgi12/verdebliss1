-- ════════════════════════════════════════════════════
--  VerdeBliss — Idempotent Production Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor
--
--  Safe to run multiple times on an existing project.
--  It uses CREATE TABLE IF NOT EXISTS, ALTER TABLE ADD COLUMN IF NOT EXISTS,
--  DROP POLICY IF EXISTS, and DROP TRIGGER IF EXISTS to avoid duplicate-object
--  failures such as: relation "products" already exists.
-- ════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Core tables ─────────────────────────────────────
-- New installs use text product IDs to match static route/cart IDs.
-- Existing projects with uuid product IDs are preserved; the app checkout API
-- supports both uuid DB product IDs and static text fallback IDs.
create table if not exists public.products (
  id            text primary key,
  slug          text unique,
  name          text not null,
  description   text,
  price         numeric(10,2) not null check (price >= 0),
  category      text not null,
  skin_types    text[] default '{}',
  badges        text[] default '{}',
  ingredient    text,
  emoji         text,
  bg_color      text default '#EBF0E9',
  image_url     text,
  rating        numeric(3,2) default 4.5 check (rating between 0 and 5),
  review_count  int default 0 check (review_count >= 0),
  stock         int default 100 check (stock >= 0),
  active        boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.products add column if not exists slug text;
alter table public.products add column if not exists description text;
alter table public.products add column if not exists price numeric(10,2);
alter table public.products add column if not exists category text;
alter table public.products add column if not exists skin_types text[] default '{}';
alter table public.products add column if not exists badges text[] default '{}';
alter table public.products add column if not exists ingredient text;
alter table public.products add column if not exists emoji text;
alter table public.products add column if not exists bg_color text default '#EBF0E9';
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists rating numeric(3,2) default 4.5;
alter table public.products add column if not exists review_count int default 0;
alter table public.products add column if not exists stock int default 100;
alter table public.products add column if not exists active boolean default true;
alter table public.products add column if not exists created_at timestamptz default now();
alter table public.products add column if not exists updated_at timestamptz default now();

create unique index if not exists products_slug_unique_idx on public.products (slug) where slug is not null;
create index if not exists products_active_idx on public.products (active);

create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text,
  avatar_url  text,
  skin_type   text,
  points      int default 0 check (points >= 0),
  tier        text default 'Green Leaf',
  is_staff    boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists skin_type text;
alter table public.profiles add column if not exists points int default 0;
alter table public.profiles add column if not exists tier text default 'Green Leaf';
alter table public.profiles add column if not exists is_staff boolean default false;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

create table if not exists public.orders (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references public.profiles on delete set null,
  status            text default 'Processing',
  subtotal          numeric(10,2) not null default 0,
  shipping          numeric(10,2) not null default 0,
  total             numeric(10,2) not null check (total >= 0),
  points_earned     int default 0 check (points_earned >= 0),
  items             jsonb not null default '[]'::jsonb,
  address           jsonb,
  payment_id        text,
  payment_order_id  text,
  payment_status    text default 'pending',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.orders add column if not exists user_id uuid references public.profiles on delete set null;
alter table public.orders add column if not exists status text default 'Processing';
alter table public.orders add column if not exists subtotal numeric(10,2) not null default 0;
alter table public.orders add column if not exists shipping numeric(10,2) not null default 0;
alter table public.orders add column if not exists total numeric(10,2) not null default 0;
alter table public.orders add column if not exists points_earned int default 0;
alter table public.orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists address jsonb;
alter table public.orders add column if not exists payment_id text;
alter table public.orders add column if not exists payment_order_id text;
alter table public.orders add column if not exists payment_status text default 'pending';
alter table public.orders add column if not exists created_at timestamptz default now();
alter table public.orders add column if not exists updated_at timestamptz default now();

create table if not exists public.order_items (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid not null references public.orders on delete cascade,
  product_id    text,
  product_name  text not null,
  quantity      int not null check (quantity > 0),
  unit_price    numeric(10,2) not null check (unit_price >= 0),
  line_total    numeric(10,2) not null check (line_total >= 0),
  created_at    timestamptz default now()
);

-- If an older order_items.product_id was created as uuid or with a product FK,
-- make it flexible enough to store either DB uuid IDs or static text fallback IDs.
do $$
declare
  fk record;
begin
  for fk in
    select conname
    from pg_constraint
    where conrelid = 'public.order_items'::regclass
      and contype = 'f'
      and pg_get_constraintdef(oid) ilike '%product_id%'
  loop
    execute format('alter table public.order_items drop constraint if exists %I', fk.conname);
  end loop;
end $$;

alter table public.order_items add column if not exists product_id text;
alter table public.order_items alter column product_id type text using product_id::text;
alter table public.order_items add column if not exists product_name text;
alter table public.order_items add column if not exists quantity int default 1;
alter table public.order_items add column if not exists unit_price numeric(10,2) default 0;
alter table public.order_items add column if not exists line_total numeric(10,2) default 0;
alter table public.order_items add column if not exists created_at timestamptz default now();

create table if not exists public.payment_events (
  id                   uuid primary key default uuid_generate_v4(),
  order_id             uuid references public.orders on delete cascade,
  provider             text not null,
  provider_order_id    text,
  provider_payment_id  text,
  event_type           text not null,
  amount               numeric(10,2),
  currency             text default 'INR',
  verified             boolean default false,
  payload              jsonb default '{}',
  created_at           timestamptz default now()
);

create table if not exists public.loyalty_ledger (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles on delete cascade,
  order_id      uuid references public.orders on delete set null,
  event_type    text not null,
  points_delta  int not null,
  reason        text,
  created_at    timestamptz default now()
);

create table if not exists public.wishlist (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles on delete cascade,
  product_id  text not null,
  created_at  timestamptz default now(),
  unique(user_id, product_id)
);

create table if not exists public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  product_id  text not null,
  user_id     uuid references public.profiles on delete set null,
  rating      int check (rating between 1 and 5),
  title       text,
  body        text,
  approved    boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.reviews add column if not exists title text;
alter table public.reviews add column if not exists approved boolean default false;
alter table public.reviews add column if not exists updated_at timestamptz default now();

create table if not exists public.addresses (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles on delete cascade,
  label       text default 'Home',
  line1       text not null,
  line2       text,
  city        text not null,
  state       text not null,
  pincode     text not null,
  is_default  boolean default false,
  created_at  timestamptz default now()
);

create table if not exists public.refunds (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles on delete set null,
  order_id    uuid references public.orders on delete set null,
  reason      text not null,
  details     jsonb default '{}',
  status      text default 'requested',
  response    text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.refunds add column if not exists details jsonb default '{}';
alter table public.refunds add column if not exists response text;
alter table public.refunds add column if not exists updated_at timestamptz default now();

create table if not exists public.contact_tickets (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text not null,
  topic       text default 'Other',
  message     text not null,
  source      text default 'website_contact_form',
  status      text default 'new',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists public.customer_consents (
  id            uuid primary key default uuid_generate_v4(),
  email         text not null,
  consent_type  text not null,
  source        text,
  consented     boolean default true,
  consented_at  timestamptz default now(),
  revoked_at    timestamptz,
  created_at    timestamptz default now(),
  unique(email, consent_type)
);

-- ── Helper functions ────────────────────────────────
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_staff = true
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── Triggers: dropped first so schema.sql is re-runnable ────────────
drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at before update on public.products
  for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders
  for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_reviews_updated_at on public.reviews;
create trigger trg_reviews_updated_at before update on public.reviews
  for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_refunds_updated_at on public.refunds;
create trigger trg_refunds_updated_at before update on public.refunds
  for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_contact_tickets_updated_at on public.contact_tickets;
create trigger trg_contact_tickets_updated_at before update on public.contact_tickets
  for each row execute procedure public.touch_updated_at();

-- ── Auto-create profile on signup ────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, skin_type)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'skin_type'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Loyalty update: server/service-role only ─────────
create or replace function public.apply_loyalty_points(
  p_user_id uuid,
  p_points int
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_points <= 0 then
    return;
  end if;

  update public.profiles
  set points = points + p_points,
      tier = case
        when points + p_points >= 1500 then 'Platinum Alchemist'
        when points + p_points >= 500 then 'Gold Botanist'
        else 'Green Leaf'
      end,
      updated_at = now()
  where id = p_user_id;
end;
$$;

revoke all on function public.apply_loyalty_points(uuid, int) from public, anon, authenticated;
grant execute on function public.apply_loyalty_points(uuid, int) to service_role;

-- Removed unsafe legacy RPC from prior versions.
drop function if exists public.increment_points(uuid, int);

-- ── Row Level Security ───────────────────────────────
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_events enable row level security;
alter table public.loyalty_ledger enable row level security;
alter table public.wishlist enable row level security;
alter table public.reviews enable row level security;
alter table public.addresses enable row level security;
alter table public.refunds enable row level security;
alter table public.contact_tickets enable row level security;
alter table public.customer_consents enable row level security;

-- Drop previous and unsafe policy names before recreating hardened policies.
drop policy if exists "Anyone can view products" on public.products;
drop policy if exists "Anyone can read active products" on public.products;
drop policy if exists "Owner can read own profile" on public.profiles;
drop policy if exists "Owner can update own profile basics" on public.profiles;
drop policy if exists "Authenticated users can create orders" on public.orders;
drop policy if exists "Authenticated users can view their own orders" on public.orders;
drop policy if exists "Owner can read own orders" on public.orders;
drop policy if exists "Owner can read own order items" on public.order_items;
drop policy if exists "Owner can read own loyalty ledger" on public.loyalty_ledger;
drop policy if exists "Owner can manage wishlist" on public.wishlist;
drop policy if exists "Owner can manage addresses" on public.addresses;
drop policy if exists "Anyone can view reviews" on public.reviews;
drop policy if exists "Anyone can read approved reviews" on public.reviews;
drop policy if exists "Authenticated users can create reviews" on public.reviews;
drop policy if exists "Owner can insert pending review" on public.reviews;
drop policy if exists "Staff can moderate reviews" on public.reviews;
drop policy if exists "Owner can read refunds" on public.refunds;
drop policy if exists "Owner can insert refund requests" on public.refunds;
drop policy if exists "Owner can update refunds status by staff" on public.refunds;
drop policy if exists "Staff can update refund workflow" on public.refunds;

-- Public catalogue reads
create policy "Anyone can read active products" on public.products
  for select using (coalesce(active, true) = true);

-- Profiles: owner only; staff can read/update operationally
create policy "Owner can read own profile" on public.profiles
  for select using (auth.uid() = id or public.is_staff());
create policy "Owner can update own profile basics" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id and is_staff = false);

-- Orders/order items: customers can read their own orders only. Inserts happen through service-role API.
create policy "Owner can read own orders" on public.orders
  for select using (auth.uid() = user_id or public.is_staff());
create policy "Owner can read own order items" on public.order_items
  for select using (exists (
    select 1 from public.orders o where o.id = order_items.order_id and (o.user_id = auth.uid() or public.is_staff())
  ));

-- Payment events are service-role only. Customers can read their own loyalty ledger entries.
create policy "Owner can read own loyalty ledger" on public.loyalty_ledger
  for select using (auth.uid() = user_id or public.is_staff());

-- Wishlist and addresses: owner only
create policy "Owner can manage wishlist" on public.wishlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owner can manage addresses" on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reviews: only approved reviews are public; customers can insert pending reviews.
create policy "Anyone can read approved reviews" on public.reviews
  for select using (approved = true or auth.uid() = user_id or public.is_staff());
create policy "Owner can insert pending review" on public.reviews
  for insert with check (auth.uid() = user_id and approved = false);
create policy "Staff can moderate reviews" on public.reviews
  for update using (public.is_staff()) with check (public.is_staff());

-- Refunds: customers insert/read own requests; only staff/service can update statuses.
create policy "Owner can read refunds" on public.refunds
  for select using (auth.uid() = user_id or public.is_staff());
create policy "Owner can insert refund requests" on public.refunds
  for insert with check (auth.uid() = user_id and status = 'requested');
create policy "Staff can update refund workflow" on public.refunds
  for update using (public.is_staff()) with check (public.is_staff());

-- Contact and consent tables are service-role managed by API routes.

-- ── Seed: only for fresh/text-ID product tables ─────────────────────
-- Existing projects with uuid product IDs are intentionally not overwritten.
do $$
declare
  product_id_type text;
begin
  select data_type into product_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'products'
    and column_name = 'id';

  if product_id_type in ('text', 'character varying') then
    insert into public.products (id, slug, name, description, price, category, skin_types, badges, ingredient, emoji, bg_color, image_url, rating, review_count, stock) values
    ('1', 'bakuchiol-renewal-serum', 'Bakuchiol Renewal Serum', 'Plant-based retinol alternative for visible cell renewal without irritation.', 2850, 'Serum', array['Dry','Combination'], array['Vegan','Organic Certified'], 'Bakuchiol', '🌿', '#EBF0E9', '/images/products/serum.webp', 4.8, 124, 100),
    ('2', 'rose-hip-glow-moisturiser', 'Rose Hip Glow Moisturiser', 'Rich cloud-like hydration with rosehip oil and ceramides for lasting softness.', 1990, 'Moisturiser', array['Dry','Sensitive'], array['Cruelty-Free','Vegan'], 'Rose Hip', '🌹', '#F6EDE8', '/images/products/moisturiser.webp', 4.7, 89, 100),
    ('3', 'green-tea-clarity-toner', 'Green Tea Clarity Toner', 'Balance oil and refine pores with antioxidant-rich green tea extract.', 1450, 'Toner', array['Oily','Combination'], array['Vegan','Organic Certified'], 'Green Tea', '🍃', '#E8F2EA', '/images/products/toner.webp', 4.5, 67, 100),
    ('4', 'turmeric-brightening-cleanser', 'Turmeric Brightening Cleanser', 'Gentle foam cleanser with turmeric and neem for a luminous complexion.', 1250, 'Cleanser', array['All Types'], array['Cruelty-Free','Organic Certified'], 'Turmeric', '✨', '#F5F0E4', '/images/products/cleanser.webp', 4.6, 103, 100),
    ('5', 'botanical-spf-50-shield', 'Botanical SPF 50 Shield', 'Featherlight mineral sunscreen with zinc oxide and soothing aloe vera.', 2200, 'SPF', array['All Types'], array['Vegan','Cruelty-Free'], 'Zinc Oxide', '☀️', '#FFF8E8', '/images/products/spf.webp', 4.9, 215, 100),
    ('6', 'wild-berry-lip-elixir', 'Wild Berry Lip Elixir', 'Nourishing lip treatment with acai berry and shea for pillowy softness.', 890, 'Lip Care', array['All Types'], array['Vegan','Organic Certified'], 'Acai Berry', '🫐', '#F0E8F5', '/images/products/lip-elixir.webp', 4.4, 58, 100),
    ('7', 'niacinamide-pore-serum', 'Niacinamide Pore Serum', 'Minimise pores and control sebum with a 10% niacinamide complex.', 2450, 'Serum', array['Oily','Combination'], array['Vegan','Cruelty-Free'], 'Niacinamide', '💧', '#E8EFF5', '/images/products/niacinamide-serum.webp', 4.7, 142, 100),
    ('8', 'shea-butter-night-cream', 'Shea Butter Night Cream', 'Intensive overnight repair with shea butter and vitamin E for morning glow.', 2650, 'Moisturiser', array['Dry','Sensitive'], array['Organic Certified','Cruelty-Free'], 'Shea Butter', '🌙', '#F5EBF0', '/images/products/night-cream.webp', 4.8, 76, 100)
    on conflict (id) do update set
      slug = excluded.slug,
      name = excluded.name,
      description = excluded.description,
      price = excluded.price,
      category = excluded.category,
      skin_types = excluded.skin_types,
      badges = excluded.badges,
      ingredient = excluded.ingredient,
      emoji = excluded.emoji,
      bg_color = excluded.bg_color,
      image_url = excluded.image_url,
      rating = excluded.rating,
      review_count = excluded.review_count,
      stock = excluded.stock,
      active = true,
      updated_at = now();
  else
    raise notice 'Skipping static product seed because public.products.id is %, not text. Existing uuid products are preserved.', product_id_type;
  end if;
end $$;
