-- VerdeBliss production cleanup: remove deterministic seed reviews.
--
-- Run this only on the production Supabase project before launch if
-- seed_test_data.sql was ever executed against that project.

begin;

delete from public.reviews r
where exists (
    select 1
    from auth.users u
    where u.id = r.user_id
      and u.email like '%@verdebliss.test'
  )
  or r.body ilike '%without making my skin feel tight%'
  or r.body ilike '%My dry skin handled this serum well%'
  or r.body ilike '%Lightweight but nourishing%'
  or r.body ilike '%Comfortable mineral SPF%';

update public.products
   set rating = null,
       review_count = 0,
       updated_at = now();

update public.products p
   set rating = aggregates.rating,
       review_count = aggregates.review_count,
       updated_at = now()
  from (
    select
      product_id::text as product_id,
      round(avg(rating)::numeric, 2) as rating,
      count(*)::int as review_count
    from public.reviews
    where approved = true
    group by product_id
  ) aggregates
 where p.id::text = aggregates.product_id;

commit;

select
  product_id::text,
  rating,
  count(*) as approved_review_count
from public.reviews
where approved = true
group by product_id, rating
order by product_id;
