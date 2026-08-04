-- ============================================================================
-- 0031_public_agents_view.sql
-- BIENENHAUS — Vista pública de agentes con SOLO columnas de display.
--
-- Motivación: la policy agents_public_select (0007/0019) exponía TODAS las
-- columnas de `agents` al rol anon, incluidas commission / permissions /
-- schedule (agregadas en 0030). Esta migración corta el acceso directo a la
-- tabla para anon y lo redirige a una vista que filtra columnas y filas.
-- El rol authenticated (staff/admin) conserva su acceso completo a la tabla.
-- ============================================================================

-- 1) Vista con las columnas que la landing realmente muestra y con el mismo
--    filtro que tenía agents_public_select (activo + no eliminado).
--    security_invoker = false (default): la vista corre con privilegios del
--    owner (postgres), por eso el WHERE explícito es la garantía de filtrado.
create or replace view public.agents_public
with (security_invoker = false)
as
select
  id,
  name,
  email,
  matricula,
  role,
  photo_url,
  bio,
  sort_order,
  is_active
from public.agents
where is_active = true and deleted_at is null;

-- 2) Lectura pública SOLO de la vista.
grant select on public.agents_public to anon;

-- 3) Cortar el acceso directo de anon a la tabla (0008 otorgó "all on all
--    tables"; el revoke puntual a SELECT deja a anon sin lectura directa).
revoke select on public.agents from anon;

-- 4) La policy pública sobre la tabla queda sin efecto; se elimina para
--    evitar confusión (el acceso público ahora pasa por la vista).
drop policy if exists agents_public_select on public.agents;
