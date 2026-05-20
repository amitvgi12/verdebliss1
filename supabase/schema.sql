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
  rating        numeric(3,2) check (rating between 0 and 5),
  review_count  int default 0 check (review_count >= 0),
  stock         int default 100 check (stock >= 0),
  active           boolean default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  compliance_flags text[] default '{}'
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
alter table public.products add column if not exists rating numeric(3,2);
alter table public.products alter column rating drop default;
alter table public.products add column if not exists review_count int default 0;
alter table public.products add column if not exists stock int default 100;
alter table public.products add column if not exists active boolean default true;
alter table public.products add column if not exists created_at timestamptz default now();
alter table public.products add column if not exists updated_at timestamptz default now();
alter table public.products add column if not exists compliance_flags text[] default '{}';

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
  payment_method    text,
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
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists payment_status text default 'pending';
alter table public.orders add column if not exists created_at timestamptz default now();
alter table public.orders add column if not exists updated_at timestamptz default now();


-- Pending checkout session created before opening Razorpay. Verification and
-- webhooks use this server-owned snapshot instead of trusting browser cart data.
create table if not exists public.checkout_sessions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references public.profiles on delete set null,
  status              text not null default 'pending',
  razorpay_order_id   text not null,
  receipt             text,
  subtotal            numeric(10,2) not null default 0,
  shipping            numeric(10,2) not null default 0,
  total               numeric(10,2) not null default 0,
  amount_paise        int not null default 0,
  currency            text not null default 'INR',
  cart_snapshot       jsonb not null default '[]'::jsonb,
  address             jsonb not null default '{}'::jsonb,
  expires_at          timestamptz,
  completed_order_id  uuid references public.orders on delete set null,
  payment_id          text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.checkout_sessions add column if not exists user_id uuid references public.profiles on delete set null;
alter table public.checkout_sessions add column if not exists status text not null default 'pending';
alter table public.checkout_sessions add column if not exists razorpay_order_id text;
alter table public.checkout_sessions add column if not exists receipt text;
alter table public.checkout_sessions add column if not exists subtotal numeric(10,2) not null default 0;
alter table public.checkout_sessions add column if not exists shipping numeric(10,2) not null default 0;
alter table public.checkout_sessions add column if not exists total numeric(10,2) not null default 0;
alter table public.checkout_sessions add column if not exists amount_paise int not null default 0;
alter table public.checkout_sessions add column if not exists currency text not null default 'INR';
alter table public.checkout_sessions add column if not exists cart_snapshot jsonb not null default '[]'::jsonb;
alter table public.checkout_sessions add column if not exists address jsonb not null default '{}'::jsonb;
alter table public.checkout_sessions add column if not exists expires_at timestamptz;
alter table public.checkout_sessions add column if not exists completed_order_id uuid references public.orders on delete set null;
alter table public.checkout_sessions add column if not exists payment_id text;
alter table public.checkout_sessions add column if not exists created_at timestamptz default now();
alter table public.checkout_sessions add column if not exists updated_at timestamptz default now();

create unique index if not exists checkout_sessions_razorpay_order_unique_idx
  on public.checkout_sessions (razorpay_order_id)
  where razorpay_order_id is not null;
create unique index if not exists checkout_sessions_payment_id_unique_idx
  on public.checkout_sessions (payment_id)
  where payment_id is not null;
create index if not exists checkout_sessions_status_idx on public.checkout_sessions (status);

create unique index if not exists orders_payment_id_unique_idx
  on public.orders (payment_id)
  where payment_id is not null;
create unique index if not exists orders_payment_order_id_unique_idx
  on public.orders (payment_order_id)
  where payment_order_id is not null and payment_status = 'paid';

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


create index if not exists payment_events_provider_order_idx on public.payment_events (provider_order_id);
create index if not exists payment_events_provider_payment_idx on public.payment_events (provider_payment_id);
create unique index if not exists payment_events_unique_event_idx
  on public.payment_events (provider, provider_order_id, provider_payment_id, event_type)
  where provider_order_id is not null and provider_payment_id is not null;

create table if not exists public.loyalty_ledger (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles on delete cascade,
  order_id      uuid references public.orders on delete set null,
  event_type    text not null,
  points_delta  int not null,
  reason        text,
  created_at    timestamptz default now()
);

