-- ============================================================================
-- 0017_newsletter.sql
-- BIENENHAUS — Newsletter
--   * Tabla newsletter_subscribers (suscripciones de la landing).
--   * Función subscribe_newsletter (SECURITY DEFINER): inserta sin abrir RLS
--     a anon; devuelve true si es una suscripción nueva, false si ya existía.
--   * RLS: solo staff puede leer/borrar. El alta pasa siempre por el RPC.
-- ============================================================================

create table public.newsletter_subscribers (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    source text not null default 'landing_footer',
    status text not null default 'activo',
    created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers
    add constraint newsletter_subscribers_email_check
    check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$');

create index newsletter_subscribers_created_at_idx
    on public.newsletter_subscribers (created_at desc);

-- ----------------------------------------------------------------------------
-- RPC público de suscripción (el único camino de escritura para anon).
-- ----------------------------------------------------------------------------

create or replace function public.subscribe_newsletter(
    p_email text,
    p_source text default 'landing_footer'
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
grant execute on function public.subscribe_newsletter(text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------

alter table public.newsletter_subscribers enable row level security;

create policy newsletter_subscribers_staff_select on public.newsletter_subscribers
    for select using (public.is_staff());

create policy newsletter_subscribers_staff_insert on public.newsletter_subscribers
    for insert with check (public.is_staff());

create policy newsletter_subscribers_staff_delete on public.newsletter_subscribers
    for delete using (public.is_staff());
