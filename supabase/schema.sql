-- ════════════════════════════════════════════════════
--  VerdeBliss — Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Products ─────────────────────────────────────────
create table public.products (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  price       numeric(10,2) not null,
  category    text not null,
  skin_types  text[] default '{}',
  badges      text[] default '{}',
  ingredient  text,
  emoji       text,
  bg_color    text default '#EBF0E9',
  rating      numeric(3,2) default 4.5,
  review_count int default 0,
  stock       int default 100,
  created_at  timestamptz default now()
);

-- ── Profiles (extends Supabase auth.users) ───────────
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text,
  avatar_url  text,
  skin_type   text,
  points      int default 0,
  tier        text default 'Green Leaf',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Orders ───────────────────────────────────────────
create table public.orders (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles on delete set null,
  status      text default 'Processing',  -- Processing | Shipped | Delivered
  total       numeric(10,2) not null,
  points_earned int default 0,
  items       jsonb not null,             -- snapshot of cart items
  address     jsonb,
  payment_id  text,                       -- Razorpay payment ID
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Wishlist ─────────────────────────────────────────
create table public.wishlist (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.profiles on delete cascade,
  product_id uuid references public.products on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- ── Reviews ──────────────────────────────────────────
create table public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid references public.products on delete cascade,
  user_id     uuid references public.profiles on delete set null,
  rating      int check (rating between 1 and 5),
  body        text,
  created_at  timestamptz default now()
);

-- ── Addresses ────────────────────────────────────────
create table public.addresses (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.profiles on delete cascade,
  label      text default 'Home',
  line1      text not null,
  line2      text,
  city       text not null,
  state      text not null,
  pincode    text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- ── Row Level Security ───────────────────────────────
alter table public.products  enable row level security;
alter table public.profiles  enable row level security;
alter table public.orders    enable row level security;
alter table public.wishlist  enable row level security;
alter table public.reviews   enable row level security;
alter table public.addresses enable row level security;

-- Public read on products & reviews
create policy "Anyone can read products" on public.products for select using (true);
create policy "Anyone can read reviews"  on public.reviews  for select using (true);

-- Profiles: owner only
create policy "Owner can read profile"   on public.profiles for select using (auth.uid() = id);
create policy "Owner can update profile" on public.profiles for update using (auth.uid() = id);

-- Orders: owner only
create policy "Owner can read orders"   on public.orders for select using (auth.uid() = user_id);
create policy "Owner can insert orders" on public.orders for insert with check (auth.uid() = user_id);

-- Wishlist: owner only
create policy "Owner can manage wishlist" on public.wishlist for all using (auth.uid() = user_id);

-- Addresses: owner only
create policy "Owner can manage addresses" on public.addresses for all using (auth.uid() = user_id);

-- Reviews: owner insert, all read
create policy "Owner can insert review" on public.reviews for insert with check (auth.uid() = user_id);

-- ── Function: auto-create profile on signup ──────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Function: update points after order ──────────────
create or replace function public.add_loyalty_points(
  p_user_id uuid,
  p_points   int
) returns void language plpgsql security definer as $$
declare
  new_points int;
begin
  update public.profiles
  set    points = points + p_points,
         tier   = case
                    when points + p_points >= 1500 then 'Platinum Alchemist'
                    when points + p_points >= 500  then 'Gold Botanist'
                    else 'Green Leaf'
                  end,
         updated_at = now()
  where  id = p_user_id
  returning points into new_points;
end;
$$;

-- ── Seed: sample products ────────────────────────────
insert into public.products (name, description, price, category, skin_types, badges, ingredient, emoji, bg_color, rating, review_count) values
('Bakuchiol Renewal Serum',    'Plant-based retinol alternative for visible cell renewal without irritation.', 2850, 'Serum',       array['Dry','Combination'], array['Vegan','Organic Certified'], 'Bakuchiol',  '🌿', '#EBF0E9', 4.8, 124),
('Rose Hip Glow Moisturiser',  'Rich cloud-like hydration with rosehip oil and ceramides for lasting softness.', 1990, 'Moisturiser', array['Dry','Sensitive'],   array['Cruelty-Free','Vegan'],      'Rose Hip',   '🌹', '#F6EDE8', 4.7, 89),
('Green Tea Clarity Toner',    'Balance oil and refine pores with antioxidant-rich green tea extract.',         1450, 'Toner',       array['Oily','Combination'],array['Vegan','Organic Certified'], 'Green Tea',  '🍃', '#E8F2EA', 4.5, 67),
('Turmeric Brightening Cleanser','Gentle foam cleanser with turmeric and neem for a luminous complexion.',     1250, 'Cleanser',    array['All Types'],         array['Cruelty-Free','Organic Certified'], 'Turmeric', '✨', '#F5F0E4', 4.6, 103),
('Botanical SPF 50 Shield',    'Featherlight mineral sunscreen with zinc oxide and soothing aloe vera.',       2200, 'SPF',         array['All Types'],         array['Vegan','Cruelty-Free'],      'Zinc Oxide', '☀️', '#FFF8E8', 4.9, 215),
('Wild Berry Lip Elixir',      'Nourishing lip treatment with acai berry and shea for pillowy softness.',       890, 'Lip Care',    array['All Types'],         array['Vegan','Organic Certified'], 'Acai Berry', '🫐', '#F0E8F5', 4.4, 58),
('Niacinamide Pore Serum',     'Minimise pores and control sebum with a 10% niacinamide complex.',            2450, 'Serum',       array['Oily','Combination'],array['Vegan','Cruelty-Free'],      'Niacinamide','💧', '#E8EFF5', 4.7, 142),
('Shea Butter Night Cream',    'Intensive overnight repair with shea butter and vitamin E for morning glow.',  2650, 'Moisturiser', array['Dry','Sensitive'],   array['Organic Certified','Cruelty-Free'], 'Shea Butter','🌙','#F5EBF0', 4.8, 76);
