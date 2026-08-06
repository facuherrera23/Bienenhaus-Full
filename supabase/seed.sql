-- ============================================================================
-- seed.sql — Production-ready seed data (NO sample data)
-- ============================================================================
-- This seed contains ONLY essential data for production:
-- - Taxonomies (categories, property types, locations, features, tags)
-- - Site settings and content (CMS content for landing)
-- NO sample properties, agents, leads, or property images
-- ============================================================================

-- ============================================================================
-- TAXONOMIES (idempotent - safe to re-run)
-- ============================================================================

-- CATEGORIES
insert into public.categories (name, slug, sort_order) values
  ('Venta', 'venta', 1),
  ('Alquiler', 'alquiler', 2),
  ('Emprendimientos', 'emprendimientos', 3)
on conflict (slug) do nothing;

-- PROPERTY TYPES
insert into public.property_types (name, slug, sort_order) values
  ('Casa', 'casa', 1),
  ('Departamento', 'departamento', 2),
  ('PH', 'ph', 3),
  ('Country', 'country', 3),
  ('Terreno', 'terreno', 5),
  ('Local', 'local', 6),
  ('Oficina', 'oficina', 7)
on conflict (slug) do nothing;

-- LOCATIONS (Córdoba, Argentina)
insert into public.locations (name, slug, zone, sort_order, is_active) values
  ('Centro', 'centro', 'Centro', 1, true),
  ('Nueva Córdoba', 'nueva-cordoba', 'Centro', 2, true),
  ('General Paz', 'general-paz', 'Norte', 3, true),
  ('Villa Belgrano', 'villa-belgrano', 'Noroeste', 4, true),
  ('Country Los Pinos', 'country-los-pinos', 'Noroeste', 5, true),
  ('Cerro de las Rosas', 'cerro-de-las-rosas', 'Noroeste', 6, true),
  ('Alta Córdoba', 'alta-cordoba', 'Norte', 7, true),
  ('Alberdi', 'alberdi', 'Oeste', 8, true),
  ('Guemes', 'guemes', 'Centro', 9, true),
  ('Barrio Jardín', 'barrio-jardin', 'Norte', 10, true)
on conflict (slug) do nothing;

-- FEATURES (amenities)
insert into public.features (name, slug, icon, sort_order) values
  ('Pileta', 'pileta', 'fa-solid fa-person-swimming', 1),
  ('Cochera', 'cochera', 'fa-solid fa-car', 2),
  ('Jardín', 'jardin', 'fa-solid fa-tree', 3),
  ('Balcón', 'balcon', 'fa-solid fa-building', 4),
  ('Terraza', 'terraza', 'fa-solid fa-sun', 5),
  ('Seguridad 24h', 'seguridad-24h', 'fa-solid fa-shield-halved', 6),
  ('Parrilla', 'parrilla', 'fa-solid fa-fire', 7),
  ('Piso de porcelanato', 'porcelanato', 'fa-solid fa-border-all', 8),
  ('Amoblado', 'amoblado', 'fa-solid fa-couch', 9),
  ('Apto profesional', 'apto-profesional', 'fa-solid fa-briefcase', 10)
on conflict (slug) do nothing;

-- TAGS
insert into public.tags (name, slug) values
  ('Destacada', 'destacada'),
  ('Oportunidad', 'oportunidad'),
  ('Inversión', 'inversion'),
  ('Estreno', 'estreno'),
  ('Con vistas', 'con-vistas')
on conflict (slug) do nothing;

-- ============================================================================
-- SITE SETTINGS (global configuration)
-- ============================================================================

