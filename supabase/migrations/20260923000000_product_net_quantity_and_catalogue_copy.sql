-- 1) Declared net quantity per product.
--
-- The PDP previously hardcoded "30ml" for every product (including the lip
-- balm and cleanser) — a Legal Metrology (Packaged Commodities) mis-declaration.
-- The value now comes only from this column; the PDP and Product JSON-LD omit
-- the size while it is null. Populate it from the printed pack labels, e.g.:
--   update public.products set net_quantity = '30 ml' where slug = 'bakuchiol-renewal-serum';
alter table public.products add column if not exists net_quantity text;

-- 2) Restore the canonical, claim-reviewed product descriptions.
--
-- Production rows carried the descriptions from supabase/seed_test_data.sql
-- instead of the canonical catalogue in schema.sql. Those seed strings include
-- claims the catalogue deliberately avoids ("without irritation", "sunscreen"
-- with no tested SPF, "control sebum") and drop the toner's BHA / ages-12+
-- note. Each update is guarded on the exact seed text, so a description that
-- has since been edited on purpose is left untouched.
update public.products as p
set description = v.canonical,
    updated_at = now()
from (values
  ('1', 'Plant-based retinol alternative for visible cell renewal without irritation.',
   'Plant-based retinol alternative for a smoother-looking night ritual.'),
  ('3', 'Balance oil and refine pores with antioxidant-rich green tea extract.',
   'Helps oily and combination skin feel balanced with green tea extract and 0.5% salicylic acid (BHA). Recommended for ages 12+.'),
  ('4', 'Gentle foam cleanser with turmeric and neem for a luminous complexion.',
   'Gentle foam cleanser with turmeric and neem for a fresh-looking complexion.'),
  ('5', 'Featherlight mineral sunscreen with zinc oxide and soothing aloe vera.',
   'Mineral daily sun-care shield with zinc oxide and soothing aloe vera. SPF-rating evidence is in review.'),
  ('6', 'Nourishing lip treatment with acai berry and shea for pillowy softness.',
   'Nourishing lip treatment with berry extract and shea for soft-feeling lips.'),
  ('7', 'Minimise pores and control sebum with a 10% niacinamide complex.',
   'Refines the look of pores and helps skin feel balanced with niacinamide.'),
  ('8', 'Intensive overnight repair with shea butter and vitamin E for morning glow.',
   'Cushiony overnight cream with shea butter and vitamin E for a rested-looking glow.')
) as v(id, seed_text, canonical)
where p.id::text = v.id
  and p.description = v.seed_text;
