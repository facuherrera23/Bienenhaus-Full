-- ============================================================================
-- 0010_agent_matricula.sql
-- BIENENHAUS — Matrícula profesional del agente
-- ============================================================================

alter table public.agents
  add column matricula text;