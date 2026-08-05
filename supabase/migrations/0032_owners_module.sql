-- ============================================================
-- 0032_owners_module.sql
-- Módulo de Propietarios, Análisis de Precio, Planes de Acción
-- ============================================================

-- Enums
create type owner_type as enum ('persona_fisica', 'persona_juridica');
create type owner_preferred_contact as enum ('email', 'whatsapp', 'call');
create type price_status as enum ('way_below', 'below', 'fair', 'above', 'way_above', 'premium');
create type market_trend as enum ('rising', 'stable', 'falling');
create type action_plan_category as enum ('pricing', 'marketing', 'condition', 'legal', 'other');
create type action_plan_priority as enum ('low', 'medium', 'high', 'urgent');
create type action_plan_status as enum ('pending', 'in_progress', 'completed', 'cancelled');
create type communication_type as enum ('email', 'whatsapp', 'call', 'meeting', 'report', 'note');
create type communication_status as enum ('draft', 'sent', 'delivered', 'read', 'failed');
create type report_type as enum ('price_analysis', 'visit_summary', 'market_update', 'weekly', 'monthly', 'custom');

-- 1. PROPIETARIOS
create table owners (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  dni_cuit text unique,
  address text,
  owner_type owner_type default 'persona_fisica',
  company_name text,
  notes text,
  preferred_contact owner_preferred_contact default 'whatsapp',
  created_by uuid references admin_users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- 2. RELACIÓN PROPIEDAD ↔ PROPIETARIO (muchos a muchos)
create table property_owners (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  owner_id uuid not null references owners(id) on delete cascade,
  ownership_percentage numeric(5,2) default 100 check (ownership_percentage > 0 and ownership_percentage <= 100),
  is_primary_contact boolean default false,
  role text default 'propietario',
  created_at timestamptz default now(),
  unique(property_id, owner_id)
);

create index idx_property_owners_owner_id on property_owners(owner_id);
create index idx_property_owners_property_id on property_owners(property_id);

-- 3. ANÁLISIS DE PRECIO
create table property_price_analyses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  estimated_market_price numeric not null check (estimated_market_price >= 0),
  price_per_sqm_market numeric,
  our_listing_price numeric not null,
  price_difference_pct numeric generated always as (
    case when estimated_market_price > 0 
    then round(((our_listing_price - estimated_market_price) / estimated_market_price * 100)::numeric, 2)
    else 0 end
  ) stored,
  price_status price_status,
  market_trend market_trend default 'stable',
  comparable_properties jsonb default '[]',
  recommendation text,
  notes text,
  analyzed_by uuid references admin_users(id),
  analysis_date timestamptz default now(),
  valid_until timestamptz,
  created_at timestamptz default now()
);

-- 4. PLANES DE ACCIÓN
create table property_action_plans (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  owner_id uuid references owners(id) on delete set null,
  title text not null,
  description text,
  category action_plan_category default 'other',
  priority action_plan_priority default 'medium',
  status action_plan_status default 'pending',
  due_date timestamptz,
  completed_at timestamptz,
  assigned_to uuid references admin_users(id),
  created_by uuid references admin_users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- 5. TAREAS DEL PLAN
create table action_plan_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references property_action_plans(id) on delete cascade,
  title text not null,
  description text,
  status action_plan_status default 'pending',
  due_date timestamptz,
  completed_at timestamptz,
  assigned_to uuid references admin_users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. COMUNICACIONES CON PROPIETARIO
create table owner_communications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references owners(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  type communication_type not null,
  subject text,
  content text,
  status communication_status default 'draft',
  sent_at timestamptz,
  sent_by uuid references admin_users(id),
  created_at timestamptz default now()
);

-- 7. REPORTES GENERADOS
create table owner_reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  owner_id uuid not null references owners(id) on delete cascade,
  report_type report_type not null,
  title text,
  content_json jsonb default '{}',
  pdf_url text,
  generated_at timestamptz default now(),
  sent_at timestamptz,
  status communication_status default 'draft',
  created_by uuid references admin_users(id)
);

-- Triggers para updated_at
create trigger set_owners_updated_at
  before update on owners
  for each row execute procedure set_updated_at();

create trigger set_property_action_plans_updated_at
  before update on property_action_plans
  for each row execute procedure set_updated_at();

create trigger set_action_plan_tasks_updated_at
  before update on action_plan_tasks
  for each row execute procedure set_updated_at();

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table owners enable row level security;
alter table property_owners enable row level security;
alter table property_price_analyses enable row level security;
alter table property_action_plans enable row level security;
alter table action_plan_tasks enable row level security;
alter table owner_communications enable row level security;
alter table owner_reports enable row level security;

-- Staff puede hacer todo (super_admin, admin, staff)
create policy "staff_manage_owners" on owners for all to authenticated using (is_staff());
create policy "staff_manage_property_owners" on property_owners for all to authenticated using (is_staff());
create policy "staff_manage_price_analyses" on property_price_analyses for all to authenticated using (is_staff());
create policy "staff_manage_action_plans" on property_action_plans for all to authenticated using (is_staff());
create policy "staff_manage_action_tasks" on action_plan_tasks for all to authenticated using (is_staff());
create policy "staff_manage_communications" on owner_communications for all to authenticated using (is_staff());
create policy "staff_manage_reports" on owner_reports for all to authenticated using (is_staff());

-- Viewers solo pueden leer (usando has_role)
create policy "viewer_read_owners" on owners for select to authenticated using (has_role('viewer'));
create policy "viewer_read_property_owners" on property_owners for select to authenticated using (has_role('viewer'));
create policy "viewer_read_price_analyses" on property_price_analyses for select to authenticated using (has_role('viewer'));
create policy "viewer_read_action_plans" on property_action_plans for select to authenticated using (has_role('viewer'));
create policy "viewer_read_action_tasks" on action_plan_tasks for select to authenticated using (has_role('viewer'));
create policy "viewer_read_communications" on owner_communications for select to authenticated using (has_role('viewer'));
create policy "viewer_read_reports" on owner_reports for select to authenticated using (has_role('viewer'));

-- ============================================================
-- TRIGGERS DE AUDITORÍA (activity_log)
-- ============================================================

-- Trigger para owners
create trigger audit_owners_change
  after insert or update or delete on owners
  for each row execute procedure audit_property_change();

-- Trigger para property_price_analyses
create trigger audit_price_analyses_change
  after insert or update or delete on property_price_analyses
  for each row execute procedure audit_property_change();

-- Trigger para property_action_plans
create trigger audit_action_plans_change
  after insert or update or delete on property_action_plans
  for each row execute procedure audit_property_change();

-- Trigger para owner_communications
create trigger audit_communications_change
  after insert or update or delete on owner_communications
  for each row execute procedure audit_property_change();

-- Trigger para owner_reports
create trigger audit_reports_change
  after insert or update or delete on owner_reports
  for each row execute procedure audit_property_change();