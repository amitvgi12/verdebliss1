# Launch Review Seeding Plan

Goal: every launch PDP should have real customer evidence, without synthetic copy, employee reviews, or undisclosed incentives.

## Targets

- Minimum launch gate: at least 1 approved review on every active launch SKU.
- Preferred launch bar: 3 approved reviews per active SKU before public launch.
- Hero SKU bar: 5 approved reviews each for Bakuchiol Renewal Serum, Rose Hip Glow Moisturiser, Botanical Mineral Sun Shield, and Niacinamide Pore Serum.
- Review mix: at least 60% verified-purchase reviews; no more than 40% combined sampling or PR-unit reviews on any PDP.

## Sampling Units

- Recruit 5 opted-in testers per SKU from waitlist, repeat buyers, and newsletter subscribers.
- Ship each tester a real order record with a zero-value or 100% discount comp payment trail, normalized `order_items`, and fulfilment status.
- Wait an appropriate use window before inviting review:
  - Cleanser, toner, SPF, lip care: 7 to 10 days.
  - Serum, moisturiser, night cream: 14 to 21 days.
- Ask for honest experience, skin type, usage duration, and texture/finish feedback. Do not request a positive review or a minimum star rating.
- Store published reviews as `review_source = 'sampling'` with a disclosure such as `Sample provided for honest feedback`.

## PR Units

- Send PR units only to creators, editors, or professional reviewers who agree to disclose the sample.
- Use PR reviews sparingly on PDPs; social/press quotes can live off-PDP unless they are first-party review submissions.
- Store published PR reviews as `review_source = 'pr_unit'` with a disclosure such as `PR sample provided; no rating requirement`.
- Do not publish staff, founder, agency, family, or vendor reviews.

## Moderation Rules

- Moderate for safety, profanity, private data, unsupported medical claims, and duplicate submissions.
- Do not rewrite sentiment, star rating, product outcome, or comparison claims.
- Do not hide low-star reviews solely because they are negative.
- Keep product schema honest: `aggregateRating` appears only from approved reviews already stored in Supabase.

## Launch Checklist

1. Run sampling and PR fulfilment as real orders or traceable comp orders.
2. Import or approve reviews only after consent and disclosure are captured.
3. Run `LAUNCH_MODE=true npm test -- tests/launch-gates.test.ts` with Supabase admin env vars.
4. Confirm every active launch SKU meets `LAUNCH_MIN_APPROVED_REVIEWS_PER_PRODUCT` or raise that env value to the stricter target before launch.
5. Keep `supabase/purge_seeded_reviews.sql` available for removing deterministic test reviews if they were ever run against production.

## Coverage Query

```sql
select
  p.id,
  p.name,
  count(r.id) filter (where r.approved = true) as approved_reviews,
  count(r.id) filter (where r.approved = true and r.review_source = 'verified_purchase') as verified_purchase_reviews,
  count(r.id) filter (where r.approved = true and r.review_source in ('sampling', 'pr_unit')) as disclosed_sample_reviews
from public.products p
left join public.reviews r on r.product_id::text = p.id::text
where p.active = true
group by p.id, p.name
order by approved_reviews asc, p.name asc;
```
