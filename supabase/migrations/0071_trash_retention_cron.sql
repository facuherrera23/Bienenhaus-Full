-- ============================================================================
-- 0071_trash_retention_cron
-- Cron job para procesar retención de papelera automáticamente
-- Gap G10 del plan de integración modular
-- ============================================================================

-- ============================================================
-- Asegurar que pg_cron está habilitado
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- Cron: procesar retención de papelera cada lunes a las 03:00 UTC
-- Invoca la edge function process-retention-policies
-- ============================================================

-- Primero, eliminar schedule anterior si existe
DO $$
BEGIN
    PERFORM cron.unschedule('trash-retention-weekly');
EXCEPTION WHEN OTHERS THEN
    -- Ignore error if job doesn't exist
    NULL;
END $$;

-- Programar nuevo cron
SELECT cron.schedule(
    'trash-retention-weekly',
    '0 3 * * 1',
    $$
    INSERT INTO public.ml_auto_import_log (status, started_at)
    VALUES ('started', now());
    $$
);

-- ============================================================
-- Función SQL: Auto-purgar elementos en papelera que exceden retención
-- Más confiable que depender de edge function remota
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_purge_trash()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_purged_props INTEGER := 0;
    v_purged_leads INTEGER := 0;
    v_purged_agents INTEGER := 0;
    v_purged_subs INTEGER := 0;
    v_purged_owners INTEGER := 0;
    v_purged_plans INTEGER := 0;
    v_retention_days INTEGER;
    v_cutoff TIMESTAMPTZ;
    v_policy RECORD;
BEGIN
    -- Procesar cada política de retención activa
    FOR v_policy IN
        SELECT * FROM public.trash_retention_policies WHERE enabled = true
    LOOP
        v_retention_days := COALESCE(v_policy.retention_days, 90);
        v_cutoff := now() - (v_retention_days || ' days')::interval;

        -- Properties
        IF v_policy.table_name = 'properties' OR v_policy.table_name = 'all' THEN
            DELETE FROM public.properties
            WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
            GET DIAGNOSTICS v_purged_props = ROW_COUNT;
        END IF;

        -- Leads
        IF v_policy.table_name = 'leads' OR v_policy.table_name = 'all' THEN
            DELETE FROM public.leads
            WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
            GET DIAGNOSTICS v_purged_leads = ROW_COUNT;
        END IF;

        -- Agents
        IF v_policy.table_name = 'agents' OR v_policy.table_name = 'all' THEN
            DELETE FROM public.agents
            WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
            GET DIAGNOSTICS v_purged_agents = ROW_COUNT;
        END IF;

        -- Newsletter subscribers
        IF v_policy.table_name = 'newsletter_subscribers' OR v_policy.table_name = 'all' THEN
            DELETE FROM public.newsletter_subscribers
            WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
            GET DIAGNOSTICS v_purged_subs = ROW_COUNT;
        END IF;

        -- Owners
        IF v_policy.table_name = 'owners' OR v_policy.table_name = 'all' THEN
            DELETE FROM public.owners
            WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
            GET DIAGNOSTICS v_purged_owners = ROW_COUNT;
        END IF;

        -- Action plans
        IF v_policy.table_name = 'action_plans' OR v_policy.table_name = 'all' THEN
            DELETE FROM public.property_action_plans
            WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
            GET DIAGNOSTICS v_purged_plans = ROW_COUNT;
        END IF;
    END LOOP;

    -- Si no hay políticas activas, usar default 90 días
    IF NOT EXISTS (SELECT 1 FROM public.trash_retention_policies WHERE enabled = true) THEN
        v_cutoff := now() - interval '90 days';

        DELETE FROM public.properties WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
        GET DIAGNOSTICS v_purged_props = ROW_COUNT;

        DELETE FROM public.leads WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
        GET DIAGNOSTICS v_purged_leads = ROW_COUNT;

        DELETE FROM public.agents WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
        GET DIAGNOSTICS v_purged_agents = ROW_COUNT;

        DELETE FROM public.newsletter_subscribers WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
        GET DIAGNOSTICS v_purged_subs = ROW_COUNT;

        DELETE FROM public.owners WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
        GET DIAGNOSTICS v_purged_owners = ROW_COUNT;

        DELETE FROM public.property_action_plans WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
        GET DIAGNOSTICS v_purged_plans = ROW_COUNT;
    END IF;

    -- Log de la ejecución
    INSERT INTO public.ml_auto_import_log (status, imported, updated, skipped, errors)
    VALUES (
        'success',
        v_purged_props + v_purged_leads + v_purged_agents + v_purged_subs + v_purged_owners + v_purged_plans,
        0, 0,
        jsonb_build_object(
            'purged', jsonb_build_object(
                'properties', v_purged_props,
                'leads', v_purged_leads,
                'agents', v_purged_agents,
                'subscribers', v_purged_subs,
                'owners', v_purged_owners,
                'action_plans', v_purged_plans
            )
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'purged', jsonb_build_object(
            'properties', v_purged_props,
            'leads', v_purged_leads,
            'agents', v_purged_agents,
            'subscribers', v_purged_subs,
            'owners', v_purged_owners,
            'action_plans', v_purged_plans
        ),
        'cutoff', v_cutoff
    );
END;
$$;

REVOKE ALL ON FUNCTION public.auto_purge_trash() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.auto_purge_trash() TO service_role, authenticated;

-- ============================================================
-- RPC manual: ejecutar purge ahora (para admin)
-- ============================================================
CREATE OR REPLACE FUNCTION public.run_trash_retention()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    RETURN public.auto_purge_trash();
END;
$$;

REVOKE ALL ON FUNCTION public.run_trash_retention() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.run_trash_retention() TO authenticated;

-- ============================================================
-- Notas de activación:
-- Para habilitar el cron en Supabase Cloud, ejecutar manualmente:
-- SELECT cron.schedule(
--     'trash-retention-weekly',
--     '0 3 * * 1',
--     $$SELECT public.auto_purge_trash()$$
-- );
-- ============================================================
