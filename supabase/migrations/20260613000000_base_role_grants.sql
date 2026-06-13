-- Base table privileges for Supabase default roles (anon, authenticated, service_role).
--
-- Resolves the persistent `supabase db diff` drift: the linked project carries
-- these standard platform grants, but the migration history never declared them,
-- so the migra shadow (built from migrations/) reported them as missing. This
-- migration captures them so the shadow matches the remote and the drift check
-- returns clean. On the live project these grants already exist, so applying this
-- migration is an idempotent no-op (re-granting an existing privilege does nothing).
--
-- This does NOT widen access. Security is enforced by Row Level Security (enabled
-- on every table in 20250101000000_initial_schema.sql) plus the owner/staff-scoped
-- policies. PostgREST requires the base role to hold the table grant before RLS is
-- evaluated at all; with it, RLS still decides which rows are visible:
--   * Owner-scoped tables key every policy on auth.uid(); anon has none -> 0 rows.
--   * Service-role-only tables (payment_events, checkout_sessions, …) have no
--     permissive policy, so anon/authenticated reach nothing; service_role bypasses RLS.
--
-- Privileges are explicit (select/insert/update/delete), never `grant all` — that
-- would also grant truncate/references/trigger (new drift) and re-grant the profiles
-- UPDATE that is intentionally column-scoped (see initial migration: revoke update +
-- grant update(full_name, avatar_url, skin_type, updated_at) to authenticated).

grant select, insert, update, delete on public.products to anon, authenticated, service_role;
grant select, insert, update, delete on public.orders to anon, authenticated, service_role;
grant select, insert, update, delete on public.order_items to anon, authenticated, service_role;
grant select, insert, update, delete on public.checkout_sessions to anon, authenticated, service_role;
grant select, insert, update, delete on public.payment_events to anon, authenticated, service_role;
grant select, insert, update, delete on public.payment_reconciliation_failures to anon, authenticated, service_role;
grant select, insert, update, delete on public.loyalty_ledger to anon, authenticated, service_role;
grant select, insert, update, delete on public.inventory_movements to anon, authenticated, service_role;
grant select, insert, update, delete on public.invoices to anon, authenticated, service_role;
grant select, insert, update, delete on public.wishlist to anon, authenticated, service_role;
grant select, insert, update, delete on public.addresses to anon, authenticated, service_role;
grant select, insert, update, delete on public.reviews to anon, authenticated, service_role;
grant select, insert, update, delete on public.refunds to anon, authenticated, service_role;
grant select, insert, update, delete on public.contact_tickets to anon, authenticated, service_role;
grant select, insert, update, delete on public.customer_consents to anon, authenticated, service_role;
grant select, insert, update, delete on public.api_rate_limits to anon, authenticated, service_role;
grant select, insert, update, delete on public.seller_config to anon, authenticated, service_role;

-- profiles: anon/authenticated get NO table-level UPDATE (kept column-scoped by the
-- initial migration's revoke + grant update(...)); only service_role gets table UPDATE.
grant select, insert, delete on public.profiles to anon, authenticated, service_role;
grant update on public.profiles to service_role;
