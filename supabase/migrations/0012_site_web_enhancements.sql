-- ============================================================================
-- 0012_site_web_enhancements.sql
-- BIENENHAUS — Mejoras al módulo Sitio Web
--   * Bucket 'site-images' para logo, fondos y favicon.
--   * Seeds de listas editables (hero.stats, hero.features, servicios.items,
--     proceso.steps, contacto.info) y descripciones faltantes.
--   * Settings de imágenes (logo_url, hero_background, favicon_url, og_image).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Storage 'site-images'
-- ----------------------------------------------------------------------------
-- Las tablas storage.buckets y storage.objects se crean automáticamente al
-- iniciar el servicio storage-api. Usamos DO blocks para evitar errores si
-- las tablas aún no existen durante la ejecución de migraciones.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'site-images',
      'site-images',
      true,
      5242880,
      array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
    )
    on conflict (id) do nothing;
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'objects') then
    create policy site_images_public_read on storage.objects
      for select using (bucket_id = 'site-images');

    create policy site_images_staff_insert on storage.objects
      for insert to authenticated
      with check (bucket_id = 'site-images' and public.is_staff());

    create policy site_images_staff_update on storage.objects
      for update to authenticated
      using (bucket_id = 'site-images' and public.is_staff());

    create policy site_images_staff_delete on storage.objects
      for delete to authenticated
      using (bucket_id = 'site-images' and public.is_staff());

    grant select on storage.objects to anon, authenticated;
    grant insert, update, delete on storage.objects to authenticated;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Seeds — settings de imágenes
-- ----------------------------------------------------------------------------
insert into public.site_settings (key, value, value_type, is_public, description) values
  ('logo_url', '{"value": ""}', 'json', true, 'Logo del sitio (SVG, PNG o WebP)'),
  ('hero_background', '{"value": ""}', 'json', true, 'Imagen de fondo del hero'),
  ('favicon_url', '{"value": ""}', 'json', true, 'Favicon'),
  ('og_image', '{"value": ""}', 'json', true, 'Imagen para compartir en redes')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- Seeds — listas de contenido (locale es)
-- ----------------------------------------------------------------------------
insert into public.site_content (section, key, value) values
  ('hero', 'stats', '[
    {"icon": "fa-home", "value": "128", "title": "Propiedades activas", "note": "Actualizadas diariamente"},
    {"icon": "fa-user-tie", "value": "24", "title": "Agentes expertos", "note": "A tu servicio"},
    {"icon": "fa-map-marker-alt", "value": "12+", "title": "Zonas premium", "note": "Las mejores ubicaciones"}
  ]'),
  ('hero', 'features', '[
    {"icon": "fa-crown", "title": "Propiedades Premium", "text": "Selección exclusiva de alta categoría"},
    {"icon": "fa-handshake", "title": "Asesoramiento Personalizado", "text": "Acompañamiento profesional en cada etapa"},
    {"icon": "fa-clipboard-list", "title": "Gestión Integral", "text": "Nos encargamos de todo. Vos elegís."},
    {"icon": "fa-clock", "title": "Experiencia", "text": "Más de 10 años conectando personas con hogares únicos"}
  ]'),
  ('servicios', 'items', '[
    {"icon": "fa-home", "title": "Compra de propiedades", "description": "Te ayudamos a encontrar la propiedad ideal que se adapta a tu estilo de vida y necesidades."},
    {"icon": "fa-hand-holding-usd", "title": "Venta de propiedades", "description": "Maximizamos el valor de tu propiedad con estrategias de marketing exclusivas y una amplia red de contactos."},
    {"icon": "fa-gavel", "title": "Asesoramiento legal", "description": "Acompañamiento legal en cada etapa del proceso para garantizar operaciones seguras y transparentes."}
  ]'),
  ('proceso', 'steps', '[
    {"icon": "fa-users", "title": "Nos conocemos", "description": "Escuchamos tus objetivos y necesidades para comprender exactamente qué estás buscando."},
    {"icon": "fa-chart-bar", "title": "Analizamos la propiedad", "description": "Realizamos una tasación profesional y definimos la mejor estrategia para maximizar su valor."},
    {"icon": "fa-bullhorn", "title": "Diseñamos el plan", "description": "Creamos una estrategia de marketing personalizada con difusión premium y posicionamiento."},
    {"icon": "fa-handshake", "title": "Negociamos", "description": "Gestionamos cada detalle y representamos tus intereses durante toda la negociación."},
    {"icon": "fa-key", "title": "Concretamos la operación", "description": "Te acompañamos hasta la firma y el cierre de la operación garantizando una experiencia impecable."}
  ]'),
  ('contacto', 'info', '[
    {"icon": "fa-whatsapp", "label": "WhatsApp", "value": "+54 9 387 600-0000"},
    {"icon": "fa-envelope", "label": "Correo electrónico", "value": "info@bienenhaus.com"},
    {"icon": "fa-phone", "label": "Teléfono", "value": "+54 387 400-0000"},
    {"icon": "fa-map-marker-alt", "label": "Dirección", "value": "Av. Figueroa Alcorta 1234, Córdoba"}
  ]')
on conflict (section, key, locale) do nothing;

-- Descripciones de sección faltantes
insert into public.site_content (section, key, value) values
  ('servicios', 'description', '{"text": "Soluciones integrales para comprar, vender o invertir con total confianza y acompañamiento profesional."}'),
  ('equipo', 'description', '{"text": "Un grupo de profesionales con años de experiencia en el mercado inmobiliario de la región."}'),
  ('estadisticas', 'description', '{"text": "Resultados que respaldan nuestro compromiso con cada cliente."}'),
  ('proceso', 'description', '{"text": "Cinco pasos claros que te acompañan desde el primer contacto hasta la entrega de llaves."}'),
  ('contacto', 'description', '{"text": "Escribinos y coordinemos una reunión para entender tus objetivos."}')
on conflict (section, key, locale) do nothing;
