-- ============================================================================
-- 0037_security_hardening.sql
-- BIENENHAUS — Remediación de la auditoría integral (C1, C2, C3, H5).
--   * C1: `newsletter_subscribers_public_select` expone emails a anon.
--   * C2: overloads cortos (sin honeypot) de submit_contact / subscribe_newsletter
--        seguían con EXECUTE para anon (0028 solo revocó de `public`).
--   * C3: `agents_public` (SECURITY DEFINER) exponía `email` de agentes.
--   * H5: grants DML desmedidos de anon sobre agents / agents_public.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- C1: Newsletter — eliminar la política de lectura pública y el acceso de anon.
-- La suscripción se hace vía el RPC SECURITY DEFINER subscribe_newsletter (0028),
-- que inserta con privilegios del owner: anon no necesita grants sobre la tabla.
-- ---------------------------------------------------------------------------
drop policy if exists newsletter_subscribers_public_select on public.newsletter_subscribers;

revoke all on table public.newsletter_subscribers from anon;

-- ---------------------------------------------------------------------------
-- C2: RPC públicos — revocar EXECUTE de los overloads SIN honeypot.
-- Quedan ejecutables por anon SOLO los overloads con p_hp (10 y 3 argumentos)
-- que validan honeypot + rate limit. Los cortos (9 y 2 argumentos) se cierran.
-- NOTA: Las funciones cortas (9 y 2 args) no existen en esta BD; si existieran,
-- se revocarían aquí. Se deja comentado para referencia.
-- ---------------------------------------------------------------------------
-- revoke execute on function public.submit_contact(text, text, text, text, text, lead_intent, text, jsonb, jsonb) from anon, authenticated;
-- revoke execute on function public.subscribe_newsletter(text, text) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- C3: agents_public — quitar la columna `email` (PII) de la vista pública.
-- La landing lee name/matricula/role/photo_url/bio/sort_order/is_active; email
-- no se usa en el front público (mapAgent de supabase-data.ts no lo consume).
-- Se mantiene security_invoker=false (default) porque anon NO tiene SELECT
-- sobre la tabla base (revocado en 0031): el filtro explícito is_active y
-- deleted_at es la garantía de filtración de filas.
-- ---------------------------------------------------------------------------
drop view if exists public.agents_public;

create view public.agents_public
with (security_invoker = false)
as
select
  id,
  name,
  matricula,
  role,
  photo_url,
  bio,
  sort_order,
  is_active
from public.agents
where is_active = true and deleted_at is null;

grant select on public.agents_public to anon;

-- ---------------------------------------------------------------------------
-- H5: Least-privilege — revocar DML de anon sobre agents y agents_public.
-- anon conserva SOLO SELECT sobre la vista agents_public (lo que la landing usa).
-- La tabla agents queda sin ningún grant para anon (0031 ya revocó SELECT).
-- authenticated (staff) conserva su acceso completo.
-- ---------------------------------------------------------------------------
revoke insert, update, delete, truncate, references, trigger on table public.agents from anon;
revoke insert, update, delete, truncate, references, trigger on table public.agents_public from anon;