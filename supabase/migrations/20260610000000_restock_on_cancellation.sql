-- Restock inventory when an order is cancelled.
--
-- finalize_commerce_order decrements products.stock inside the order
-- transaction, but cancellation previously only flipped the order status —
-- every cancelled order permanently leaked stock downward (phantom
-- out-of-stock on a small catalogue).
--
-- Idempotency: a 'restock' inventory movement for the order marks it as
-- already restocked; calling this function twice is a no-op. Quantities are
-- read from order_items (written by finalize_commerce_order), never from
-- client input.
--
-- Callers:
--   - /api/orders/cancel for immediately-cancelled (unpaid/COD) orders.
--   - Staff tooling MUST call this when confirming a 'Cancellation Requested'
--     prepaid order, before or alongside the refund.

create or replace function public.restock_order_inventory(p_order_id uuid)
returns table(restocked boolean, lines int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_lines int := 0;
begin
  if p_order_id is null then
    raise exception 'Order id is required';
  end if;

  -- Already restocked → no-op (idempotent under webhook/route retries).
  if exists (
    select 1 from public.inventory_movements
    where order_id = p_order_id and movement = 'restock'
  ) then
    return query select false, 0;
    return;
  end if;

  for v_item in
    select product_id, quantity
    from public.order_items
    where order_id = p_order_id
  loop
    update public.products
    set stock = stock + v_item.quantity,
        updated_at = now()
    where id::text = v_item.product_id;

    insert into public.inventory_movements (order_id, product_id, quantity, movement, reason)
    values (p_order_id, v_item.product_id, v_item.quantity, 'restock', 'order_cancelled');

    v_lines := v_lines + 1;
  end loop;

  return query select v_lines > 0, v_lines;
end;
$$;

revoke all on function public.restock_order_inventory(uuid) from public, anon, authenticated;
grant execute on function public.restock_order_inventory(uuid) to service_role;
