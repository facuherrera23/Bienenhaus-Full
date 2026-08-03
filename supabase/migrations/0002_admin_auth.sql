-- ============================================================================
-- 0002_admin_auth.sql
-- BIENENHAUS — admin_users (mapeo a auth.users) y activity_log.
-- ============================================================================

-- ============================================================================
-- ADMIN USERS
-- ============================================================================
-- Cada fila corresponde a un usuario de auth.users con acceso al panel.
create table public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role admin_role not null default 'staff',
  is_active boolean not null default true,
  must_change_password boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admin_users_set_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ACTIVITY LOG
-- ============================================================================
create table public.activity_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action audit_action not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip text,
  created_at timestamptz not null default now()
);

create index activity_log_actor_idx on public.activity_log (actor_id, created_at desc);
create index activity_log_entity_idx on public.activity_log (entity_type, entity_id);

-- ============================================================================
-- HELPER: Función para crear admin_user desde Edge Function / Service Role
-- ============================================================================
-- Esta función debe ser llamada con service_role key (bypassa RLS)
create or replace function public.create_admin_user(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_role admin_role default 'staff'
) returns public.admin_users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.admin_users;
begin
  insert into public.admin_users (id, email, full_name, role, is_active, must_change_password)
  values (p_user_id, p_email, p_full_name, p_role, true, true)
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    is_active = true,
    updated_at = now()
  returning * into v_result;
  return v_result;
end;
$$;

-- ============================================================================
-- HELPER: Función para actualizar último login
-- ============================================================================
create or replace function public.update_admin_last_login(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.admin_users
  set last_login_at = now(), updated_at = now()
  where id = p_user_id;
end;
$$;
