-- ============================================================================
-- 0007_rls_triggers_seed.sql
-- BIENENHAUS — Row Level Security, triggers de auditoría, índices y seeds.
-- ============================================================================

-- ============================================================================
-- FUNCIONES DE ROL (helper para RLS)
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users au
    where au.id = auth.uid()
      and au.is_active = true
      and au.role in ('super_admin', 'admin')
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users au
    where au.id = auth.uid()
      and au.is_active = true
      and au.role in ('super_admin', 'admin', 'staff')
  );
$$;

create or replace function public.has_role(_role admin_role)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users au
    where au.id = auth.uid()
      and au.is_active = true
      and au.role = _role
  );
$$;

-- ============================================================================
-- TRIGGER DE AUDITORÍA PARA PROPERTIES
-- ============================================================================

create or replace function public.audit_property_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  _action public.audit_action := 'update';
begin
  if new.status is distinct from old.status then
    _action := 'status_change';
  end if;

  insert into public.properties_history (property_id, change_type, data, changed_by)
  values (old.id, _action, to_jsonb(old), auth.uid());

  insert into public.activity_log (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    _action,
    'property',
    old.id,
    jsonb_build_object('title', old.title, 'status', new.status)
  );

  return new;
end;
$$;

create trigger properties_audit
  after update on public.properties
  for each row execute function public.audit_property_change();

-- Auditoría de creación de propiedades.
create or replace function public.audit_property_create()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.activity_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'create', 'property', new.id, jsonb_build_object('title', new.title));
  return new;
end;
$$;

create trigger properties_audit_create
  after insert on public.properties
  for each row execute function public.audit_property_create();

-- ============================================================================
-- HABILITAR RLS
-- ============================================================================

alter table public.categories        enable row level security;
alter table public.property_types    enable row level security;
alter table public.locations         enable row level security;
alter table public.features          enable row level security;
alter table public.tags              enable row level security;
alter table public.properties        enable row level security;
alter table public.property_images   enable row level security;
alter table public.property_videos   enable row level security;
alter table public.property_features enable row level security;
alter table public.property_tags     enable row level security;
alter table public.properties_history enable row level security;
alter table public.agents            enable row level security;
alter table public.leads             enable row level security;
alter table public.site_content      enable row level security;
alter table public.site_settings     enable row level security;
alter table public.admin_users       enable row level security;
alter table public.activity_log      enable row level security;
alter table public.ml_connection     enable row level security;
alter table public.ml_sync_queue     enable row level security;
alter table public.ml_sync_history   enable row level security;
alter table public.property_ml_meta  enable row level security;

-- ============================================================================
-- POLÍTICAS RLS
-- ============================================================================

-- Taxonomías: lectura pública, escritura staff.
create policy categories_public_select on public.categories
  for select using (is_active = true);
create policy categories_staff_all on public.categories
  for all using (public.is_staff()) with check (public.is_staff());

create policy property_types_public_select on public.property_types
  for select using (is_active = true);
create policy property_types_staff_all on public.property_types
  for all using (public.is_staff()) with check (public.is_staff());

create policy locations_public_select on public.locations
  for select using (is_active = true);
create policy locations_staff_all on public.locations
  for all using (public.is_staff()) with check (public.is_staff());

create policy features_public_select on public.features
  for select using (is_active = true);
create policy features_staff_all on public.features
  for all using (public.is_staff()) with check (public.is_staff());

create policy tags_public_select on public.tags
  for select using (is_active = true);
create policy tags_staff_all on public.tags
  for all using (public.is_staff()) with check (public.is_staff());

-- Properties: el público solo ve las publicadas; staff ve y escribe todo.
create policy properties_public_select on public.properties
  for select using (status = 'publicada'::property_status);
create policy properties_staff_select on public.properties
  for select using (public.is_staff());
create policy properties_staff_insert on public.properties
  for insert with check (public.is_staff());
create policy properties_staff_update on public.properties
  for update using (public.is_staff()) with check (public.is_staff());
create policy properties_staff_delete on public.properties
  for delete using (public.is_staff());

-- Imágenes / videos: lectura pública (de propiedades publicadas), staff todo.
create policy property_images_public_select on public.property_images
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'publicada'::property_status
    )
  );
