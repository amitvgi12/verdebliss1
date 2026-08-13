-- Audit remediation — 2026-08-13
--
-- VB-04  refunds: remove the client INSERT path entirely (order-ownership hole)
-- VB-11  finalize_commerce_order: credit points only when the ledger row inserts
-- VB-07  COD velocity/RTO controls backed by order history
-- VB-08  SPF slug no longer asserts an unsubstantiated "SPF 50" claim
--
-- Idempotent: safe to re-run.

-- ── VB-04 ────────────────────────────────────────────────────────────
-- The old policy checked `auth.uid() = user_id` but never that `order_id`
-- belonged to the caller, so any signed-in customer could POST straight to
-- PostgREST and open a refund against an arbitrary order — bypassing the
-- ownership + eligibility + duplicate checks in /api/refunds/request, the
-- rate limiter, and CSRF. Because `refunds_one_open_request_per_order_idx`
-- allows only one open request per order, that also let an attacker lock a
-- real customer out of refunding their own order.
--
-- Fix mirrors how `reviews` already works: no client INSERT path at all. The
-- API route writes with the service role, which bypasses RLS.
drop policy if exists "Owner can insert refund requests" on public.refunds;
revoke insert on public.refunds from anon, authenticated;

-- ── VB-07 ────────────────────────────────────────────────────────────
-- COD abuse controls need order history, which `assessCodRisk` (pure/sync)
-- cannot see. This function is the DB half: it counts recent COD orders for a
-- phone/email and reports prior failed deliveries (RTO) so the API can route
-- repeat or previously-failed buyers to manual verification.
--
-- Phone lives in orders.address->>'phone'; the expression index below keeps
-- this lookup cheap.
create index if not exists orders_cod_phone_created_idx
  on public.orders ((address->>'phone'), created_at desc)
  where payment_method = 'Cash on Delivery';

create index if not exists orders_cod_email_created_idx
  on public.orders ((address->>'email'), created_at desc)
  where payment_method = 'Cash on Delivery';

create or replace function public.check_cod_velocity(
  p_phone text,
  p_email text,
  p_window_days int default 30
) returns table(
  recent_orders int,
  open_orders int,
  failed_orders int
)
language sql
stable
security definer
set search_path = public
as $$
  with scoped as (
    select status
    from public.orders
    where payment_method = 'Cash on Delivery'
      and created_at > now() - make_interval(days => greatest(coalesce(p_window_days, 30), 1))
      and (
        (nullif(trim(coalesce(p_phone, '')), '') is not null
          and address->>'phone' = trim(p_phone))
        or
        (nullif(trim(coalesce(p_email, '')), '') is not null
          and lower(address->>'email') = lower(trim(p_email)))
      )
  )
  select
    count(*)::int as recent_orders,
    count(*) filter (
      where lower(coalesce(status, '')) not in ('delivered', 'cancelled', 'returned')
    )::int as open_orders,
    count(*) filter (
      where lower(coalesce(status, '')) in ('returned', 'rto', 'delivery failed', 'cancelled')
    )::int as failed_orders
  from scoped;
$$;

revoke all on function public.check_cod_velocity(text, text, int) from public, anon, authenticated;
grant execute on function public.check_cod_velocity(text, text, int) to service_role;

-- ── VB-08 ────────────────────────────────────────────────────────────
-- The product name and body copy were already walked back to "Botanical
-- Mineral Sun Shield" with "Independent SPF evidence is in review", but the
-- slug still asserted SPF 50 in the URL, the sitemap and every shared link.
-- next.config.ts adds a 301 from the old path.
update public.products
set slug = 'botanical-mineral-sun-shield',
    updated_at = now()
where slug = 'botanical-spf-50-shield';

-- ── VB-11 ────────────────────────────────────────────────────────────
-- Unchanged from the previous definition except the loyalty block at the end:
-- the ledger insert is `on conflict do nothing`, but profiles.points was
-- incremented unconditionally. A suppressed conflict therefore still credited
-- the balance, letting profiles.points drift above the sum of the ledger.
-- The balance is now credited only when the ledger row actually inserted.
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
  v_ledger_rows int;
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

    -- VB-11: credit the balance ONLY when the ledger row was actually written.
    -- A suppressed conflict must not move profiles.points, or the balance
    -- drifts above the sum of the ledger and can never be reconciled.
    get diagnostics v_ledger_rows = row_count;
    if v_ledger_rows > 0 then
      update public.profiles
      set points = points + v_points,
          tier = public.tier_for_points(points + v_points),
          updated_at = now()
      where id = p_user_id;

      points_awarded := true;
    end if;
  end if;

  order_id := v_order_id;
  idempotent := false;
  return next;
end;
$$;

revoke all on function public.finalize_commerce_order(uuid, text, text, text, text, text, jsonb, jsonb, numeric, numeric, numeric, int, boolean, jsonb) from public, anon, authenticated;
grant execute on function public.finalize_commerce_order(uuid, text, text, text, text, text, jsonb, jsonb, numeric, numeric, numeric, int, boolean, jsonb) to service_role;
