-- ============================================================================
-- 0013_contact_landing.sql
-- BIENENHAUS — Captación de leads desde la landing Contáctanos (HTML estático)
--   * Función submit_contact (SECURITY DEFINER): inserta en public.leads con
--     source='landing_form' y status='nuevo' de forma segura.
--   * No se abre RLS a anon: la función valida campos y fija el origen.
-- ============================================================================

create or replace function public.submit_contact(
  p_name text,
  p_last_name text,
  p_email text,
  p_phone text default null,
  p_city text default null,
  p_intent lead_intent default 'otro',
  p_message text default null,
  p_data jsonb default '{}'::jsonb,
  p_files jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  -- Validación básica anti-spam / datos incompletos.
  if nullif(btrim(p_name), '') is null
     or nullif(btrim(p_last_name), '') is null
     or nullif(btrim(p_email), '') is null
     or btrim(p_email) !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' then
    raise exception 'Datos de contacto inválidos';
  end if;

  insert into public.leads (
    name, last_name, email, phone, city, intent, message, source, status, data, files
  )
  values (
    btrim(p_name),
    btrim(p_last_name),
    lower(btrim(p_email)),
    nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(btrim(coalesce(p_city, '')), ''),
    coalesce(p_intent, 'otro'),
    nullif(btrim(coalesce(p_message, '')), ''),
    'landing_form',
    'nuevo',
    coalesce(p_data, '{}'::jsonb),
    coalesce(p_files, '[]'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_contact(text, text, text, text, text, lead_intent, text, jsonb, jsonb) from public;
grant execute on function public.submit_contact(text, text, text, text, text, lead_intent, text, jsonb, jsonb) to anon, authenticated;
