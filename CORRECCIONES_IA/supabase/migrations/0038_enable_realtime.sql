-- ============================================================================
-- 0038_enable_realtime.sql
-- BIENENHAUS — Habilitar Realtime (H1 de la auditoría).
-- La publicación `supabase_realtime` existía SIN tablas de usuario, por lo que
-- todas las suscripciones postgres_changes del código (chat, landing, admin)
-- nunca recibían eventos. Se agregan las tablas que el front suscribe:
--   * apps/admin/src/lib/chat.ts            → chat_messages (INSERT/UPDATE/DELETE)
--   * apps/landing/src/lib/supabase-data.ts → properties, property_images, locations
--   * apps/landing/src/lib/site-settings.ts → site_settings
-- ============================================================================

-- La publicación por defecto de Supabase. `CREATE PUBLICATION` no soporta
-- IF NOT EXISTS, así que se crea condicionalmente vía DO block (idempotente).
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end
$$;

-- Se agregan idempotentemente: se salta cualquier tabla ya miembro.
do $$
declare
  t text;
  to_add text[] := array['public.chat_messages', 'public.properties', 'public.property_images', 'public.locations', 'public.site_settings'];
  existing text[];
begin
  select coalesce(array_agg(pgt.schemaname || '.' || pgt.tablename), '{}')
    into existing
    from pg_publication_tables pgt
   where pgt.pubname = 'supabase_realtime';

  foreach t in array to_add loop
    if not (t = any(existing)) then
      execute format('alter publication supabase_realtime add table %s', t);
    end if;
  end loop;
end
$$;
