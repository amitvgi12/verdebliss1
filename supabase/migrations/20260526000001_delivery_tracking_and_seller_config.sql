-- ─────────────────────────────────────────────────────────────
-- Migration: delivery tracking + seller_config + GST compliance
-- Applied:   2026-05-26
-- ─────────────────────────────────────────────────────────────

-- ── 1. Delivery tracking columns on orders ───────────────────
alter table public.orders add column if not exists tracking_id         text;
alter table public.orders add column if not exists courier_partner      text;
alter table public.orders add column if not exists tracking_url         text;
alter table public.orders add column if not exists estimated_delivery   date;
alter table public.orders add column if not exists shipped_at           timestamptz;
alter table public.orders add column if not exists out_for_delivery_at  timestamptz;
alter table public.orders add column if not exists delivered_at         timestamptz;

-- ── 2. Seller identity snapshot columns on invoices ──────────
alter table public.invoices add column if not exists seller_legal_name text;
alter table public.invoices add column if not exists seller_state       text;

-- ── 3. Canonical seller config (singleton) ───────────────────
create table if not exists public.seller_config (
  id              int         primary key default 1,
  legal_name      text        not null,
  gstin           text        not null,
  state_name      text        not null,
  address_line1   text,
  address_city    text,
  address_pincode text,
  updated_at      timestamptz default now(),
  constraint seller_config_singleton check (id = 1)
);

alter table public.seller_config add column if not exists legal_name      text;
alter table public.seller_config add column if not exists gstin            text;
alter table public.seller_config add column if not exists state_name       text;
alter table public.seller_config add column if not exists address_line1    text;
alter table public.seller_config add column if not exists address_city     text;
alter table public.seller_config add column if not exists address_pincode  text;
alter table public.seller_config add column if not exists updated_at       timestamptz default now();

alter table public.seller_config enable row level security;

-- ── 4. Rewritten invoice trigger (reads seller_config) ───────
set check_function_bodies = off;

create or replace function public.create_invoice_for_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tax_rate        constant numeric := 18;
  v_seller          record;
  v_place_of_supply text;
  v_supply_type     text;
  v_tax_amount      numeric;
  v_half_tax        numeric;
  v_tax_lines       jsonb;
begin
  select * into v_seller from public.seller_config where id = 1;

  if not found then
    raise exception
      'Invoice generation failed: seller_config has no row. '
      'Populate seller identity (legal name, GSTIN, state) before accepting orders.';
  end if;

  if coalesce(trim(v_seller.state_name), '') = '' then
    raise exception
      'Invoice generation failed: seller_config.state_name is empty. '
      'Set the seller GST registration state before accepting orders.';
  end if;

  if coalesce(trim(v_seller.gstin), '') = '' then
    raise exception
      'Invoice generation failed: seller_config.gstin is empty. '
      'Set the seller GSTIN before accepting orders.';
  end if;

  v_place_of_supply := coalesce(new.address->>'state', '');

  v_supply_type := case
    when lower(trim(v_place_of_supply)) = lower(trim(v_seller.state_name)) then 'intra_state'
    else 'inter_state'
  end;

  v_tax_amount := round(new.subtotal * v_tax_rate / (100 + v_tax_rate), 2);

  if v_supply_type = 'intra_state' then
    v_half_tax  := round(v_tax_amount / 2, 2);
    v_tax_lines := jsonb_build_array(
      jsonb_build_object('type', 'CGST', 'rate', v_tax_rate / 2, 'amount', v_half_tax),
      jsonb_build_object('type', 'SGST', 'rate', v_tax_rate / 2, 'amount', v_tax_amount - v_half_tax)
    );
  else
    v_tax_lines := jsonb_build_array(
      jsonb_build_object('type', 'IGST', 'rate', v_tax_rate, 'amount', v_tax_amount)
    );
  end if;

  insert into public.invoices (
    order_id, invoice_number, invoice_date,
    subtotal, tax_amount, shipping, total,
    tax_lines, supply_type, place_of_supply,
    seller_gstin, seller_legal_name, seller_state,
    status
  ) values (
    new.id,
    public.generate_invoice_number(),
    coalesce(new.created_at, now()),
    new.subtotal,
    v_tax_amount,
    new.shipping,
    new.total,
    v_tax_lines,
    v_supply_type,
    nullif(trim(v_place_of_supply), ''),
    v_seller.gstin,
    v_seller.legal_name,
    v_seller.state_name,
    'issued'
  )
  on conflict (order_id) do nothing;

  return new;
end;
$$;
