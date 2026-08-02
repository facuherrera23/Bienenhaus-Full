-- ============================================================================
-- 0002_taxonomies.sql
-- BIENENHAUS — Categorías, tipos, ubicaciones, amenities y tags.
-- ============================================================================

-- ============================================================================
-- CATEGORIES
-- ============================================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ============================================================================
-- PROPERTY TYPES
-- ============================================================================
create table public.property_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger property_types_set_updated_at
  before update on public.property_types
  for each row execute function public.set_updated_at();

-- ============================================================================
-- LOCATIONS
-- ============================================================================
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  zone text,
  parent_id uuid references public.locations(id) on delete set null,
  latitude double precision,
  longitude double precision,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

-- ============================================================================
-- FEATURES (amenities)
-- ============================================================================
create table public.features (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger features_set_updated_at
  before update on public.features
  for each row execute function public.set_updated_at();

-- ============================================================================
-- TAGS
-- ============================================================================
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tags_set_updated_at
  before update on public.tags
  for each row execute function public.set_updated_at();
