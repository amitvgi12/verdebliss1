-- Order lifecycle side-effects, enforced in the database so every writer —
-- the staff API route, the Supabase dashboard, and the payment webhook — gets
-- the same behaviour.
--
--   1. Delivered COD order  → payment_status 'paid' (cash collected), delivered_at stamped.
--      Previously a delivered COD order stayed 'cod_pending' forever, so revenue
--      reconciliation never saw it and the COD loyalty points the checkout
--      promised ("pointsPending") were never credited.
--   2. payment_status enters 'paid' after placement (COD delivered, or a Razorpay
--      payment that was only 'authorized' at checkout and is later captured)
--      → award the order's points once. Uses the same ledger event type as
--      finalize_commerce_order, so the (order_id, event_type) unique index makes
--      a double credit impossible.
--   3. Order moves to Cancelled / Refunded with points already credited
--      → reverse them once ('order_points_reversed'). Closes the
--      pay → earn → cancel loop that inflated tiers.
--
-- Also hardens protect_profile_privileged_fields, which the points writes above
-- (and finalize_commerce_order) pass through. See the note on that function.

-- ── Profile guard ────────────────────────────────────────────────────────────
-- The guard recognised the service role only through the legacy
-- `request.jwt.claim.role` GUC. PostgREST v10+ publishes claims only as the
-- `request.jwt.claims` JSON, so read both (the same fallback Supabase's own
-- auth.role() uses). Direct database sessions (dashboard / SQL editor, which
-- connect as postgres or supabase_admin, never through PostgREST's
-- `authenticator`) are trusted: they can already disable this trigger.
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_role text := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
begin
  if (old.points is distinct from new.points)
     or (old.tier is distinct from new.tier)
     or (old.is_staff is distinct from new.is_staff) then
    if session_user not in ('postgres', 'supabase_admin')
       and v_request_role <> 'service_role'
       and not public.is_staff() then
      raise exception 'Direct updates to profile points, tier, or staff status are not allowed';
    end if;
  end if;
  return new;
end;
$$;

-- ── Order lifecycle ──────────────────────────────────────────────────────────
create or replace function public.apply_order_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points int;
  v_ledger_rows int;
  v_balance int;
begin
  -- 1) Delivery.
  if new.status is distinct from old.status and new.status = 'Delivered' then
    new.delivered_at := coalesce(new.delivered_at, now());
    if new.payment_method = 'Cash on Delivery'
       and new.payment_status in ('cod_pending', 'cod_review') then
      new.payment_status := 'paid';
    end if;
  end if;

  -- 2) Award points when payment is confirmed after placement.
  if new.payment_status = 'paid'
     and old.payment_status is distinct from 'paid'
     and new.user_id is not null
     and coalesce(new.points_earned, 0) = 0
     and coalesce(new.status, '') not in ('Cancelled', 'Refunded') then
    v_points := greatest(floor(coalesce(new.subtotal, 0) / 20)::int, 0);
    if v_points > 0 then
      insert into public.loyalty_ledger (user_id, order_id, event_type, points_delta, reason)
      values (
        new.user_id,
        new.id,
        'order_payment_verified',
        v_points,
        'Payment confirmed after ' || coalesce(old.payment_status, 'placement')
      )
      on conflict do nothing;

      -- Credit only when the ledger row was written (mirrors VB-11).
      get diagnostics v_ledger_rows = row_count;
      if v_ledger_rows > 0 then
        update public.profiles
        set points = points + v_points,
            tier = public.tier_for_points(points + v_points),
            updated_at = now()
        where id = new.user_id;
        new.points_earned := v_points;
      end if;
    end if;
  end if;

  -- 3) Reverse credited points on cancellation / refund.
  if new.status is distinct from old.status
     and new.status in ('Cancelled', 'Refunded')
     and new.user_id is not null
     and coalesce(new.points_earned, 0) > 0 then
    insert into public.loyalty_ledger (user_id, order_id, event_type, points_delta, reason)
    values (
      new.user_id,
      new.id,
      'order_points_reversed',
      -new.points_earned,
      'Order ' || lower(new.status)
    )
    on conflict do nothing;

    get diagnostics v_ledger_rows = row_count;
    if v_ledger_rows > 0 then
      select greatest(points - new.points_earned, 0) into v_balance
      from public.profiles
      where id = new.user_id;

      update public.profiles
      set points = coalesce(v_balance, 0),
          tier = public.tier_for_points(coalesce(v_balance, 0)),
          updated_at = now()
      where id = new.user_id;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.apply_order_lifecycle() from public, anon, authenticated;

drop trigger if exists trg_orders_lifecycle on public.orders;
create trigger trg_orders_lifecycle
  before update of status, payment_status on public.orders
  for each row execute procedure public.apply_order_lifecycle();
