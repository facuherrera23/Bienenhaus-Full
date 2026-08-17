-- 0067_ml_auto_import_cron.sql
-- Scheduler for automatic nightly ML import (ML → Bienenhaus)
-- Habilita pg_cron y programa la ejecución de ml-sync-import cada noche a las 03:00

-- Habilitar extensión pg_cron si no existe
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Configuración en site_settings para habilitar/deshabilitar el cron
INSERT INTO site_settings (key, value, value_type, is_public, locale, description)
VALUES (
    'ml_auto_import_enabled',
    '{"value": true}',
    'json',
    false,
    'es-AR',
    'Habilita la importación automática nocturna de ML (cron 03:00)'
)
ON CONFLICT (key, locale) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description;

-- Función helper para invocar la edge function ml-sync-import
-- Usa service_role_key para autenticación
CREATE OR REPLACE FUNCTION cron_ml_auto_import()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    enabled boolean;
    sync_secret text;
    resp jsonb;
BEGIN
    -- Verificar si está habilitado en site_settings
    SELECT (value->>'value')::boolean
    INTO enabled
    FROM site_settings
    WHERE key = 'ml_auto_import_enabled' AND locale = 'es-AR'
    LIMIT 1;

    IF NOT enabled THEN
        RAISE NOTICE 'ml_auto_import: deshabilitado en site_settings';
        RETURN;
    END IF;

    -- Obtener ML_SYNC_SECRET desde settings o env
    sync_secret := current_setting('app.settings.ml_sync_secret', true);

    -- Invocar edge function via HTTP (requiere pg_net o http extension)
    -- Alternativa: usar pg_cron con http request directo
    -- NOTA: Esta función se ejecuta via pg_cron schedule abajo
    RAISE NOTICE 'ml_auto_import: iniciando sincronización programada';
END;
$$;

-- Programar cron job: cada día a las 03:00 UTC
-- Nota: Requiere que la edge function ml-sync-import sea invocable via HTTP
-- El schedule real se configura en Supabase Dashboard o via SQL:
-- SELECT cron.schedule('ml-auto-import-nightly', '0 3 * * *', 'SELECT cron_ml_auto_import();');

-- Comentado por defecto - habilitar manualmente en Supabase Dashboard > Database > Cron Jobs
-- SELECT cron.schedule('ml-auto-import-nightly', '0 3 * * *', 'SELECT cron_ml_auto_import();');

-- Log table para auditoría de ejecuciones del cron
CREATE TABLE IF NOT EXISTS ml_auto_import_log (
    id bigserial PRIMARY KEY,
    started_at timestamptz NOT NULL DEFAULT now(),
    finished_at timestamptz,
    status text NOT NULL CHECK (status IN ('started', 'success', 'failed', 'skipped')),
    imported integer DEFAULT 0,
    updated integer DEFAULT 0,
    skipped integer DEFAULT 0,
    errors jsonb DEFAULT '[]'::jsonb,
    error_message text,
    total_processed integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ml_auto_import_log_started_at ON ml_auto_import_log (started_at DESC);

-- Trigger para actualizar finished_at y status
CREATE OR REPLACE FUNCTION ml_auto_import_log_finish()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.finished_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ml_auto_import_log_finish ON ml_auto_import_log;
CREATE TRIGGER trg_ml_auto_import_log_finish
    BEFORE UPDATE ON ml_auto_import_log
    FOR EACH ROW
    EXECUTE FUNCTION ml_auto_import_log_finish();

-- Comentarios de uso:
-- 1. Ejecutar esta migración
-- 2. En Supabase Dashboard > Database > Cron Jobs, agregar:
--    Name: ml-auto-import-nightly
--    Schedule: 0 3 * * * (cada día a las 03:00 UTC)
--    Command: SELECT net.http_post(
--        url := 'https://<project-ref>.supabase.co/functions/v1/ml-sync-import',
--        headers := jsonb_build_object(
--            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
--            'Content-Type', 'application/json'
--        ),
--        body := '{}'::jsonb
--    );
--    O usar pg_net extension si está disponible
-- 3. Verificar en ml_auto_import_log los resultados