-- ============================================================================
-- 0075_rate_limit_logs_cleanup.sql
-- pg_cron job para limpiar logs de rate limiting antiguos
-- ============================================================================

-- Asegurar que pg_cron está habilitado
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Función para limpiar logs antiguos (retención: 30 días)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_deleted BIGINT;
    v_retention_days INT := 30;
BEGIN
    DELETE FROM public.rate_limit_logs
    WHERE created_at < now() - (v_retention_days || ' days')::interval;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    RAISE NOTICE 'Cleaned up % rate limit logs older than % days', v_deleted, v_retention_days;
END;
$$;

-- Programar ejecución diaria a las 03:00 UTC
-- Primero, eliminar schedule anterior si existe
SELECT cron.unschedule('cleanup-rate-limit-logs') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'cleanup-rate-limit-logs'
);

-- Programar nuevo cron
SELECT cron.schedule(
    'cleanup-rate-limit-logs',
    '0 3 * * *',
    $$SELECT public.cleanup_rate_limit_logs();$$
);

-- Permisos
REVOKE ALL ON FUNCTION public.cleanup_rate_limit_logs() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limit_logs() TO service_role, authenticated;