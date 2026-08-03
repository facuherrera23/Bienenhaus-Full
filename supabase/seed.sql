-- ============================================================================
-- seed.sql — Datos de ejemplo para desarrollo y testing local
-- ============================================================================
-- NOTA: Este seed NO crea usuarios en auth.users.
-- Para crear el admin en producción, usar:
--   1. Supabase Dashboard → Authentication → Users → Add user
--   2. O Edge Function: supabase functions invoke admin-user-invite --body '{"action":"invite","email":"admin@bienenhaus.com","full_name":"Admin","role":"super_admin"}'
-- ============================================================================

-- ============================================================================
-- E2E TEST USER (solo para testing local/CI)
-- ============================================================================
-- Usuario de prueba dedicado para E2E tests: e2e-test@bienenhaus.local
-- Password: generado automáticamente en CI via Supabase CLI
-- NO usar credenciales de producción (admin@bienenhaus.com / Bienenhaus2026!)
-- 
-- En CI: se crea después de `supabase db reset` via:
--   supabase auth signup --email e2e-test@bienenhaus.local --password '$E2E_TEST_PASSWORD'
--   supabase db execute "insert into public.admin_users (id, email, full_name, role) select id, 'e2e-test@bienenhaus.local', 'E2E Test User', 'admin' from auth.users where email = 'e2e-test@bienenhaus.local' on conflict (email) do nothing;"
-- En local: supabase auth signup --email e2e-test@bienenhaus.local --password 'e2e-test-password-123'

-- ============================================================================
-- TAXONOMÍAS (idempotente - se pueden re-ejecutar)
-- ============================================================================

insert into public.categories (name, slug, sort_order) values
  ('Venta', 'venta', 1),
  ('Alquiler', 'alquiler', 2),
  ('Emprendimientos', 'emprendimientos', 3)
on conflict (slug) do nothing;

insert into public.property_types (name, slug, sort_order) values
  ('Casa', 'casa', 1),
  ('Departamento', 'departamento', 2),
  ('PH', 'ph', 3),
  ('Country', 'country', 4),
  ('Terreno', 'terreno', 5),
  ('Local', 'local', 6),
  ('Oficina', 'oficina', 7)
on conflict (slug) do nothing;

insert into public.locations (name, slug, zone, sort_order) values
  ('Centro', 'centro', 'Centro', 1),
  ('Nueva Córdoba', 'nueva-cordoba', 'Centro', 2),
  ('General Paz', 'general-paz', 'Norte', 3),
  ('Villa Belgrano', 'villa-belgrano', 'Noroeste', 4),
  ('Country Los Pinos', 'country-los-pinos', 'Noroeste', 5)
on conflict (slug) do nothing;

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

insert into public.tags (name, slug) values
  ('Destacada', 'destacada'),
  ('Oportunidad', 'oportunidad'),
  ('Inversión', 'inversion'),
  ('Estreno', 'estreno'),
  ('Con vistas', 'con-vistas')
on conflict (slug) do nothing;

-- ============================================================================
-- SITE SETTINGS (configuración global)
-- ============================================================================

insert into public.site_settings (key, value, value_type, is_public, description) values
  ('site_name', '{"value": "BIENENHAUS PROPIEDADES"}', 'json', true, 'Nombre del sitio'),
  ('cri', '{"value": "C.R.I. 183944"}', 'json', true, 'Matrícula C.R.I.'),
  ('contact_whatsapp', '{"value": "+54 9 387 600-0000"}', 'json', true, 'WhatsApp de contacto'),
  ('contact_email', '{"value": "info@bienenhaus.com"}', 'json', true, 'Email de contacto'),
  ('contact_phone', '{"value": "+54 387 400-0000"}', 'json', true, 'Teléfono de contacto'),
  ('contact_address', '{"value": "Av. Figueroa Alcorta 1234, Córdoba"}', 'json', true, 'Dirección'),
  ('contact_hours', '{"weekdays": "09:00 - 18:00", "saturdays": "09:00 - 13:00"}', 'json', true, 'Horarios'),
  ('social', '{"instagram": "#", "facebook": "#", "linkedin": "#", "whatsapp": "#", "youtube": "#"}', 'json', true, 'Redes sociales'),
  ('stats', '{"comercializadas": 320, "clientes": 1850, "exito": 98, "anios": 15}', 'json', true, 'Estadísticas del hero'),
  ('ml_enabled', '{"value": false}', 'json', false, 'Habilita sincronización con Mercado Libre'),
  -- Hero Video settings
  ('hero_video_url', '{"value": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}', 'json', true, 'URL del video principal del Hero (YouTube o Vimeo)'),
  ('hero_video_title', '{"value": "BIENENHAUS - Tour Virtual"}', 'json', true, 'Título del video del Hero'),
  ('hero_video_autoplay', '{"value": true}', 'json', true, 'Autoplay del video del Hero'),
  ('hero_video_muted', '{"value": true}', 'json', true, 'Silenciado (muted) del video del Hero'),
  ('hero_video_poster', '{"value": ""}', 'json', true, 'Poster/Imagen de portada del video del Hero')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ============================================================================
