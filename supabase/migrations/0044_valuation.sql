-- ============================================================================
-- 0044_valuation.sql
-- BIENENHAUS — Módulo Tasar: esquema de valuaciones (port de TAI.html).
-- 5 tablas: property_valuations (principal), valuation_comparables,
-- valuation_images, valuation_history (auditoría automática), geocode_cache.
-- Staff-only: RLS con is_staff() + owner read; sin acceso anon (defensa en
-- profundidad, mismo patrón que 0042/0043).
-- ============================================================================

-- ============================================================================
-- 1) property_valuations — tabla principal (120+ campos, port exacto TAI.html)
-- ============================================================================
create table if not exists public.property_valuations (
  id uuid primary key default gen_random_uuid(),
  -- Datos cliente
  solicitante text not null,
  fecha date not null,
  telefono text,
  destino text not null check (destino in ('Venta','Alquiler')),
  -- Foto fachada
  foto_fachada_url text,
  -- Datos inmueble
  direccion text not null,
  barrio text,
  localidad text,
  provincia text,
  sup_terreno numeric,
  sup_construida numeric,
  tipo text not null check (tipo in ('CASA','DEPTO','LOTE','GALPON','OFICINA','LOCAL','OTRO')),
  precio_dolar numeric,
  valor_uva numeric,
  -- Descripcion propiedad
  tipo_construccion text,
  espacio_habitable numeric,
  plantas numeric,
  anio_construccion numeric,
  imp_inmobiliarios numeric,
  tipo_techo text,
  orientacion text,
  luminosidad text,
  calidad_constructiva text,
  calidad_mantenimiento text,
  detalles_terminacion text,
  estacionamiento_tipo text,
  -- Ambientes (18 campos)
  amb_cocina numeric default 0,
  amb_dormitorios numeric default 0,
  amb_terraza numeric default 0,
  amb_comedor numeric default 0,
  amb_suite numeric default 0,
  amb_patio numeric default 0,
  amb_cocina_comedor numeric default 0,
  amb_suite_vestidor numeric default 0,
  amb_balcon numeric default 0,
  amb_living numeric default 0,
  amb_dormit_vestidor numeric default 0,
  amb_lavadero numeric default 0,
  amb_living_comedor numeric default 0,
  amb_bano_servicio numeric default 0,
  amb_cuarto_guardado numeric default 0,
  amb_escritorio numeric default 0,
  amb_bano numeric default 0,
  amb_garage numeric default 0,
  amb_total_cuartos numeric generated always as (
    amb_cocina + amb_dormitorios + amb_terraza + amb_comedor + amb_suite + amb_patio +
    amb_cocina_comedor + amb_suite_vestidor + amb_balcon + amb_living + amb_dormit_vestidor +
    amb_lavadero + amb_living_comedor + amb_bano_servicio + amb_cuarto_guardado +
    amb_escritorio + amb_bano + amb_garage
  ) stored,
  -- Comodidades
  com_doble_circulacion text,
  com_asador text,
  com_piscina text,
  -- Servicios basicos
  calefaccion text,
  aire_acondicionado text,
  agua_caliente text,
  -- Adversas
  caracteristicas_adversas text,
  -- Servicios (6 rubros)
  serv_electricidad text,
  serv_gas text,
  serv_internet text,
  serv_agua text,
  serv_cloaca text,
  serv_techos text,
  -- Barrio
  tipologias_edilicias text,
  calidad_constructiva_predom text,
  construccion_altura_prevalencia text,
  uso_comercial_prevalencia text,
  uso_industrial_prevalencia text,
  nivel_socioeconomico_barrio text,
  barrio_tipo text,
  construido_pct text,
  indice_crecimiento text,
  serv_vigilancia text,
  tendencia_valores text,
  demanda_oferta text,
  tiempo_comercializacion text,
  cambios_uso_terreno text,
  facilidades_estacionamiento text,
  uso_residencial numeric,
  uso_comercial numeric,
  uso_industrial numeric,
  uso_otro numeric generated always as (
    greatest(0, 100 - coalesce(uso_residencial,0) - coalesce(uso_comercial,0) - coalesce(uso_industrial,0))
  ) stored,
  -- Valuacion
  v_terreno_precio numeric,
  -- Estado
  locked boolean default false,
  finalized_at timestamptz,
  -- Auditoria estandar
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

-- Índices para consultas comunes (lista, owner read, soft delete)
create index if not exists property_valuations_created_at_idx on public.property_valuations (created_at desc);
create index if not exists property_valuations_created_by_idx on public.property_valuations (created_by);
create index if not exists property_valuations_deleted_at_idx on public.property_valuations (deleted_at);

-- ============================================================================
-- 2) valuation_comparables — comparables del análisis (hasta 6 por tasación)
-- ============================================================================
create table if not exists public.valuation_comparables (
  id uuid primary key default gen_random_uuid(),
  valuation_id uuid not null references public.property_valuations(id) on delete cascade,
  orden int not null,
  direccion text,
  barrio text,
  precio numeric,
  sup_terreno numeric,
  sup_cubierta numeric,
  dias numeric,
  tipo_construccion text,
  antiguedad numeric,
  foto_url text,
  url_origen text,
  chars jsonb not null default '[]'::jsonb, -- array de 6 strings (NIVELES)
  included boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists valuation_comparables_valuation_idx on public.valuation_comparables (valuation_id, orden);
create index if not exists valuation_comparables_orden_idx on public.valuation_comparables (orden);

-- ============================================================================
-- 3) valuation_images — fotos fachada + comparables unificadas
-- ============================================================================
create table if not exists public.valuation_images (
  id uuid primary key default gen_random_uuid(),
  valuation_id uuid not null references public.property_valuations(id) on delete cascade,
  comparable_id uuid references public.valuation_comparables(id) on delete set null, -- null = fachada
  url text not null,
  tipo text not null check (tipo in ('fachada','comparable')),
  orden int default 0,
  created_at timestamptz default now()
);

