-- ============================================================================
-- 0015_ml_defaults.sql
-- BIENENHAUS �?" Valores por defecto para la publicación en Mercado Libre.
-- ============================================================================
insert into public.site_settings (key, value, value_type, is_public, description) values
  ('ml_defaults', '{"category_id": "", "listing_type_id": "gold_pro", "condition": "used"}', 'json', false, 'Defaults de publicación en ML (category_id, listing_type_id, condition)')
on conflict (key) do nothing;