insert into public.site_settings (key, value, value_type, is_public, description) values
  ('site_name', '{"value": "BIENENHAUS PROPIEDADES"}', 'json', true, 'Nombre del sitio'),
  ('cri', '{"value": "C.R.I. 183944"}', 'json', true, 'Matrícula C.R.I.'),
  ('contact_whatsapp', '{"value": "+54 9 351 600-0000"}', 'json', true, 'WhatsApp de contacto'),
  ('contact_email', '{"value": "info@bienenhaus.com"}', 'json', true, 'Email de contacto'),
  ('contact_phone', '{"value": "+54 351 400-0000"}', 'json', true, 'Teléfono de contacto'),
  ('contact_address', '{"value": "Av. Figueroa Alcorta 1234, Córdoba"}', 'json', true, 'Dirección'),
  ('contact_hours', '{"weekdays": "09:00 - 18:00", "saturdays": "09:00 - 13:00"}', 'json', true, 'Horarios'),
  ('social', '{"instagram": "#", "facebook": "#", "linkedin": "#", "whatsapp": "#", "youtube": "#"}', 'json', true, 'Redes sociales'),
  ('stats', '{"comercializadas": 0, "clientes": 0, "exito": 98, "anios": 15}', 'json', true, 'Estadísticas del hero'),
  ('ml_enabled', '{"value": false}', 'json', false, 'Habilita sincronización con Mercado Libre'),
  -- Hero Video settings
  ('hero_video_url', '{"value": ""}', 'json', true, 'URL del video principal del Hero (YouTube o Vimeo)'),
  ('hero_video_title', '{"value": "BIENENHAUS - Tour Virtual"}', 'json', true, 'Título del video del Hero'),
  ('hero_video_autoplay', '{"value": true}', 'json', true, 'Autoplay del video del Hero'),
  ('hero_video_muted', '{"value": true}', 'json', true, 'Silenciado (muted) del video del Hero'),
  ('hero_video_poster', '{"value": ""}', 'json', true, 'Poster/Imagen de portada del video del Hero')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ============================================================================
-- SITE CONTENT (editable content for landing CMS)
-- ============================================================================

insert into public.site_content (section, key, value) values
  ('hero', 'eyebrow', '{"text": "Encontrá tu lugar"}'),
  ('hero', 'title', '{"line1": "Propiedades exclusivas.", "line2": "Experiencias extraordinarias."}'),
  ('hero', 'description', '{"text": "Selección premium en las mejores zonas. Asesoramiento personalizado en cada paso."}'),
  ('catalogo', 'label', '{"text": "Encontrá tu próximo hogar"}'),
  ('catalogo', 'title', '{"text": "Propiedades seleccionadas para vos."}'),
  ('catalogo', 'description', '{"text": "Explorá una selección exclusiva de propiedades cuidadosamente elegidas en las mejores zonas."}'),
  ('servicios', 'label', '{"text": "Nuestros servicios"}'),
  ('servicios', 'title', '{"text": "Mucho más que una inmobiliaria."}'),
  ('equipo', 'label', '{"text": "Conocé al equipo"}'),
  ('equipo', 'title', '{"text": "Expertos que convierten propiedades en oportunidades."}'),
  ('estadisticas', 'label', '{"text": "Nuestra trayectoria"}'),
  ('estadisticas', 'title', '{"text": "Los números hablan por nosotros."}'),
  ('proceso', 'label', '{"text": "Cómo trabajamos"}'),
  ('proceso', 'title', '{"text": "Un proceso simple. Resultados extraordinarios."}'),
  ('contacto', 'label', '{"text": "Contacto"}'),
  ('contacto', 'title', '{"text": "Hablemos sobre tu próxima propiedad."}'),
  ('footer', 'title', '{"text": "Encontrá el lugar donde comienza tu próxima historia."}'),
  ('footer', 'newsletter', '{"text": "Suscribite para recibir las propiedades más exclusivas antes que nadie."}'),
  ('meta', 'og_title', '{"value": "BIENENHAUS PROPIEDADES | Propiedades exclusivas"}'),
  ('meta', 'og_description', '{"value": "Selección premium en las mejores zonas. Asesoramiento personalizado en cada paso."}')
on conflict (section, key, locale) do nothing;

-- ============================================================================
-- PRODUCTION NOTES
-- ============================================================================
-- This seed is production-ready and contains ONLY essential data.
-- NO sample properties, agents, leads, property images, or test data.
-- 
-- For production admin user:
-- 1. Create via Supabase Dashboard → Authentication → Users → Add user
-- 2. Or use Edge Function: supabase functions invoke admin-user-invite --body '{"action":"invite","email":"admin@bienenhaus.com","full_name":"Admin","role":"super_admin"}'
--
-- Sample properties, agents, leads should be added manually after production launch.
-- ============================================================================