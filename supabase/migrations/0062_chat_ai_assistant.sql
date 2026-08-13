-- ============================================================================
-- 0062_chat_ai_assistant.sql
-- BIENENHAUS — Add is_ai column to agents and seed the virtual AI assistant.
-- ============================================================================

-- Add is_ai flag to agents table
alter table public.agents
  add column if not exists is_ai boolean not null default false;

-- Partial index for fast lookup of the AI agent
create index if not exists agents_is_ai_idx on public.agents (is_ai) where is_ai = true;

-- Seed the virtual AI assistant (idempotent via ON CONFLICT on unique email)
insert into public.agents (
  name,
  email,
  role,
  bio,
  specialties,
  social,
  is_active,
  is_ai,
  sort_order
) values (
  'Asistente BIENENHAUS',
  'asistente-ia@bienenhaus.local',
  'asistente virtual',
  'Asistente virtual de BIENENHAUS Propiedades. Responde dudas sobre propiedades, leads y operaciones del equipo.',
  '[]'::jsonb,
  '{}'::jsonb,
  true,
  true,
  999
) on conflict (email) do nothing;
