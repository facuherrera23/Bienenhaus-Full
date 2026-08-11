-- ============================================================================
-- 0014_ml_admin.sql
-- BIENENHAUS �?" Módulo Mercado Libre + configuración del panel.
-- RPCs para conexión/cola, triggers de auto-publicación y settings nuevos.
-- ============================================================================

-- ============================================================================
-- ML GET CONNECTION (proyección segura, nunca expone tokens)
-- ============================================================================
create or replace function public.ml_get_connection()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_conn record;
  v_ml_enabled boolean;
begin
  select c.id, c.provider, c.site_id, c.user_id, c.nickname, c.email,
         c.token_expires_at, c.is_active, c.created_at, c.updated_at
    into v_conn
    from public.ml_connection c
    order by c.updated_at desc
    limit 1;

  select (value->>'value')::boolean into v_ml_enabled
    from public.site_settings
    where key = 'ml_enabled';

  return jsonb_build_object(
    'ml_enabled', coalesce(v_ml_enabled, false),
    'connection', case
      when v_conn.id is null then null
      else jsonb_build_object(
        'id', v_conn.id,
        'provider', v_conn.provider,
        'site_id', v_conn.site_id,
        'user_id', v_conn.user_id,
        'nickname', v_conn.nickname,
        'email', v_conn.email,
        'token_expires_at', v_conn.token_expires_at,
        'is_active', v_conn.is_active,
        'created_at', v_conn.created_at,
        'updated_at', v_conn.updated_at
      )
    end
  );
end;
$$;

grant execute on function public.ml_get_connection() to anon, authenticated;

-- ============================================================================
-- ML ENQUEUE (valida, deduplica e inserta en ml_sync_queue)
-- ============================================================================
create or replace function public.ml_enqueue(
  p_property_id uuid,
  p_operation ml_operation,
  p_internal boolean default false
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ml_enabled boolean;
  v_conn_id uuid;
  v_queue_id bigint;
begin
  if not p_internal and not public.is_staff() then
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
$$;

grant execute on function public.ml_enqueue(uuid, ml_operation, boolean) to authenticated;

-- ============================================================================
-- TRIGGERS DE AUTO-PUBLICACIÓN
-- ============================================================================

-- Al pasar a "publicada" se encola la publicación.
create or replace function public.ml_auto_publish()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'publicada'::public.property_status
     and old.status is distinct from new.status
  then
    perform public.ml_enqueue(new.id, 'publish', true);
  end if;
  return new;
end;
$$;

create trigger properties_ml_auto_publish
  after update of status on public.properties
  for each row when (old.status is distinct from new.status)
  execute function public.ml_auto_publish();

-- Al editar una propiedad ya publicada en ML se encola la actualización.
create or replace function public.ml_auto_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_item_id bigint;
begin
  if old.status <> 'publicada'::public.property_status
     and new.status <> 'publicada'::public.property_status
  then
    return new;
  end if;

  select ml_item_id into v_item_id
    from public.property_ml_meta
    where property_id = new.id;

  if v_item_id is null then
    return new;
  end if;

  if new.title is distinct from old.title
     or new.description is distinct from old.description
     or new.price is distinct from old.price
     or new.currency is distinct from old.currency
     or new.listing_type is distinct from old.listing_type
     or new.area_total is distinct from old.area_total
     or new.area_covered is distinct from old.area_covered
     or new.bedrooms is distinct from old.bedrooms
     or new.bathrooms is distinct from old.bathrooms
     or new.garages is distinct from old.garages
  then
    perform public.ml_enqueue(new.id, 'update', true);
  end if;

  return new;
end;
$$;

create trigger properties_ml_auto_update
  after update on public.properties
  for each row execute function public.ml_auto_update();

-- ============================================================================
-- SEED: settings nuevos del módulo ML
-- ============================================================================
insert into public.site_settings (key, value, value_type, is_public, description) values
  ('ml_app_id', '{"value": ""}', 'json', false, 'ID de aplicación de Mercado Libre (client_id) para el OAuth')
on conflict (key) do nothing;