create index if not exists valuation_images_valuation_idx on public.valuation_images (valuation_id, tipo, orden);
create index if not exists valuation_images_comparable_idx on public.valuation_images (comparable_id);

-- ============================================================================
-- 4) valuation_history — auditoría automática de cambios por tasación
-- ============================================================================
create table if not exists public.valuation_history (
  id uuid primary key default gen_random_uuid(),
  valuation_id uuid not null references public.property_valuations(id) on delete cascade,
  action text not null, -- insert | update | delete
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists valuation_history_valuation_idx on public.valuation_history (valuation_id, created_at desc);

-- ============================================================================
-- 5) geocode_cache — cache de geocodificación (Nominatim 1 req/s → cache)
-- ============================================================================
create table if not exists public.geocode_cache (
  query text primary key,            -- query normalizada (direccion + localidad)
  lat double precision,
  lon double precision,
  display_name text,
  raw jsonb,                         -- respuesta completa de Nominatim
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 6) RLS — staff CRUD + owner read; sin acceso anon
-- ============================================================================
alter table public.property_valuations enable row level security;
alter table public.valuation_comparables enable row level security;
alter table public.valuation_images enable row level security;
alter table public.valuation_history enable row level security;
alter table public.geocode_cache enable row level security;

-- property_valuations
drop policy if exists valuation_staff_all on public.property_valuations;
create policy valuation_staff_all on public.property_valuations
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists valuation_owner_read on public.property_valuations;
create policy valuation_owner_read on public.property_valuations
  for select using (created_by = auth.uid());

-- valuation_comparables (staff all; owner read vía padre)
drop policy if exists valuation_comparables_staff_all on public.valuation_comparables;
create policy valuation_comparables_staff_all on public.valuation_comparables
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists valuation_comparables_owner_read on public.valuation_comparables;
create policy valuation_comparables_owner_read on public.valuation_comparables
  for select using (
    exists (
      select 1 from public.property_valuations pv
      where pv.id = valuation_id and pv.created_by = auth.uid()
    )
  );

-- valuation_images (staff all; owner read vía padre)
drop policy if exists valuation_images_staff_all on public.valuation_images;
create policy valuation_images_staff_all on public.valuation_images
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists valuation_images_owner_read on public.valuation_images;
create policy valuation_images_owner_read on public.valuation_images
  for select using (
    exists (
      select 1 from public.property_valuations pv
      where pv.id = valuation_id and pv.created_by = auth.uid()
    )
  );

