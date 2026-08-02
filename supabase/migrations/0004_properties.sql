-- ============================================================================
-- 0003_properties.sql
-- BIENENHAUS — Núcleo inmobiliario: properties, imágenes, videos, history.
-- ============================================================================

-- ============================================================================
-- PROPERTIES
-- ============================================================================
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  code serial not null unique,
  title text not null,
  slug text not null unique,
  description text,
  status property_status not null default 'borrador',
  listing_type listing_type not null default 'venta',
  price numeric(14, 2),
  currency currency not null default 'USD',
  expenses numeric(14, 2),
  address text,
  location_id uuid references public.locations(id) on delete set null,
  latitude double precision,
  longitude double precision,
  area_total numeric(10, 2),
  area_covered numeric(10, 2),
  bedrooms integer,
  bathrooms integer,
  garages integer,
  year_built integer,
  floors integer,
  amenities jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  published_at timestamptz,
  views_count bigint not null default 0,
  favorites_count bigint not null default 0,
  created_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint properties_price_check check (
    price is null or price >= 0
  ),
  constraint properties_area_check check (
    area_total is null or area_total >= 0
  ),
  constraint properties_bedrooms_check check (
    bedrooms is null or bedrooms >= 0
  ),
  constraint properties_year_check check (
    year_built is null or (year_built between 1800 and extract(year from now())::int)
  )
);

create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- ============================================================================
-- PROPERTY IMAGES
-- ============================================================================
create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  url text not null,
  alt text,
  position integer not null default 0,
  is_cover boolean not null default false,
  cloudinary_public_id text,
  created_at timestamptz not null default now()
);

-- Índice de búsqueda de cover para las queries del catálogo.
create index property_images_property_position_idx
  on public.property_images (property_id, position);

create unique index property_images_one_cover_idx
  on public.property_images (property_id)
  where is_cover = true;

-- ============================================================================
-- PROPERTY VIDEOS
-- ============================================================================
create table public.property_videos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  url text not null,
  thumbnail text,
  title text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- PROPERTY FEATURES (join N:M)
-- ============================================================================
create table public.property_features (
  property_id uuid not null references public.properties(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  primary key (property_id, feature_id)
);

-- ============================================================================
-- PROPERTY TAGS (join N:M)
-- ============================================================================
create table public.property_tags (
  property_id uuid not null references public.properties(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (property_id, tag_id)
);

-- ============================================================================
-- PROPERTIES HISTORY (versionado + auditoría de cambios)
-- ============================================================================
create table public.properties_history (
  id bigint generated always as identity primary key,
  property_id uuid not null references public.properties(id) on delete cascade,
  change_type audit_action not null,
  data jsonb not null default '{}'::jsonb,
  changed_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index properties_history_property_idx
  on public.properties_history (property_id, created_at desc);
