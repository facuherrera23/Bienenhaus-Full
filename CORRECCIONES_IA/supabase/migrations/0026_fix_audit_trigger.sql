-- 0026_fix_audit_trigger.sql
-- Fix: audit_trigger() crasheaba con "record new has no field title" en
-- tablas sin columnas title/name (admin_users, agents, leads, visits).
-- Se usa to_jsonb + ->> que no falla por columnas inexistentes.
-- Fix adicional: alias en jsonb_each_text para evitar "column reference key is ambiguous"
-- Fix: SECURITY DEFINER para bypass RLS en activity_log

create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
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
    v_changed := array(
      select n.key from jsonb_each_text(to_jsonb(NEW)) n
      full join jsonb_each_text(to_jsonb(OLD)) o on n.key = o.key
      where n.value is distinct from o.value
        and n.key not in ('created_at', 'updated_at', 'deleted_at')
    );
  elsif tg_op = 'DELETE' then
    v_old := to_jsonb(OLD);
    v_new := null;
  end if;

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

  return null;
end;
$$;
