-- ============================================================================
-- 0063_ml_webhook_secret.sql
-- BIENENHAUS - Agregar ML_WEBHOOK_SECRET a site_settings para configuración desde admin
-- ============================================================================

insert into public.site_settings (key, value, value_type, is_public, description) values
  ('ml_webhook_secret', '{"value": ""}', 'json', false, 'Secret para validar firma HMAC de webhooks de Mercado Libre (x-meli-signature)')
on conflict (key, locale) do nothing;
