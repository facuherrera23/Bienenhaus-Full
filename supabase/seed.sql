-- ============================================================================
-- seed.sql — Datos de ejemplo para el panel
-- ============================================================================

-- ============================================================================
-- Configuración del Hero Video
-- ============================================================================

insert into public.site_settings (key, value, value_type, is_public, description)
values
  ('hero_video_url', '{"value": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'::jsonb, 'json', true, 'URL del video principal del Hero (YouTube o Vimeo)'),
  ('hero_video_title', '{"value": "BIENENHAUS - Tour Virtual"}'::jsonb, 'json', true, 'Titulo del video del Hero'),
  ('hero_video_autoplay', '{"value": true}'::jsonb, 'json', true, 'Autoplay del video del Hero'),
  ('hero_video_muted', '{"value": true}'::jsonb, 'json', true, 'Silenciado (muted) del video del Hero'),
  ('hero_video_poster', '{"value": ""}'::jsonb, 'json', true, 'Poster/Imagen de portada del video del Hero')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ============================================================================
-- Propiedades de ejemplo para validar el listado del panel.
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

-- Backfill: si las propiedades de ejemplo quedaron sin zona (seed anterior),
-- asignarles la ubicación correspondiente.
update public.properties p
set location_id = l.id
from (
  values
    ('casa-moderna-en-country', 'Villa Belgrano'),
    ('penthouse-con-terraza', 'Nueva Córdoba'),
    ('villa-de-lujo-en-country', 'Country Los Pinos')
) as v(slug, zone)
join public.locations l on l.name = v.zone
where p.slug = v.slug
  and p.location_id is null;

-- ============================================================================
-- Configuración del Hero Video
-- ============================================================================

insert into public.site_settings (key, value, value_type, is_public, description)
values
  ('hero_video_url', '{"value": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'::jsonb, 'json', true, 'URL del video principal del Hero (YouTube o Vimeo)'),
  ('hero_video_title', '{"value": "BIENENHAUS - Tour Virtual"}'::jsonb, 'json', true, 'Titulo del video del Hero'),
  ('hero_video_autoplay', '{"value": true}'::jsonb, 'json', true, 'Autoplay del video del Hero'),
  ('hero_video_muted', '{"value": true}'::jsonb, 'json', true, 'Silenciado (muted) del video del Hero'),
  ('hero_video_poster', '{"value": ""}'::jsonb, 'json', true, 'Poster/Imagen de portada del video del Hero')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ============================================================================
-- Agente y leads de ejemplo para el CRM.
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
