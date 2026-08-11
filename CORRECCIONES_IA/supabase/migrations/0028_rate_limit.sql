-- ============================================================================
-- 0028_rate_limit.sql
-- BIENENHAUS — Anti-spam en los RPC públicos de la landing
--   * Honeypot: si p_hp viene con contenido, el request es de un bot → se
--     responde éxito sin hacer nada (el bot "gana" y no vuelve a insistir).
--   * Rate limit por ventana de tiempo (sin depender de IP, que PostgREST no
--     expone de forma fiable): tope de altas por hora (global) y, para el
--     formulario de contacto, tope de 1 consulta por email cada 24h.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- subscribe_newsletter: + p_hp y tope de 50 altas/hora.
-- ----------------------------------------------------------------------------

create or replace function public.subscribe_newsletter(
    p_email text,
    p_source text default 'landing_footer',
    p_hp text default ''
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_id uuid;
    v_email text := lower(btrim(p_email));
begin
    -- Honeypot: si el campo oculto viene con texto, es un bot.
    if btrim(coalesce(p_hp, '')) <> '' then
        return true;
    end if;

    -- Rate limit: no más de 50 altas por hora (ventana global).
    if (select count(*) from public.newsletter_subscribers
        where created_at > now() - interval '1 hour') >= 50 then
        raise exception 'Demasiadas solicitudes, intentá más tarde';
    end if;

    if v_email = '' or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' then
        raise exception 'Email inválido';
    end if;

    insert into public.newsletter_subscribers (email, source)
    values (v_email, coalesce(nullif(btrim(p_source), ''), 'landing_footer'))
    on conflict (email) do nothing
    returning id into v_id;

    return v_id is not null;
end;
$$;

revoke all on function public.subscribe_newsletter(text, text) from public;
revoke all on function public.subscribe_newsletter(text, text, text) from public;
grant execute on function public.subscribe_newsletter(text, text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- submit_contact: + p_hp, tope de 30 consultas/hora y 1 por email cada 24h.
-- ----------------------------------------------------------------------------

create or replace function public.submit_contact(
    p_name text,
    p_last_name text,
    p_email text,
    p_phone text default null,
    p_city text default null,
    p_intent lead_intent default 'otro',
    p_message text default null,
    p_data jsonb default '{}'::jsonb,
    p_files jsonb default '[]'::jsonb,
    p_hp text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_id uuid;
begin
    -- Honeypot: respuesta de éxito falsa para bots.
    if btrim(coalesce(p_hp, '')) <> '' then
        return '00000000-0000-0000-0000-000000000000'::uuid;
    end if;

    -- Rate limit global: no más de 30 consultas por hora.
    if (select count(*) from public.leads
        where created_at > now() - interval '1 hour') >= 30 then
        raise exception 'Demasiadas solicitudes, intentá más tarde';
    end if;

    -- Rate limit por email: máximo 1 consulta cada 24h.
    if exists (select 1 from public.leads
               where lower(email) = lower(btrim(p_email))
                 and created_at > now() - interval '1 day') then
        raise exception 'Ya recibimos una consulta con este email, intentá mañana';
    end if;

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
revoke all on function public.submit_contact(text, text, text, text, text, lead_intent, text, jsonb, jsonb, text) from public;
grant execute on function public.submit_contact(text, text, text, text, text, lead_intent, text, jsonb, jsonb, text) to anon, authenticated;
