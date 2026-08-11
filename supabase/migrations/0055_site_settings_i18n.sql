-- Migración: Multi-idioma (i18n) para Site Settings
-- Agrega soporte para múltiples locales

ALTER TABLE site_settings DROP CONSTRAINT site_settings_key_key;
ALTER TABLE site_settings ADD COLUMN locale text NOT NULL DEFAULT 'es-AR';
CREATE UNIQUE INDEX uq_site_settings_key_locale ON site_settings(key, locale);

-- Datos semilla para en-US, pt-BR (value es jsonb: {"value": "..."} — patrón de seed.sql)
INSERT INTO site_settings (key, value, value_type, is_public, locale) VALUES
('site_name', '{"value": "BIENENHAUS Properties"}', 'json', true, 'en-US'),
('site_name', '{"value": "BIENENHAUS Propriedades"}', 'json', true, 'pt-BR'),
('hero_title', '{"value": "Find your next home"}', 'json', true, 'en-US'),
('hero_title', '{"value": "Encontre seu próximo lar"}', 'json', true, 'pt-BR'),
('hero_subtitle', '{"value": "Explore a curated selection of premium properties."}', 'json', true, 'en-US'),
('hero_subtitle', '{"value": "Explore uma seleção exclusiva de imóveis premium."}', 'json', true, 'pt-BR')
on conflict (key, locale) do nothing;
-- ... etc para keys públicas