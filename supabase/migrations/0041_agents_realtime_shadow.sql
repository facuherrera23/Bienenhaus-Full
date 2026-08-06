-- ============================================================================
-- 0041_agents_realtime_shadow.sql
-- BIENENHAUS — Tabla shadow para Realtime de agentes (solo columnas públicas).
-- Permite suscripción realtime en landing sin exponer columnas sensibles
-- (commission, permissions, schedule) al rol anon.
-- ============================================================================

-- 1) Tabla shadow con solo columnas de display
create table public.agents_realtime (
  id uuid primary key,
  name text not null,
  matricula text,
  role text,
  photo_url text,
  bio text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índice para ordenamiento
create index agents_realtime_sort_idx on public.agents_realtime (sort_order asc, name);

-- 2) RLS: lectura pública solo activos
alter table public.agents_realtime enable row level security;

create policy agents_realtime_public_select on public.agents_realtime
  for select using (is_active = true);

create policy agents_realtime_staff_all on public.agents_realtime
  for all using (public.is_staff()) with check (public.is_staff());

-- 3) Trigger de sincronización desde public.agents
create or replace function public.sync_agents_realtime()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'DELETE') then
    delete from public.agents_realtime where id = old.id;
    return old;
  end if;

  if (TG_OP = 'INSERT' or TG_OP = 'UPDATE') then
    insert into public.agents_realtime (id, name, matricula, role, photo_url, bio, sort_order, is_active)
    values (new.id, new.name, new.matricula, new.role, new.photo_url, new.bio, new.sort_order, new.is_active)
    on conflict (id) do update set
      name = excluded.name,
      matricula = excluded.matricula,
      role = excluded.role,
      photo_url = excluded.photo_url,
      bio = excluded.bio,
      sort_order = excluded.sort_order,
      is_active = excluded.is_active,
      updated_at = now();
    return new;
  end if;

  return null;
end;
$$;

create trigger sync_agents_realtime
after insert or update or delete on public.agents
for each row execute function public.sync_agents_realtime();

-- 4) Poblar tabla shadow inicialmente
insert into public.agents_realtime (id, name, matricula, role, photo_url, bio, sort_order, is_active)
select id, name, matricula, role, photo_url, bio, sort_order, is_active
from public.agents
where is_active = true and deleted_at is null
on conflict (id) do nothing;

-- 5) Agregar a publicación Realtime (idempotente)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'agents_realtime') then
      alter publication supabase_realtime add table public.agents_realtime;
    end if;
  end if;
end
$$;

-- 6) Grant para anon (ya está en RLS, pero por seguridad)
grant select on public.agents_realtime to anon;