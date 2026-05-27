-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: align create_invoice_for_order() body with schema.sql
--
-- The previous migration (20260526000001) defined a shortened/uncommented
-- version of this function. The live DB was later updated directly via
-- schema.sql which has the full annotated body. This migration re-applies
-- the authoritative definition so the migration shadow DB matches production
-- and the schema-drift CI check passes.
-- ─────────────────────────────────────────────────────────────────────────────

set check_function_bodies = off;

create or replace function public.create_invoice_for_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tax_rate        constant numeric := 18;   -- 18% GST, HSN 33 cosmetics/personal care
  v_seller          record;
  v_place_of_supply text;
  v_supply_type     text;
  v_tax_amount      numeric;
  v_half_tax        numeric;
  v_tax_lines       jsonb;
begin
  -- ── 1. Load seller identity — fail closed if missing or incomplete ───
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

  -- ── 2. Determine supply type from seller vs buyer state ─────────────
  -- Intra-state (same state) → CGST + SGST
  -- Inter-state (different state) → IGST
  v_place_of_supply := coalesce(new.address->>'state', '');

  v_supply_type := case
    when lower(trim(v_place_of_supply)) = lower(trim(v_seller.state_name)) then 'intra_state'
    else 'inter_state'
  end;

  -- ── 3. Back-calculate GST from tax-inclusive storefront price ────────
  -- Formula: tax = inclusive_price × rate / (100 + rate)
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

  -- ── 4. Insert invoice with full seller identity snapshot ─────────────
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
  on conflict (order_id) do nothing;  -- safe for schema re-runs

  return new;
end;
$$;
