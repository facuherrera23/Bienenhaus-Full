-- ============================================================================
-- 0047_fix_ml_auto_triggers.sql
-- BIENENHAUS — Fix regresión auto-publish/update/delete ML + buckets faltantes
--
-- Problema (auditoría 2026-08-07):
--   Los triggers properties_ml_auto_publish / properties_ml_auto_update /
--   ml_auto_delete corren en la sesión del usuario del panel (rol de sesión
--   'authenticated', staff) y llaman public.ml_enqueue(id, op, true).
--   ml_enqueue exigía auth.role() = 'service_role' para p_internal=true, por lo
--   que TODO update de una propiedad con ml_listing_id se revertía con
--   'No autorizado' (no se podía publicar/editar/borrar nada en ML).
--
-- Por qué este fix (y no SECURITY DEFINER en los triggers):
--   auth.role() es un GUC de sesión (request.jwt.claim.role), NO el rol SQL
--   efectivo. Hacer SECURITY DEFINER al trigger NO cambia auth.role() y el
--   raise seguía ocurriendo. El fix correcto es permitir el modo interno
--   cuando el caller es service_role (edge functions) O staff autenticado
--   (el caso del trigger disparado desde el panel).
--
-- Sin cambio de superficie de ataque:
--   * anon perdió EXECUTE en 0043 → no puede invocar ml_enqueue.
--   * authenticated no-staff: is_staff() = false y role <> 'service_role'
--     → sigue bloqueado (raise 'No autorizado').
--   * staff ya podía encolar con p_internal = false; p_internal = true solo
--     cambia el manejo de errores (retorna null si ML desactivado/sin conexión).
--
-- Además crea los buckets que el código ya usaba pero nunca se migraron:
--   * property-images  → público (la landing lee las URLs sin auth)
--   * chat-files       → privado (solo staff, para signed URLs futuras)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) ml_enqueue: modo interno permitido para service_role O staff autenticado
-- ----------------------------------------------------------------------------
create or replace function public.ml_enqueue(p_property_id uuid, p_operation ml_operation, p_internal boolean default false)
returns bigint
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_ml_enabled boolean;
  v_conn_id uuid;
  v_queue_id bigint;
begin
  if p_internal then
    -- Modo interno: edge functions con service_role JWT, o triggers
    -- properties_ml_auto_* disparados desde la sesión de un staff (el panel).
    if auth.role() <> 'service_role' and not public.is_staff() then
      raise exception 'No autorizado';
    end if;
  elsif not public.is_staff() then
    raise exception 'No autorizado';
  end if;

  -- La integración debe estar activa.
  select (value->>'value')::boolean into v_ml_enabled
    from public.site_settings
    where key = 'ml_enabled';

  if coalesce(v_ml_enabled, false) is false then
    if p_internal then
      return null;
    end if;
    raise exception 'La integración con Mercado Libre está desactivada.';
  end if;

  -- Debe haber una cuenta conectada y activa.
  select id into v_conn_id
    from public.ml_connection
    where is_active = true
    order by updated_at desc
    limit 1;

  if v_conn_id is null then
    if p_internal then
      return null;
    end if;
    raise exception 'No hay una cuenta de Mercado Libre conectada.';
  end if;

  -- La propiedad debe existir.
  perform 1 from public.properties where id = p_property_id;
  if not found then
    raise exception 'Propiedad no encontrada';
  end if;

  -- Dedupe: ya existe la misma operación en cola.
  perform 1 from public.ml_sync_queue q
    where q.property_id = p_property_id
      and q.operation = p_operation
      and q.status in ('pending', 'processing');
  if found then
    return null;
  end if;

  insert into public.ml_sync_queue (property_id, operation, status, created_by)
  values (p_property_id, p_operation, 'pending', auth.uid())
  returning id into v_queue_id;

  insert into public.activity_log (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    case p_operation
      when 'publish' then 'ml_publish'::audit_action
      when 'update'  then 'ml_update'::audit_action
      when 'delete'  then 'ml_delete'::audit_action
    end,
    'property',
    p_property_id,
    jsonb_build_object('operation', p_operation, 'queue_id', v_queue_id)
  );

  return v_queue_id;
end;
$function$;

-- ----------------------------------------------------------------------------
-- 2) Bucket 'property-images' (público — la landing lee las URLs sin auth)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  15728640,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Lectura pública
drop policy if exists property_images_public_read on storage.objects;
create policy property_images_public_read on storage.objects
  for select using (bucket_id = 'property-images');

-- Escritura/borrado solo para staff
drop policy if exists property_images_staff_insert on storage.objects;
create policy property_images_staff_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'property-images' and public.is_staff());

drop policy if exists property_images_staff_update on storage.objects;
create policy property_images_staff_update on storage.objects
  for update to authenticated
  using (bucket_id = 'property-images' and public.is_staff());

drop policy if exists property_images_staff_delete on storage.objects;
create policy property_images_staff_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'property-images' and public.is_staff());

-- ----------------------------------------------------------------------------
-- 3) Bucket 'chat-files' (privado — adjuntos del chat interno, solo staff)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-files',
  'chat-files',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf', 'text/plain']
)
on conflict (id) do nothing;

-- Acceso exclusivo staff (select para lectura futura vía signed URLs)
drop policy if exists chat_files_staff_select on storage.objects;
create policy chat_files_staff_select on storage.objects
  for select to authenticated
  using (bucket_id = 'chat-files' and public.is_staff());

drop policy if exists chat_files_staff_insert on storage.objects;
create policy chat_files_staff_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-files' and public.is_staff());

drop policy if exists chat_files_staff_update on storage.objects;
create policy chat_files_staff_update on storage.objects
  for update to authenticated
  using (bucket_id = 'chat-files' and public.is_staff());

drop policy if exists chat_files_staff_delete on storage.objects;
create policy chat_files_staff_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'chat-files' and public.is_staff());

-- Grants para storage.objects
grant select on storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;