-- 0065: Dedupe atómico de cola ML + RPC ml_enqueue_batch (M1)
--
-- ml-bulk-enqueue hacía check+insert con TOCTOU (dos procesos podían
-- encolar la misma operación). Se reemplaza por un índice único parcial
-- + ON CONFLICT DO NOTHING, y un RPC batch que encola N propiedades
-- en una sola llamada atómica.

-- Índice único parcial: una sola operación activa (pending/processing) por propiedad.
create unique index if not exists uq_ml_sync_queue_active
  on public.ml_sync_queue (property_id, operation)
  where status in ('pending', 'processing');

-- ml_enqueue con ON CONFLICT DO NOTHING (protege contra carreras/triggers concurrentes).
create or replace function public.ml_enqueue(
  p_property_id uuid,
  p_operation ml_operation,
  p_internal boolean default false
)
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

  -- Insert atómico con dedupe vía índice único parcial.
  insert into public.ml_sync_queue (property_id, operation, status, created_by)
  values (p_property_id, p_operation, 'pending', auth.uid())
  on conflict (property_id, operation) where status in ('pending', 'processing')
  do nothing
  returning id into v_queue_id;

  if v_queue_id is null then
    return null;
  end if;

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

-- RPC batch: encola N propiedades en una sola llamada atómica.
-- Retorna { enqueued, skipped } — skipped incluye propiedades inexistentes
-- y operaciones ya en cola (pending/processing).
create or replace function public.ml_enqueue_batch(
  p_property_ids uuid[],
  p_operation ml_operation,
  p_internal boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_ml_enabled boolean;
  v_conn_id uuid;
  v_pid uuid;
  v_enqueued int := 0;
  v_skipped int := 0;
begin
  if p_internal then
    if auth.role() <> 'service_role' and not public.is_staff() then
      raise exception 'No autorizado';
    end if;
  elsif not public.is_staff() then
    raise exception 'No autorizado';
  end if;

  select (value->>'value')::boolean into v_ml_enabled
    from public.site_settings
    where key = 'ml_enabled';
  if coalesce(v_ml_enabled, false) is false then
    if p_internal then
      return jsonb_build_object('enqueued', 0, 'skipped', 0, 'error', 'La integración con Mercado Libre está desactivada.');
    end if;
    raise exception 'La integración con Mercado Libre está desactivada.';
  end if;

  select id into v_conn_id
    from public.ml_connection
    where is_active = true
    order by updated_at desc
    limit 1;
  if v_conn_id is null then
    if p_internal then
      return jsonb_build_object('enqueued', 0, 'skipped', 0, 'error', 'No hay una cuenta de Mercado Libre conectada.');
    end if;
    raise exception 'No hay una cuenta de Mercado Libre conectada.';
  end if;

  foreach v_pid in array p_property_ids loop
    perform 1 from public.properties where id = v_pid;
    if not found then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    insert into public.ml_sync_queue (property_id, operation, status, created_by, payload)
    values (v_pid, p_operation, 'pending', auth.uid(), jsonb_build_object('bulk', true, 'source', 'ml-bulk-enqueue'))
    on conflict (property_id, operation) where status in ('pending', 'processing')
    do nothing;

    if found then
      v_enqueued := v_enqueued + 1;
    else
      v_skipped := v_skipped + 1;
    end if;
  end loop;

  return jsonb_build_object('enqueued', v_enqueued, 'skipped', v_skipped);
end;
$function$;