create policy property_images_staff_all on public.property_images
  for all using (public.is_staff()) with check (public.is_staff());

create policy property_videos_public_select on public.property_videos
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'publicada'::property_status
    )
  );
create policy property_videos_staff_all on public.property_videos
  for all using (public.is_staff()) with check (public.is_staff());

create policy property_features_public_select on public.property_features
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'publicada'::property_status
    )
  );
create policy property_features_staff_all on public.property_features
  for all using (public.is_staff()) with check (public.is_staff());

create policy property_tags_public_select on public.property_tags
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'publicada'::property_status
    )
  );
create policy property_tags_staff_all on public.property_tags
  for all using (public.is_staff()) with check (public.is_staff());

-- History: solo staff (lectura) e insert automático por trigger.
create policy properties_history_staff_select on public.properties_history
  for select using (public.is_staff());

-- Agents: lectura pública (equipo en landing), staff escribe.
create policy agents_public_select on public.agents
  for select using (is_active = true);
create policy agents_staff_all on public.agents
  for all using (public.is_staff()) with check (public.is_staff());

-- Leads: solo staff (CRM). Datos sensibles.
create policy leads_staff_select on public.leads
  for select using (public.is_staff());
create policy leads_staff_insert on public.leads
  for insert with check (public.is_staff());
create policy leads_staff_update on public.leads
  for update using (public.is_staff()) with check (public.is_staff());
create policy leads_staff_delete on public.leads
  for delete using (public.is_staff());

-- Site content: lectura pública de contenido activo, staff escribe.
create policy site_content_public_select on public.site_content
  for select using (is_active = true);
create policy site_content_staff_all on public.site_content
  for all using (public.is_staff()) with check (public.is_staff());

-- Site settings: solo se exponen públicamente las keys is_public.
create policy site_settings_public_select on public.site_settings
  for select using (is_public = true);
create policy site_settings_staff_all on public.site_settings
  for all using (public.is_staff()) with check (public.is_staff());

-- Admin users: lectura staff; escritura solo admin. (La creación inicial se
-- hace con service_role vía seed.sql o Edge Function.)
create policy admin_users_staff_select on public.admin_users
  for select using (public.is_staff());
create policy admin_users_admin_all on public.admin_users
  for all using (public.is_admin()) with check (public.is_admin());

-- Activity log: lectura admin; el insert lo generan los triggers/edge functions.
create policy activity_log_admin_select on public.activity_log
  for select using (public.is_admin());

-- ML: solo staff/admin.
create policy ml_connection_staff_all on public.ml_connection
  for all using (public.is_staff()) with check (public.is_staff());
create policy ml_sync_queue_staff_all on public.ml_sync_queue
  for all using (public.is_staff()) with check (public.is_staff());
create policy ml_sync_history_staff_all on public.ml_sync_history
  for all using (public.is_staff()) with check (public.is_staff());
create policy property_ml_meta_staff_all on public.property_ml_meta
  for all using (public.is_staff()) with check (public.is_staff());

-- ============================================================================
-- ÍNDICES ADICIONALES
-- ============================================================================

create index properties_status_listing_idx
  on public.properties (status, listing_type, featured desc)
  where status = 'publicada'::property_status;
create index properties_slug_idx on public.properties (slug);
create index properties_location_idx on public.properties (location_id);
create index properties_created_at_idx on public.properties (created_at desc);

create index leads_email_idx on public.leads (email);
create index leads_status_idx on public.leads (status);
create index leads_assigned_idx on public.leads (assigned_to);
create index leads_created_at_idx on public.leads (created_at desc);

create index ml_sync_queue_due_idx
  on public.ml_sync_queue (next_attempt_at)
  where status in ('pending'::ml_sync_status, 'processing'::ml_sync_status);
create index ml_sync_queue_property_idx on public.ml_sync_queue (property_id);

-- ============================================================================
-- SEEDS — TAXONOMÍAS
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
  ('Amoblad o', 'amoblado', 'fa-solid fa-couch', 9),
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
-- SEEDS — SITE SETTINGS
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
  ('ml_enabled', '{"value": false}', 'json', false, 'Habilita sincronización con Mercado Libre')
on conflict (key) do nothing;

-- ============================================================================
-- SEEDS — SITE CONTENT (contenido editable de la landing)
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
