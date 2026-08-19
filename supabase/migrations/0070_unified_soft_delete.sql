-- ============================================================================
-- 0070_unified_soft_delete
-- Soft delete unificado en tablas que no lo tenían
-- Gap G8 del plan de integración modular
-- ============================================================================

-- ============================================================
-- Agregar deleted_at a tablas faltantes
-- ============================================================

-- Tasaciones
ALTER TABLE public.property_valuations
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Análisis de precio
ALTER TABLE public.property_price_analyses
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Comunicaciones con propietarios
ALTER TABLE public.owner_communications
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Reportes para propietarios
ALTER TABLE public.owner_reports
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Comparables de tasaciones
ALTER TABLE public.valuation_comparables
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================================
-- RLS: Staff ve todo, público solo no-eliminados
-- ============================================================

-- property_valuations: policy ya existe de 0061; agregar soft delete
DROP POLICY IF EXISTS "staff_all_property_valuations" ON public.property_valuations;
CREATE POLICY "staff_all_property_valuations"
    ON public.property_valuations
    FOR ALL
    TO authenticated
    USING (public.is_staff() OR deleted_at IS NULL)
    WITH CHECK (public.is_staff());

-- property_price_analyses
DROP POLICY IF EXISTS "staff_all_price_analyses" ON public.property_price_analyses;
CREATE POLICY "staff_all_price_analyses"
    ON public.property_price_analyses
    FOR ALL
    TO authenticated
    USING (public.is_staff() OR deleted_at IS NULL)
    WITH CHECK (public.is_staff());

-- owner_communications
DROP POLICY IF EXISTS "staff_all_owner_communications" ON public.owner_communications;
CREATE POLICY "staff_all_owner_communications"
    ON public.owner_communications
    FOR ALL
    TO authenticated
    USING (public.is_staff() OR deleted_at IS NULL)
    WITH CHECK (public.is_staff());

-- owner_reports
DROP POLICY IF EXISTS "staff_all_owner_reports" ON public.owner_reports;
CREATE POLICY "staff_all_owner_reports"
    ON public.owner_reports
    FOR ALL
    TO authenticated
    USING (public.is_staff() OR deleted_at IS NULL)
    WITH CHECK (public.is_staff());

-- valuation_comparables
DROP POLICY IF EXISTS "staff_all_valuation_comparables" ON public.valuation_comparables;
CREATE POLICY "staff_all_valuation_comparables"
    ON public.valuation_comparables
    FOR ALL
    TO authenticated
    USING (public.is_staff() OR deleted_at IS NULL)
    WITH CHECK (public.is_staff());

-- ============================================================
-- RPCs unificados de soft delete / restore / purge
-- ============================================================

-- Soft delete genérico para tablas con deleted_at
CREATE OR REPLACE FUNCTION public.soft_delete_entity(
    p_table_name TEXT,
    p_entity_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_sql TEXT;
    v_count INTEGER;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    -- Validar tabla permitida
    IF p_table_name NOT IN (
        'property_valuations', 'property_price_analyses',
        'owner_communications', 'owner_reports', 'valuation_comparables'
    ) THEN
        RAISE EXCEPTION 'Tabla no permitida: %', p_table_name;
    END IF;

    -- Ejecutar soft delete
    v_sql := format(
        'UPDATE public.%I SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL',
        p_table_name
    );
    EXECUTE v_sql USING p_entity_id;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    IF v_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Entity not found or already deleted');
    END IF;

    RETURN jsonb_build_object('success', true, 'table', p_table_name, 'id', p_entity_id);
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_entity(TEXT, UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_entity(TEXT, UUID) TO authenticated;

-- Restore genérico
CREATE OR REPLACE FUNCTION public.restore_entity(
    p_table_name TEXT,
    p_entity_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_sql TEXT;
    v_count INTEGER;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    IF p_table_name NOT IN (
        'property_valuations', 'property_price_analyses',
        'owner_communications', 'owner_reports', 'valuation_comparables'
    ) THEN
        RAISE EXCEPTION 'Tabla no permitida: %', p_table_name;
    END IF;

    v_sql := format(
        'UPDATE public.%I SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL',
        p_table_name
    );
    EXECUTE v_sql USING p_entity_id;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    IF v_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Entity not found or not deleted');
    END IF;

    RETURN jsonb_build_object('success', true, 'table', p_table_name, 'id', p_entity_id);
END;
$$;

REVOKE ALL ON FUNCTION public.restore_entity(TEXT, UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.restore_entity(TEXT, UUID) TO authenticated;

-- ============================================================
-- Funciones helper: fetch soft-deleted entities por tabla
-- ============================================================

CREATE OR REPLACE FUNCTION public.fetch_deleted_valuations()
RETURNS SETOF public.property_valuations
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
STABLE
AS $$
    SELECT * FROM public.property_valuations
    WHERE deleted_at IS NOT NULL
    ORDER BY deleted_at DESC;
$$;

REVOKE ALL ON FUNCTION public.fetch_deleted_valuations() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.fetch_deleted_valuations() TO authenticated;

CREATE OR REPLACE FUNCTION public.fetch_deleted_price_analyses()
RETURNS SETOF public.property_price_analyses
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
STABLE
AS $$
    SELECT * FROM public.property_price_analyses
    WHERE deleted_at IS NOT NULL
    ORDER BY deleted_at DESC;
$$;

REVOKE ALL ON FUNCTION public.fetch_deleted_price_analyses() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.fetch_deleted_price_analyses() TO authenticated;

CREATE OR REPLACE FUNCTION public.fetch_deleted_communications()
RETURNS SETOF public.owner_communications
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
STABLE
AS $$
    SELECT * FROM public.owner_communications
    WHERE deleted_at IS NOT NULL
    ORDER BY deleted_at DESC;
$$;

REVOKE ALL ON FUNCTION public.fetch_deleted_communications() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.fetch_deleted_communications() TO authenticated;
