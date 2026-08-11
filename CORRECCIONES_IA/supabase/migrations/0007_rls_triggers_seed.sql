-- ============================================================================
-- 0007_rls_triggers_seed.sql
-- BIENENHAUS — Row Level Security, triggers de auditoría, índices y funciones helper.
-- Los seeds de datos (taxonomías, site_settings, site_content) están en seed.sql
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
-- TRIGGER: Actualizar last_login_at en admin_users al hacer login
-- ============================================================================
-- Se llama desde la app tras login exitoso
create or replace function public.update_admin_last_login(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.admin_users
  set last_login_at = now(), updated_at = now()
  where id = p_user_id;
end;
$$;

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
-- GRANTS PARA FUNCIONES HELPER
-- ============================================================================
grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.is_staff() to anon, authenticated, service_role;
grant execute on function public.has_role(admin_role) to anon, authenticated, service_role;
grant execute on function public.create_admin_user(uuid, text, text, admin_role) to service_role;
grant execute on function public.update_admin_last_login(uuid) to service_role, authenticated;
