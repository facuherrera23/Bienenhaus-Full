-- ============================================================================
-- 0006_mercado_libre.sql
-- BIENENHAUS — Integración con Mercado Libre.
-- ============================================================================

-- ============================================================================
-- ML CONNECTION (OAuth de la cuenta de la inmobiliaria)
-- ============================================================================
-- Los tokens se guardan ENCRIPTADOS (AES-256-GCM) vía Edge Function.
-- El secret nunca vive en la base.
create table public.ml_connection (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'mercadolibre',
  site_id text not null default 'MLA',
  user_id bigint,
  nickname text,
  email text,
  access_token_encrypted text not null,
  access_token_iv text not null,
  refresh_token_encrypted text not null,
  refresh_token_iv text not null,
  token_expires_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ml_connection_set_updated_at
  before update on public.ml_connection
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ML SYNC QUEUE (cola de publicaciones/actualizaciones/borrados)
-- ============================================================================
create table public.ml_sync_queue (
  id bigint generated always as identity primary key,
  property_id uuid not null references public.properties(id) on delete cascade,
  operation ml_operation not null,
  status ml_sync_status not null default 'pending',
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  next_attempt_at timestamptz not null default now(),
  ml_item_id bigint,
  payload jsonb not null default '{}'::jsonb,
  last_error text,
  locked_by uuid,
  locked_at timestamptz,
  created_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ml_sync_queue_set_updated_at
  before update on public.ml_sync_queue
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ML SYNC HISTORY (registro de cada intento)
-- ============================================================================
create table public.ml_sync_history (
  id bigint generated always as identity primary key,
  queue_id bigint not null references public.ml_sync_queue(id) on delete cascade,
  operation ml_operation not null,
  status ml_sync_status not null,
  attempt integer not null,
  response jsonb,
  error text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- PROPERTY ML META (estado de cada propiedad en ML)
-- ============================================================================
create table public.property_ml_meta (
  property_id uuid primary key references public.properties(id) on delete cascade,
  ml_item_id bigint unique,
  listing_type_id bigint,
  category_id text,
  status text,
  permalink text,
  price numeric(14, 2),
  published_at timestamptz,
  last_sync_at timestamptz,
  last_sync_status ml_sync_status,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger property_ml_meta_set_updated_at
  before update on public.property_ml_meta
  for each row execute function public.set_updated_at();