-- valuation_history (solo lectura; inserts vía trigger security definer)
drop policy if exists valuation_history_staff_read on public.valuation_history;
create policy valuation_history_staff_read on public.valuation_history
  for select using (public.is_staff());
drop policy if exists valuation_history_owner_read on public.valuation_history;
create policy valuation_history_owner_read on public.valuation_history
  for select using (
    exists (
      select 1 from public.property_valuations pv
      where pv.id = valuation_id and pv.created_by = auth.uid()
    )
  );

-- geocode_cache (staff only)
drop policy if exists geocode_cache_staff_all on public.geocode_cache;
create policy geocode_cache_staff_all on public.geocode_cache
  for all using (public.is_staff()) with check (public.is_staff());

-- ============================================================================
-- 7) Triggers — updated_at + auditoría + lock guard
-- ============================================================================

-- updated_at (usa public.set_updated_at() de 0001)
drop trigger if exists trg_property_valuations_updated_at on public.property_valuations;
create trigger trg_property_valuations_updated_at
  before update on public.property_valuations
  for each row execute function public.set_updated_at();

drop trigger if exists trg_valuation_comparables_updated_at on public.valuation_comparables;
create trigger trg_valuation_comparables_updated_at
  before update on public.valuation_comparables
  for each row execute function public.set_updated_at();

drop trigger if exists trg_geocode_cache_updated_at on public.geocode_cache;
create trigger trg_geocode_cache_updated_at
  before update on public.geocode_cache
  for each row execute function public.set_updated_at();

-- Lock guard: una vez bloqueada (locked=true), solo se puede desbloquear o
-- finalizar; cualquier otra edición queda prohibida (decisión #6 de AD).
create or replace function public.valuation_prevent_locked_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (old.locked and new.locked) then
    raise exception 'Valuación bloqueada: desbloqueá para editar';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_property_valuations_lock_guard on public.property_valuations;
create trigger trg_property_valuations_lock_guard
  before update on public.property_valuations
  for each row execute function public.valuation_prevent_locked_update();

-- Auditoría automática → valuation_history (security definer para escribir
-- aun cuando el usuario solo tiene SELECT sobre la tabla de history).
create or replace function public.valuation_history_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
  v_changed_by uuid;
begin
  v_action := lower(tg_op);
  v_changed_by := auth.uid();

  if tg_op = 'DELETE' then
    insert into public.valuation_history (valuation_id, action, old_data, new_data, changed_by)
    values (old.id, v_action, to_jsonb(old), null, v_changed_by);
  elsif tg_op = 'UPDATE' then
    insert into public.valuation_history (valuation_id, action, old_data, new_data, changed_by)
    values (new.id, v_action, to_jsonb(old), to_jsonb(new), v_changed_by);
  else -- INSERT
    insert into public.valuation_history (valuation_id, action, old_data, new_data, changed_by)
    values (new.id, v_action, null, to_jsonb(new), v_changed_by);
  end if;

  return null; -- AFTER trigger
end;
$$;

drop trigger if exists trg_property_valuations_history on public.property_valuations;
create trigger trg_property_valuations_history
  after insert or update or delete on public.property_valuations
  for each row execute function public.valuation_history_trigger();

-- ============================================================================
-- 8) Grants — staff-only: revoke anon (default privileges de 0008 dan acceso
--    a anon a tablas nuevas; lo removemos explícitamente). authenticated +
--    service_role conservan acceso (RLS filtra con is_staff()).
-- ============================================================================
revoke all on table public.property_valuations from anon;
revoke all on table public.valuation_comparables from anon;
revoke all on table public.valuation_images from anon;
revoke all on table public.valuation_history from anon;
revoke all on table public.geocode_cache from anon;

-- Funciones de trigger: no deben ser ejecutables por public/anon
revoke execute on function public.valuation_prevent_locked_update() from public, anon;
revoke execute on function public.valuation_history_trigger() from public, anon;