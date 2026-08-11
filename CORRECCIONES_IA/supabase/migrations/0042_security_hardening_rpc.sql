-- ============================================================================
-- 0042_security_hardening_rpc.sql
-- BIENENHAUS — Cierre de superficies RPC / SECURITY DEFINER abiertas a anon.
-- Auditoría de producción (cloud rnldqiwwzhjnurkguihu, 2026-08-07):
--   * ml_enqueue permitía a anon encolar operaciones ML con p_internal=true
--     (bypass de is_staff) -> operaciones reales sobre la cuenta Mercado Libre.
--   * ml_get_connection exponía email/nickname/user_id de la cuenta ML sin auth.
--   * audit_logs: policy "Service role can insert audit logs" con check=true
--     para PUBLIC permitía a anon insertar filas (envenenar el trail).
--   * log_audit / cleanup_audit_logs / audit_trigger ejecutables por anon.
--   * audit_trigger sin SET search_path (linter: function_search_path_mutable).
--   * Overloads muertos de submit_contact (sin p_hp) y subscribe_newsletter
--     (sin p_hp) quedaron tras 0028; solo service_role los ejecutaba.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) ml_enqueue: p_internal solo para service_role (backend/edge functions).
--    anon/authenticated ya no pueden saltarse is_staff() con p_internal=true.
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
    -- Modo interno: solo el backend (edge functions con service_role JWT).
    if auth.role() <> 'service_role' then
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
-- 2) ml_get_connection: exigir staff (evita fuga de datos de la cuenta ML).
-- ----------------------------------------------------------------------------
create or replace function public.ml_get_connection()
returns jsonb
language plpgsql
stable
security definer
set search_path = 'public'
as $function$
declare
  v_conn record;
  v_ml_enabled boolean;
begin
  if not public.is_staff() then
    raise exception 'No autorizado';
  end if;

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
$function$;

-- ----------------------------------------------------------------------------
-- 3) audit_logs: restringir INSERT a staff.
--    La policy anterior ("Service role can insert audit logs") tenía check=true
--    con alcance PUBLIC -> cualquier anon podía insertar filas. Los triggers
--    (SECURITY DEFINER) y service_role (bypassrls) no necesitan policy.
-- ----------------------------------------------------------------------------
drop policy if exists "Service role can insert audit logs" on public.audit_logs;
create policy audit_logs_staff_insert on public.audit_logs
  for insert with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- 4) audit_logs: endurecer grants a nivel tabla (defensa en profundidad).
--    anon pierde TODO; authenticated conserva solo select/insert (gateados por
--    las policies de staff). update/delete/truncate no tienen policy y no deben
--    quedar como grants.
-- ----------------------------------------------------------------------------
revoke all on table public.audit_logs from anon;
revoke update, delete, truncate, references, trigger on table public.audit_logs from authenticated;

-- ----------------------------------------------------------------------------
-- 5) Revocar EXECUTE de anon/authenticated en funciones de auditoría.
--    Los triggers no requieren EXECUTE y service_role conserva el suyo.
-- ----------------------------------------------------------------------------
revoke execute on function public.log_audit(text, text, uuid, text, jsonb, jsonb, text[], jsonb, text, text) from anon, authenticated;
revoke execute on function public.cleanup_audit_logs(integer) from anon, authenticated;
revoke execute on function public.audit_trigger() from anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6) Fijar search_path (linter: function_search_path_mutable).
-- ----------------------------------------------------------------------------
alter function public.audit_trigger() set search_path = 'public';
alter function public.cleanup_audit_logs(integer) set search_path = 'public';

-- ----------------------------------------------------------------------------
-- 7) Dropear overloads muertos (sin honeypot/rate-limit; solo service_role los
--    ejecutaba tras el revoke de 0028).
-- ----------------------------------------------------------------------------
drop function if exists public.submit_contact(text, text, text, text, text, lead_intent, text, jsonb, jsonb);
drop function if exists public.subscribe_newsletter(text, text);
