-- 0023_audit_log.sql
-- Tabla de auditoría para trazabilidad completa

create table if not exists public.audit_logs (
  id bigserial primary key,
  
  -- Actor
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  actor_role text,
  actor_ip inet,
  actor_user_agent text,
  
  -- Acción
  action text not null,           -- create, update, delete, publish, unpublish, login, logout, sync, export, etc.
  entity_type text not null,      -- property, lead, agent, visit, ml_item, user, setting, etc.
  entity_id uuid,                 -- ID de la entidad afectada
  entity_title text,              -- Título legible para UI
  
  -- Cambios (para updates)
  old_values jsonb,
  new_values jsonb,
  changed_fields text[],          -- Lista de campos modificados
  
  -- Contexto
  request_id uuid,                -- Correlation ID para trazar requests
  metadata jsonb,                 -- Datos extra flexibles
  
  -- Resultado
  status text not null default 'success' check (status in ('success', 'failure', 'partial')),
  error_message text,
  
  -- Timestamp
  created_at timestamptz not null default now()
);

-- Índices para consultas comunes
create index if not exists idx_audit_logs_actor_id on public.audit_logs (actor_id);
create index if not exists idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);
create index if not exists idx_audit_logs_action on public.audit_logs (action);
create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);
create index if not exists idx_audit_logs_request_id on public.audit_logs (request_id);
create index if not exists idx_audit_logs_status on public.audit_logs (status);

-- Particionado por mes (opcional, para tablas grandes)
-- create table public.audit_logs_2026_01 partition of public.audit_logs
--   for values from ('2026-01-01') to ('2026-02-01');

-- RLS
alter table public.audit_logs enable row level security;

-- Solo admins pueden ver logs de auditoría
create policy "Admins can view audit logs" on public.audit_logs
  for select using (
    exists (
      select 1 from public.admin_users
      where id = auth.uid() and is_active and role in ('super_admin', 'admin', 'staff')
    )
  );

-- Service role puede insertar (para triggers y edge functions)
create policy "Service role can insert audit logs" on public.audit_logs
  for insert with check (true);

-- Trigger para updated_at
create trigger trg_audit_logs_updated_at
  before update on public.audit_logs
  for each row execute function public.set_updated_at();

-- Función helper para insertar logs de auditoría (llamable desde RPC)
create or replace function public.log_audit(
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_entity_title text default null,
  p_old_values jsonb default null,
  p_new_values jsonb default null,
  p_changed_fields text[] default null,
  p_metadata jsonb default null,
  p_status text default 'success',
  p_error_message text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_actor_email text;
  v_actor_role text;
  v_request_id uuid;
begin
  -- Obtener info del usuario actual
  select auth.uid(), auth.email(), auth.role()
  into v_actor_id, v_actor_email, v_actor_role;
  
  -- Request ID del header (si viene via edge function)
  v_request_id := current_setting('request.jwt.claims', true)::jsonb ->> 'request_id'::text;
  if v_request_id is null then
    v_request_id := gen_random_uuid();
  end if;

  insert into public.audit_logs (
    actor_id,
    actor_email,
    actor_role,
    actor_ip,
    actor_user_agent,
    action,
    entity_type,
    entity_id,
    entity_title,
    old_values,
    new_values,
    changed_fields,
    metadata,
    status,
    error_message,
    request_id
  ) values (
    v_actor_id,
    v_actor_email,
    v_actor_role,
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb ->> 'user-agent',
    p_action,
    p_entity_type,
    p_entity_id,
    p_entity_title,
    p_old_values,
    p_new_values,
    p_changed_fields,
    p_metadata,
    p_status,
    p_error_message,
    v_request_id
  );
end;
$$;

-- Trigger genérico para tablas con audit (ejemplo para properties)
-- Se puede replicar para leads, agents, visits, etc.
create or replace function public.audit_trigger()
returns trigger
language plpgsql
as $$
declare
  v_action text;
  v_old jsonb;
  v_new jsonb;
  v_changed text[];
begin
  v_action := lower(tg_op);
  
  if tg_op = 'INSERT' then
    v_old := null;
    v_new := to_jsonb(NEW);
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    -- Calcular campos cambiados
    v_changed := array(
      select key from jsonb_each_text(to_jsonb(NEW)) n
      full join jsonb_each_text(to_jsonb(OLD)) o on n.key = o.key
      where n.value is distinct from o.value
        and n.key not in ('created_at', 'updated_at', 'deleted_at')
    );
  elsif tg_op = 'DELETE' then
    v_old := to_jsonb(OLD);
    v_new := null;
  end if;

  -- Llamar a la función de logging
  perform public.log_audit(
    p_action := v_action,
    p_entity_type := TG_TABLE_NAME,
    p_entity_id := COALESCE(NEW.id, OLD.id),
    p_entity_title := COALESCE(
      (to_jsonb(NEW) ->> 'title'),
      (to_jsonb(NEW) ->> 'name'),
      (to_jsonb(OLD) ->> 'title'),
      (to_jsonb(OLD) ->> 'name')
    ),
    p_old_values := v_old,
    p_new_values := v_new,
    p_changed_fields := v_changed,
    p_metadata := jsonb_build_object('trigger', true),
    p_status := 'success'
  );
  
  return null; -- AFTER trigger
end;
$$;

-- Ejemplo: aplicar trigger a properties
drop trigger if exists trg_properties_audit on public.properties;
create trigger trg_properties_audit
  after insert or update or delete on public.properties
  for each row execute function public.audit_trigger();

-- Ejemplo: aplicar trigger a leads
drop trigger if exists trg_leads_audit on public.leads;
create trigger trg_leads_audit
  after insert or update or delete on public.leads
  for each row execute function public.audit_trigger();

-- Ejemplo: aplicar trigger a agents
drop trigger if exists trg_agents_audit on public.agents;
create trigger trg_agents_audit
  after insert or update or delete on public.agents
  for each row execute function public.audit_trigger();

-- Ejemplo: aplicar trigger a visits
drop trigger if exists trg_visits_audit on public.visits;
create trigger trg_visits_audit
  after insert or update or delete on public.visits
  for each row execute function public.audit_trigger();

-- Ejemplo: aplicar trigger a admin_users
drop trigger if exists trg_admin_users_audit on public.admin_users;
create trigger trg_admin_users_audit
  after insert or update or delete on public.admin_users
  for each row execute function public.audit_trigger();

-- Función para limpiar logs antiguos (ejecutar via cron job)
create or replace function public.cleanup_audit_logs(p_retention_days int default 365)
returns int
language plpgsql
as $$
declare
  v_deleted int;
begin
  delete from public.audit_logs
  where created_at < now() - (p_retention_days || ' days')::interval;
  
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;