-- Replace placeholder catalogue prices with retail-grade pricing.
-- Historical orders keep their captured item JSON; product rows use the current price ladder.
update public.products
   set price = case slug
     when 'bakuchiol-renewal-serum' then 1495
     when 'rose-hip-glow-moisturiser' then 1095
     when 'green-tea-clarity-toner' then 795
     when 'turmeric-brightening-cleanser' then 695
     when 'botanical-spf-50-shield' then 795
     when 'wild-berry-lip-elixir' then 595
     when 'niacinamide-pore-serum' then 895
     when 'shea-butter-night-cream' then 1595
     else price
   end
 where slug in (
   'bakuchiol-renewal-serum',
   'rose-hip-glow-moisturiser',
   'green-tea-clarity-toner',
   'turmeric-brightening-cleanser',
   'botanical-spf-50-shield',
   'wild-berry-lip-elixir',
   'niacinamide-pore-serum',
   'shea-butter-night-cream'
 );
