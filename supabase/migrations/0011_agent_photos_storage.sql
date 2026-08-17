-- ============================================================================
-- 0011_agent_photos_storage.sql
-- BIENENHAUS — Storage para fotos de agentes
-- ============================================================================

-- Bucket público 'agent-photos' (máx 5 MB, solo imágenes)
-- La tabla storage.buckets se crea automáticamente al iniciar el servicio storage-api.
-- Usamos DO block para evitar error si la tabla aún no existe durante migraciones.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'agent-photos',
      'agent-photos',
      true,
      5242880,
      array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    )
    on conflict (id) do nothing;
  end if;
end $$;

-- Lectura pública
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'objects') then
    create policy agent_photos_public_read on storage.objects
      for select using (bucket_id = 'agent-photos');
  end if;
end $$;

-- Escritura/borrado solo para staff
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'objects') then
    create policy agent_photos_staff_insert on storage.objects
      for insert to authenticated
      with check (bucket_id = 'agent-photos' and public.is_staff());

    create policy agent_photos_staff_update on storage.objects
      for update to authenticated
      using (bucket_id = 'agent-photos' and public.is_staff());

    create policy agent_photos_staff_delete on storage.objects
      for delete to authenticated
      using (bucket_id = 'agent-photos' and public.is_staff());
  end if;
end $$;

-- Grants para storage.objects
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'objects') then
    grant select on storage.objects to anon, authenticated;
    grant insert, update, delete on storage.objects to authenticated;
  end if;
end $$;
