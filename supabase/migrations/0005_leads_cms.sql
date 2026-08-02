-- ============================================================================
-- 0004_leads_cms.sql
-- BIENENHAUS — CRM (leads, agents) y CMS (site_content EAV, site_settings).
-- ============================================================================

-- ============================================================================
-- AGENTS
-- ============================================================================
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  photo_url text,
  role text,
  bio text,
  specialties jsonb not null default '[]'::jsonb,
  social jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger agents_set_updated_at
  before update on public.agents
  for each row execute function public.set_updated_at();

-- ============================================================================
-- LEADS (CRM)
-- ============================================================================
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  last_name text not null,
  email text not null,
  phone text,
  city text,
  intent lead_intent not null default 'otro',
  message text,
  source lead_source not null default 'landing_form',
  -- Datos dinámicos del formulario según intención (presupuesto, ubicación, etc.).
  data jsonb not null default '{}'::jsonb,
  files jsonb not null default '[]'::jsonb,
  status lead_status not null default 'nuevo',
  assigned_to uuid references public.agents(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ============================================================================
-- SITE CONTENT (EAV — secciones editables de la landing)
-- ============================================================================
create table public.site_content (
  id uuid primary key default gen_random_uuid(),
  section content_section not null,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  locale text not null default 'es',
  is_active boolean not null default true,
  updated_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section, key, locale)
);

create trigger site_content_set_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();

-- ============================================================================
-- SITE SETTINGS (configuración global)
-- ============================================================================
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  value_type text not null default 'json' check (value_type in ('string', 'number', 'boolean', 'json')),
  is_public boolean not null default false,
  description text,
  updated_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();
