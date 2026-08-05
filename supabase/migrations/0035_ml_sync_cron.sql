-- 0035_ml_sync_cron.sql
-- Cron job que procesa la cola de sincronización de MercadoLibre cada 5 minutos.
--
-- El CLI de Supabase IGNORA la clave `schedule` de config.toml (verificado en el
-- código fuente del CLI: el struct `function` no tiene campo `schedule`), así que
-- el schedule se registra directamente en pg_cron según la documentación oficial:
-- https://supabase.com/docs/guides/cron
--
-- El job lee el secret `ml_sync_secret` de Vault en CADA ejecución. Mientras ese
-- secret no exista, el job no dispara ninguna request (guard `WHERE EXISTS`).
-- Para activarlo en producción, crear el secret con el MISMO valor que el env
-- `ML_SYNC_SECRET` de la edge function (dashboard → SQL editor):
--
--   select vault.create_secret('<mismo valor que ML_SYNC_SECRET>', 'ml_sync_secret');
--
-- Nota local: el job apunta a la URL de producción y queda inerte hasta que el
-- secret exista en Vault. Para probar localmente, crear el secret local con el
-- valor correspondiente y cambiar la url a http://127.0.0.1:54321/functions/v1/ml-sync.

-- Extensiones requeridas (idempotente; en producción ya están habilitadas)
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net;

-- Idempotencia: eliminar el job previo si existe
select cron.unschedule(jobid)
from cron.job
where jobname = 'ml-sync-every-5-min';

-- Registrar el job: POST a ml-sync cada 5 minutos
select cron.schedule(
  'ml-sync-every-5-min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://rnldqiwwzhjnurkguihu.supabase.co/functions/v1/ml-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'ml_sync_secret' limit 1)
    ),
    body := '{}'
  ) as request_id
  where exists (
    select 1 from vault.decrypted_secrets where name = 'ml_sync_secret'
  );
  $$
);
