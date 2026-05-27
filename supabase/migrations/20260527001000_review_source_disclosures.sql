-- Support honest launch review seeding through disclosed sampling and PR units.

alter table public.reviews add column if not exists review_source text;
alter table public.reviews add column if not exists source_disclosure text;

update public.reviews
   set review_source = case
     when verified_purchase is true then 'verified_purchase'
     else 'organic'
   end
 where review_source is null
    or trim(review_source) = ''
    or review_source not in ('verified_purchase', 'organic', 'sampling', 'pr_unit');

alter table public.reviews
  alter column review_source set default 'organic',
  alter column review_source set not null;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.reviews'::regclass
       and conname = 'reviews_review_source_check'
  ) then
    alter table public.reviews
      add constraint reviews_review_source_check
      check (review_source in ('verified_purchase', 'organic', 'sampling', 'pr_unit'))
      not valid;
  end if;
end $$;

alter table public.reviews validate constraint reviews_review_source_check;

create index if not exists reviews_approved_product_source_idx
  on public.reviews (product_id, review_source)
  where approved = true;