-- SITE CONTENT (contenido editable de la landing)
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
-- PROPIEDADES DE EJEMPLO
-- ============================================================================

insert into public.properties (
  title, slug, status, listing_type, price, currency, description,
  address, location_id, area_total, bedrooms, bathrooms, garages,
  featured, published_at
)
select
  v.title, v.slug, 'publicada', v.listing_type::listing_type, v.price, v.currency::currency, v.description,
  v.address, l.id, v.area_total, v.bedrooms, v.bathrooms, v.garages,
  v.featured, now()
from (
  values
    ('Casa Moderna en Country', 'casa-moderna-en-country', 'venta', 285000, 'USD',
     'Casa de 4 dormitorios con pileta en Villa Belgrano.',
     'Manzana 12, Lote 8', 'Villa Belgrano', 280, 4, 3, 2, true),
    ('Penthouse con Terraza', 'penthouse-con-terraza', 'venta', 420000, 'USD',
     'Penthouse de 3 dormitorios con terraza y vista a la ciudad.',
     'Av. Vélez Sarsfield 900', 'Nueva Córdoba', 195, 3, 2, 1, false),
    ('Villa de Lujo en Country', 'villa-de-lujo-en-country', 'venta', 680000, 'USD',
     'Villa de 5 dormitorios en country con seguridad 24h.',
     'Calle Los Cedros 320', 'Country Los Pinos', 450, 5, 4, 3, true)
) as v(title, slug, listing_type, price, currency, description, address, zone, area_total, bedrooms, bathrooms, garages, featured)
join public.locations l on l.name = v.zone
on conflict (slug) do nothing;

insert into public.property_images (property_id, url, alt, position, is_cover)
select p.id, v.url, v.alt, 0, true
from (
  values
    ('casa-moderna-en-country', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop', 'Casa moderna en country'),
    ('penthouse-con-terraza', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop', 'Penthouse con terraza'),
    ('villa-de-lujo-en-country', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&fit=crop', 'Villa de lujo')
) as v(slug, url, alt)
join public.properties p on p.slug = v.slug
where not exists (
  select 1 from public.property_images pi
  where pi.property_id = p.id and pi.position = 0
);

-- ============================================================================
-- AGENTES Y LEADS DE EJEMPLO
-- ============================================================================

insert into public.agents (name, email, phone, matricula, role, is_active, sort_order)
select v.name, v.email, v.phone, v.matricula, v.role, true, v.sort_order
from (
  values
    ('María Fernández', 'maria@bienenhaus.com', '+54 351 555-0101', 'C-04512', 'Asesora senior', 0),
    ('Jorge Álvarez', 'jorge@bienenhaus.com', '+54 351 555-0102', 'C-07893', 'Asesor', 1)
) as v(name, email, phone, matricula, role, sort_order)
on conflict (email) do nothing;

insert into public.leads (
  name, last_name, email, phone, city, intent, message, source, status, assigned_to
)
select
  v.name, v.last_name, v.email, v.phone, v.city, v.intent::lead_intent, v.message, v.source::lead_source, v.status::lead_status,
  a.id
from (
  values
    ('Lucía', 'Pérez', 'lucia.perez@gmail.com', '+54 351 555-0201', 'Córdoba',
     'comprar', 'Busco un penthouse de 3 dorm con vista a la ciudad.', 'landing_form', 'contactado'),
    ('Martín', 'Sosa', 'martin.sosa@hotmail.com', '+54 351 555-0202', 'Villa Allende',
     'vender', 'Quiero tasar y vender mi casa en Villa Belgrano.', 'whatsapp', 'nuevo'),
    ('Camila', 'Ríos', 'camila.rios@gmail.com', '+54 351 555-0203', 'Córdoba',
     'alquilar', 'Departamento de 2 dorm en Nueva Córdoba.', 'landing_form', 'calificado'),
    ('Diego', 'Luna', 'diego.luna@outlook.com', '+54 351 555-0204', 'Río Ceballos',
     'invertir', 'Interesado en un emprendimiento en la zona norte.', 'referido', 'en_proceso'),
    ('Sofía', 'Medina', 'sofia.medina@gmail.com', '+54 351 555-0205', 'Córdoba',
     'comprar', 'Consulta por la villa en country.', 'ml_contacto', 'nuevo')
) as v(name, last_name, email, phone, city, intent, message, source, status)
left join public.agents a on a.email = 'maria@bienenhaus.com'
where not exists (
  select 1 from public.leads l
  where l.email = v.email
);