create unique index if not exists loyalty_ledger_order_event_unique_idx
  on public.loyalty_ledger (order_id, event_type)
  where order_id is not null;


create table if not exists public.inventory_movements (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid references public.orders on delete set null,
  product_id  text not null,
  quantity    int not null,
  movement    text not null,
  reason      text,
  created_at  timestamptz default now()
);

create index if not exists inventory_movements_order_idx on public.inventory_movements (order_id);
create index if not exists inventory_movements_product_idx on public.inventory_movements (product_id);

create table if not exists public.wishlist (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles on delete cascade,
  product_id  text not null,
  created_at  timestamptz default now(),
  unique(user_id, product_id)
);

create table if not exists public.reviews (
  id                 uuid primary key default uuid_generate_v4(),
  product_id         text not null,
  user_id            uuid references public.profiles on delete set null,
  order_item_id      uuid references public.order_items on delete set null,
  verified_purchase  boolean default false,
  rating             int check (rating between 1 and 5),
  title              text,
  body               text,
  approved           boolean default false,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

alter table public.reviews add column if not exists title text;
alter table public.reviews add column if not exists approved boolean default false;
alter table public.reviews add column if not exists updated_at timestamptz default now();
alter table public.reviews add column if not exists order_item_id uuid references public.order_items on delete set null;
alter table public.reviews add column if not exists verified_purchase boolean default false;
create unique index if not exists reviews_one_per_user_product_idx
  on public.reviews (user_id, product_id)
  where user_id is not null;

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


create unique index if not exists refunds_one_open_request_per_order_idx
  on public.refunds (order_id)
  where order_id is not null and status in ('requested','reviewing','approved');

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


create table if not exists public.api_rate_limits (
  key         text primary key,
  count       int not null default 0,
  reset_at    timestamptz not null,
  updated_at  timestamptz default now()
);

-- Webhook reconciliation DLQ. Razorpay sends a webhook, signature verifies, and
-- recordPaymentEvent succeeds — but completing the order fails (e.g. session
-- already completed, stock changed, transient DB error). The event is durably
-- captured here so an ops cron / admin UI can retry or investigate without
-- racing Razorpay's retry behaviour.
create table if not exists public.payment_reconciliation_failures (
  id                   uuid primary key default uuid_generate_v4(),
  provider             text not null default 'razorpay',
  event_type           text not null,
  provider_order_id    text,
  provider_payment_id  text,
  payload              jsonb default '{}',
  failure_reason       text,
  resolved             boolean default false,
  resolved_at          timestamptz,
  resolved_by          text,
  retry_count          int default 0,
  last_retry_at        timestamptz,
  created_at           timestamptz default now()
);

create index if not exists payment_reconciliation_failures_unresolved_idx
  on public.payment_reconciliation_failures (created_at)
  where resolved = false;
create index if not exists payment_reconciliation_failures_provider_payment_idx
  on public.payment_reconciliation_failures (provider_payment_id);



create or replace function public.check_api_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed boolean;
begin
  if p_limit <= 0 then
    return false;
  end if;

  insert into public.api_rate_limits (key, count, reset_at, updated_at)
  values (p_key, 1, now() + make_interval(secs => greatest(p_window_seconds, 1)), now())
  on conflict (key) do update set
    count = case
      when public.api_rate_limits.reset_at <= now() then 1
      else public.api_rate_limits.count + 1
    end,
    reset_at = case
      when public.api_rate_limits.reset_at <= now()
        then now() + make_interval(secs => greatest(p_window_seconds, 1))
      else public.api_rate_limits.reset_at
    end,
    updated_at = now()
  returning count <= p_limit into v_allowed;

  return coalesce(v_allowed, false);
end;
$$;

revoke all on function public.check_api_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.check_api_rate_limit(text, int, int) to service_role;

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

drop trigger if exists trg_checkout_sessions_updated_at on public.checkout_sessions;
create trigger trg_checkout_sessions_updated_at before update on public.checkout_sessions
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

-- ── Loyalty: tier rules in ONE place ─────────────────
-- Mirrored in lib/loyalty.ts (TS side). When you change a threshold here,
-- update the TS helper too. There's a regression test in tests/loyalty.test.ts.
create or replace function public.tier_for_points(p_points int)
returns text
language sql
immutable
as $$
  select case
    when coalesce(p_points, 0) >= 1500 then 'Platinum Alchemist'
    when coalesce(p_points, 0) >= 500 then 'Gold Botanist'
    else 'Green Leaf'
  end;
$$;

grant execute on function public.tier_for_points(int) to public, anon, authenticated, service_role;

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
      tier = public.tier_for_points(points + p_points),
      updated_at = now()
  where id = p_user_id;
end;
$$;

revoke all on function public.apply_loyalty_points(uuid, int) from public, anon, authenticated;
grant execute on function public.apply_loyalty_points(uuid, int) to service_role;


-- Keep customer-editable profile fields separate from loyalty/staff fields.
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (old.points is distinct from new.points)
     or (old.tier is distinct from new.tier)
     or (old.is_staff is distinct from new.is_staff) then
    if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
       and not public.is_staff() then
      raise exception 'Direct updates to profile points, tier, or staff status are not allowed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_protect_privileged_fields on public.profiles;
create trigger trg_profiles_protect_privileged_fields
  before update on public.profiles
  for each row execute procedure public.protect_profile_privileged_fields();

create or replace function public.update_profile_basics(
  p_full_name text,
  p_avatar_url text,
  p_skin_type text
) returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  update public.profiles
  set full_name = nullif(trim(p_full_name), ''),
      avatar_url = nullif(trim(p_avatar_url), ''),
      skin_type = nullif(trim(p_skin_type), ''),
      updated_at = now()
  where id = auth.uid()
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Profile not found';
  end if;

  return updated_profile;
end;
$$;

revoke all on function public.update_profile_basics(text, text, text) from public, anon;
grant execute on function public.update_profile_basics(text, text, text) to authenticated;

-- Atomic stock reservation used by the service-role checkout API. Product IDs
-- are compared as text so existing UUID product tables and text-ID installs are
-- both supported.
create or replace function public.reserve_inventory_for_order(
  p_order_id uuid,
  p_items jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  affected int;
begin
  for item in select * from jsonb_array_elements(p_items)
  loop
    update public.products
    set stock = stock - greatest((item->>'qty')::int, 0),
        updated_at = now()
    where id::text = item->>'id'
      and stock >= greatest((item->>'qty')::int, 0);

    get diagnostics affected = row_count;
    if affected = 0 then
      raise exception 'Insufficient stock for product %', item->>'id';
    end if;

    insert into public.inventory_movements (order_id, product_id, quantity, movement, reason)
    values (p_order_id, item->>'id', -greatest((item->>'qty')::int, 0), 'reserve', 'checkout');
  end loop;
end;
$$;

revoke all on function public.reserve_inventory_for_order(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.reserve_inventory_for_order(uuid, jsonb) to service_role;


-- Atomic order finalisation used by the service-role checkout API. This keeps
-- payment reconciliation, stock reservation, order line items, and loyalty
-- points inside one database transaction. If any step fails, Postgres rolls back
-- the entire function call.
create or replace function public.finalize_commerce_order(
  p_user_id uuid,
  p_status text,
  p_payment_status text,
  p_payment_method text,
  p_payment_id text,
  p_payment_order_id text,
  p_address jsonb,
  p_items jsonb,
  p_subtotal numeric,
  p_shipping numeric,
  p_total numeric,
  p_points_to_earn int,
  p_award_points boolean,
  p_raw_payment_payload jsonb
) returns table(order_id uuid, points_awarded boolean, idempotent boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_existing record;
  v_item jsonb;
  v_qty int;
  v_line_total numeric;
  v_provider text;
  v_points int := greatest(coalesce(p_points_to_earn, 0), 0);
  v_stock_rows int;
begin
  if coalesce(trim(p_payment_id), '') = '' then
    raise exception 'Payment id is required';
  end if;

  select id, coalesce(points_earned, 0) as points_earned
  into v_existing
  from public.orders
  where payment_id = p_payment_id
  limit 1;

  if v_existing.id is not null then
    order_id := v_existing.id;
    points_awarded := v_existing.points_earned > 0;
    idempotent := true;
    return next;
    return;
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order items are required';
  end if;

  insert into public.orders (
    user_id, status, subtotal, shipping, total, points_earned, items, address,
    payment_id, payment_order_id, payment_method, payment_status
  ) values (
    p_user_id,
    coalesce(nullif(trim(p_status), ''), 'Processing'),
    round(coalesce(p_subtotal, 0), 2),
    round(coalesce(p_shipping, 0), 2),
    round(coalesce(p_total, 0), 2),
    case when coalesce(p_award_points, false) and p_user_id is not null then v_points else 0 end,
    p_items,
    coalesce(p_address, '{}'::jsonb),
    p_payment_id,
    nullif(trim(coalesce(p_payment_order_id, '')), ''),
    nullif(trim(coalesce(p_payment_method, '')), ''),
    coalesce(nullif(trim(p_payment_status), ''), 'pending')
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(coalesce((v_item->>'qty')::int, 0), 0);
    if v_qty <= 0 then
      raise exception 'Invalid quantity for product %', v_item->>'id';
    end if;

    update public.products
    set stock = stock - v_qty,
        updated_at = now()
    where id::text = v_item->>'id'
      and stock >= v_qty;

    get diagnostics v_stock_rows = row_count;
    if v_stock_rows = 0 then
      raise exception 'Insufficient stock for product %', v_item->>'id';
    end if;

    v_line_total := round(coalesce((v_item->>'price')::numeric, 0) * v_qty, 2);

    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, line_total)
    values (
      v_order_id,
      v_item->>'id',
      coalesce(nullif(v_item->>'name', ''), 'Product'),
      v_qty,
      round(coalesce((v_item->>'price')::numeric, 0), 2),
      v_line_total
    );

    insert into public.inventory_movements (order_id, product_id, quantity, movement, reason)
    values (v_order_id, v_item->>'id', -v_qty, 'reserve', 'checkout_finalised');
  end loop;

  v_provider := case when lower(coalesce(p_payment_method, '')) = 'cash on delivery' then 'cod' else 'razorpay' end;

  insert into public.payment_events (
    order_id, provider, provider_order_id, provider_payment_id, event_type,
    amount, currency, verified, payload
  ) values (
    v_order_id,
    v_provider,
    nullif(trim(coalesce(p_payment_order_id, '')), ''),
    p_payment_id,
    coalesce(nullif(trim(p_payment_status), ''), 'pending'),
    round(coalesce(p_total, 0), 2),
    'INR',
    p_payment_status = 'paid',
    coalesce(p_raw_payment_payload, '{}'::jsonb)
  ) on conflict do nothing;

  points_awarded := false;
  if coalesce(p_award_points, false) and p_user_id is not null and v_points > 0 then
    insert into public.loyalty_ledger (user_id, order_id, event_type, points_delta, reason)
    values (p_user_id, v_order_id, 'order_payment_verified', v_points, 'Verified payment ' || p_payment_id)
    on conflict do nothing;

    update public.profiles
    set points = points + v_points,
        tier = public.tier_for_points(points + v_points),
        updated_at = now()
    where id = p_user_id;

    points_awarded := true;
  end if;

  order_id := v_order_id;
  idempotent := false;
  return next;
end;
$$;

revoke all on function public.finalize_commerce_order(uuid, text, text, text, text, text, jsonb, jsonb, numeric, numeric, numeric, int, boolean, jsonb) from public, anon, authenticated;
grant execute on function public.finalize_commerce_order(uuid, text, text, text, text, text, jsonb, jsonb, numeric, numeric, numeric, int, boolean, jsonb) to service_role;

-- Removed unsafe legacy RPC from prior versions.
drop function if exists public.increment_points(uuid, int);

-- ── Row Level Security ───────────────────────────────
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.checkout_sessions enable row level security;
alter table public.payment_events enable row level security;
alter table public.loyalty_ledger enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.wishlist enable row level security;
alter table public.reviews enable row level security;
alter table public.addresses enable row level security;
alter table public.refunds enable row level security;
alter table public.contact_tickets enable row level security;
alter table public.customer_consents enable row level security;
alter table public.api_rate_limits enable row level security;
alter table public.payment_reconciliation_failures enable row level security;

-- Drop previous and unsafe policy names before recreating hardened policies.
drop policy if exists "Anyone can view products" on public.products;
drop policy if exists "Anyone can read active products" on public.products;
drop policy if exists "Owner can read own profile" on public.profiles;
drop policy if exists "Owner can update own profile basics" on public.profiles;
drop policy if exists "Owner can update own permitted profile fields" on public.profiles;
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
drop policy if exists "Service role can insert verified pending reviews" on public.reviews;
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
-- Customers may update only columns granted below; privileged fields are also protected by trigger.
create policy "Owner can update own permitted profile fields" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id and is_staff = false);

revoke update on public.profiles from anon, authenticated;
grant update(full_name, avatar_url, skin_type, updated_at) on public.profiles to authenticated;

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

-- Reviews: only approved reviews are public. Review submissions go through
-- /api/reviews so the server can verify a matching order_item before insert.
create policy "Anyone can read approved reviews" on public.reviews
  for select using (approved = true or auth.uid() = user_id or public.is_staff());
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
    insert into public.products (id, slug, name, description, price, category, skin_types, badges, ingredient, emoji, bg_color, image_url, rating, review_count, stock, compliance_flags) values
    ('1', 'bakuchiol-renewal-serum', 'Bakuchiol Renewal Serum', 'Plant-based retinol alternative for visible cell renewal without irritation.', 250, 'Serum', array['Dry','Combination'], array['Vegan','Organic Certified'], 'Bakuchiol', '🌿', '#EBF0E9', '/images/products/serum.webp', null, 0, 100, array[]::text[]),
    ('2', 'rose-hip-glow-moisturiser', 'Rose Hip Glow Moisturiser', 'Rich cloud-like hydration with rosehip oil and ceramides for lasting softness.', 390, 'Moisturiser', array['Dry','Sensitive'], array['Cruelty-Free','Vegan'], 'Rose Hip', '🌹', '#F6EDE8', '/images/products/moisturiser.webp', null, 0, 100, array[]::text[]),
    ('3', 'green-tea-clarity-toner', 'Green Tea Clarity Toner', 'Balance oil and refine pores with antioxidant-rich green tea extract and 0.5% salicylic acid (BHA). Recommended for ages 12+.', 450, 'Toner', array['Oily','Combination'], array['Vegan','Organic Certified'], 'Green Tea', '🍃', '#E8F2EA', '/images/products/toner.webp', null, 0, 100, array['contains_bha','age_restricted_12plus','pregnancy_caution']),
    ('4', 'turmeric-brightening-cleanser', 'Turmeric Brightening Cleanser', 'Gentle foam cleanser with turmeric and neem for a luminous complexion.', 250, 'Cleanser', array['All Types'], array['Cruelty-Free','Organic Certified'], 'Turmeric', '✨', '#F5F0E4', '/images/products/cleanser.webp', null, 0, 100, array[]::text[]),
    ('5', 'botanical-spf-50-shield', 'Botanical SPF 50 Shield', 'Featherlight mineral sunscreen with zinc oxide and soothing aloe vera.', 220, 'SPF', array['All Types'], array['Vegan','Cruelty-Free'], 'Zinc Oxide', '☀️', '#FFF8E8', '/images/products/spf.webp', null, 0, 100, array[]::text[]),
    ('6', 'wild-berry-lip-elixir', 'Wild Berry Lip Elixir', 'Nourishing lip treatment with acai berry and shea for pillowy softness.', 490, 'Lip Care', array['All Types'], array['Vegan','Organic Certified'], 'Acai Berry', '🫐', '#F0E8F5', '/images/products/lip-elixir.webp', null, 0, 100, array[]::text[]),
    ('7', 'niacinamide-pore-serum', 'Niacinamide Pore Serum', 'Minimise pores and control sebum with a 10% niacinamide complex.', 350, 'Serum', array['Oily','Combination'], array['Vegan','Cruelty-Free'], 'Niacinamide', '💧', '#E8EFF5', '/images/products/niacinamide-serum.webp', null, 0, 100, array[]::text[]),
    ('8', 'shea-butter-night-cream', 'Shea Butter Night Cream', 'Intensive overnight repair with shea butter and vitamin E for morning glow.', 550, 'Moisturiser', array['Dry','Sensitive'], array['Organic Certified','Cruelty-Free'], 'Shea Butter', '🌙', '#F5EBF0', '/images/products/night-cream.webp', null, 0, 100, array[]::text[])
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
      compliance_flags = excluded.compliance_flags,
      active = true,
      updated_at = now();
  else
    raise notice 'Skipping static product seed because public.products.id is %, not text. Existing uuid products are preserved.', product_id_type;
  end if;
end $$;
