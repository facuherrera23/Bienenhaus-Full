-- ============================================================
-- ML-SYNC OBSERVABILITY QUERIES
-- Para dashboards (Grafana/Supabase) y alertas
-- ============================================================

-- ----------------------------------------------------------------------------
-- 1. ESTADO DE LA COLA (ml_sync_queue)
-- ----------------------------------------------------------------------------
SELECT
    status,
    count(*) as job_count,
    min(created_at) as oldest_job,
    max(created_at) as newest_job
FROM ml_sync_queue
WHERE deleted_at IS NULL
GROUP BY status
ORDER BY
    CASE status
        WHEN 'processing' THEN 1
        WHEN 'pending' THEN 2
        WHEN 'rate_limited' THEN 3
        WHEN 'failed' THEN 4
        WHEN 'dead_letter' THEN 5
        WHEN 'success' THEN 6
    END;

-- ----------------------------------------------------------------------------
-- 2. LATENCIA ML API (últimas 24h)
-- ----------------------------------------------------------------------------
SELECT
    date_trunc('hour', timestamp) as hour,
    operation,
    count(*) as calls,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY ml_api_latency_ms) as p50_latency_ms,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY ml_api_latency_ms) as p95_latency_ms,
    percentile_cont(0.99) WITHIN GROUP (ORDER BY ml_api_latency_ms) as p99_latency_ms
FROM activity_log
WHERE function = 'ml-sync'
  AND ml_api_latency_ms IS NOT NULL
  AND timestamp > now() - interval '24 hours'
GROUP BY hour, operation
ORDER BY hour DESC, operation;

-- ----------------------------------------------------------------------------
-- 3. RATE LIMIT HITS (últimas 24h)
-- ----------------------------------------------------------------------------
SELECT
    date_trunc('hour', timestamp) as hour,
    count(*) as rate_limit_hits,
    count(DISTINCT property_id) as affected_properties
FROM activity_log
WHERE function = 'ml-sync'
  AND status = 'rate_limited'
  AND timestamp > now() - interval '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- ----------------------------------------------------------------------------
-- 4. COOLDOWN ACTIVATIONS (ml_sync_cooldown)
-- ----------------------------------------------------------------------------
SELECT
    c.connection_id,
    c.cooldown_until,
    c.reason,
    c.updated_at,
    CASE WHEN c.cooldown_until > now() THEN 'ACTIVE' ELSE 'EXPIRED' END as state,
    m.nickname,
    m.site_id
FROM ml_sync_cooldown c
LEFT JOIN ml_connection m ON m.id = c.connection_id
ORDER BY c.updated_at DESC;

-- ----------------------------------------------------------------------------
-- 5. DEAD LETTER QUEUE STATUS
-- ----------------------------------------------------------------------------
SELECT
    status,
    count(*) as count,
    min(created_at) as oldest,
    max(created_at) as newest
FROM ml_sync_dead_letter
GROUP BY status
ORDER BY
    CASE status
        WHEN 'pending' THEN 1
        WHEN 'resolved' THEN 2
        WHEN 'ignored' THEN 3
    END;

-- ----------------------------------------------------------------------------
-- 6. JOBS STUCK EN PROCESSING (>15 min sin lock o locked_at viejo)
-- Para alerta: reaper F0.6 debe limpiarlos
-- ----------------------------------------------------------------------------
SELECT
    id,
    property_id,
    operation,
    status,
    attempts,
    max_attempts,
    locked_by,
    locked_at,
    updated_at,
    now() - locked_at as lock_age,
    now() - updated_at as update_age
FROM ml_sync_queue
WHERE status = 'processing'
  AND (locked_at IS NULL OR locked_at < now() - interval '15 minutes')
ORDER BY locked_at NULLS FIRST;

-- ----------------------------------------------------------------------------
-- 7. THROUGHPUT DIARIO (jobs procesados por día)
-- ----------------------------------------------------------------------------
SELECT
    date_trunc('day', completed_at) as day,
    operation,
    status,
    count(*) as jobs
FROM ml_sync_history
WHERE completed_at > now() - interval '30 days'
GROUP BY day, operation, status
ORDER BY day DESC, operation;

-- ----------------------------------------------------------------------------
-- 7b. THROUGHPUT HOURLY (últimas 48h)
-- ----------------------------------------------------------------------------
SELECT
    date_trunc('hour', completed_at) as hour,
    operation,
    status,
    count(*) as jobs
FROM ml_sync_history
WHERE completed_at > now() - interval '48 hours'
GROUP BY hour, operation, status
ORDER BY hour DESC, operation;

-- ----------------------------------------------------------------------------
-- 8. ALERTAS SUGERIDAS (configurar en Grafana/Supabase)
-- ----------------------------------------------------------------------------
/*
ALERTAS CRÍTICAS:
1. rate_limit_hits > 10 en 5 min  → ML API nos está rate limiteando fuerte
2. cooldown_active > 0 por > 30 min → circuit breaker no se recupera
3. jobs_stuck_processing > 0 → reaper no está limpiando
4. dead_letter pending > 5 → intervención manual necesaria
5. queue_pending > 100 y processing = 0 → ml-sync caído o sin tokens

ALERTAS WARNING:
1. p95_latency_ml_api > 5000ms → ML API lento
2. queue_pending > 50 → backlog creciendo
3. failed_jobs > 10 en 1h → algo falla sistemáticamente
*/