-- ════════════════════════════════════════════════════
--  VerdeBliss — Production-oriented Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Products: text IDs align with Next.js routes/cart IDs ───────────
create table public.products (
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

-- ── Profiles ────────────────────────────────────────
create table public.profiles (
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

-- ── Orders ───────────────────────────────────────────
create table public.orders (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references public.profiles on delete set null,
  status            text default 'Processing',
  subtotal          numeric(10,2) not null default 0,
  shipping          numeric(10,2) not null default 0,
  total             numeric(10,2) not null check (total >= 0),
  points_earned     int default 0 check (points_earned >= 0),
  items             jsonb not null,
  address           jsonb,
  payment_id        text,
  payment_order_id  text,
  payment_status    text default 'pending',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table public.order_items (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid not null references public.orders on delete cascade,
  product_id    text references public.products on delete set null,
  product_name  text not null,
  quantity      int not null check (quantity > 0),
  unit_price    numeric(10,2) not null check (unit_price >= 0),
  line_total    numeric(10,2) not null check (line_total >= 0),
  created_at    timestamptz default now()
);

create table public.payment_events (
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

create table public.loyalty_ledger (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles on delete cascade,
  order_id      uuid references public.orders on delete set null,
  event_type    text not null,
  points_delta  int not null,
  reason        text,
  created_at    timestamptz default now()
);

-- ── Wishlist ─────────────────────────────────────────
create table public.wishlist (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles on delete cascade,
  product_id  text references public.products on delete cascade,
  created_at  timestamptz default now(),
  unique(user_id, product_id)
);

-- ── Reviews: moderated before public display ─────────
create table public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  product_id  text references public.products on delete cascade,
  user_id     uuid references public.profiles on delete set null,
  rating      int check (rating between 1 and 5),
  title       text,
  body        text,
  approved    boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Addresses ────────────────────────────────────────
create table public.addresses (
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

-- ── Refunds ──────────────────────────────────────────
create table public.refunds (
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

-- ── Lead capture and consent ledger ──────────────────
create table public.contact_tickets (
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

create table public.customer_consents (
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

-- ── Staff helper ─────────────────────────────────────
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

-- ── Timestamp helpers ────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_products_updated_at before update on public.products
  for each row execute procedure public.touch_updated_at();
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute procedure public.touch_updated_at();
create trigger trg_orders_updated_at before update on public.orders
  for each row execute procedure public.touch_updated_at();
create trigger trg_reviews_updated_at before update on public.reviews
  for each row execute procedure public.touch_updated_at();
create trigger trg_refunds_updated_at before update on public.refunds
  for each row execute procedure public.touch_updated_at();
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

-- Public catalogue reads
create policy "Anyone can read active products" on public.products
  for select using (active = true);

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

-- Payment events and loyalty ledger are not public; customers can read their own loyalty entries.
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

-- ── Seed: products aligned to app route IDs ──────────
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
