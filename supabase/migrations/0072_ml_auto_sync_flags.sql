-- ============================================================================
-- 0072_ml_auto_sync_flags
-- Flags de auto-sincronización ML en properties y site_settings
-- FASE 2 del PLAN_PROPIEDADES_ML_INTEGRACION.md
-- ============================================================================

-- ============================================================
-- Flags globales en site_settings (config admin)
-- ============================================================

-- Auto-publish al crear propiedad
INSERT INTO public.site_settings (key, value, value_type, is_public, locale, description)
VALUES (
    'ml_auto_publish_on_create',
    '{"value": false}',
    'json',
    false,
    'es-AR',
    'Publicar automáticamente en ML al crear una propiedad nueva'
)
ON CONFLICT (key, locale) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description;

-- Auto-update al editar propiedad publicada
INSERT INTO public.site_settings (key, value, value_type, is_public, locale, description)
VALUES (
    'ml_auto_update_on_edit',
    '{"value": false}',
    'json',
    false,
    'es-AR',
    'Actualizar automáticamente en ML al editar una propiedad publicada'
)
ON CONFLICT (key, locale) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description;

-- Auto-delete al hacer soft delete
INSERT INTO public.site_settings (key, value, value_type, is_public, locale, description)
VALUES (
    'ml_auto_delete_on_soft_delete',
    '{"value": false}',
    'json',
    false,
    'es-AR',
    'Despublicar automáticamente en ML al eliminar una propiedad'
)
ON CONFLICT (key, locale) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description;

-- ============================================================
-- Flags por propiedad (overrides individuales)
-- ============================================================
ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS ml_auto_publish BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS ml_auto_update BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS ml_auto_delete BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.properties.ml_auto_publish IS 'Override: auto-publish en ML al crear (si global=true)';
COMMENT ON COLUMN public.properties.ml_auto_update IS 'Override: auto-update en ML al editar (si global=true)';
COMMENT ON COLUMN public.properties.ml_auto_delete IS 'Override: auto-delete en ML al soft-delete (si global=true)';

-- ============================================================
-- RPC: Obtener estado de auto-sync para una propiedad
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_ml_auto_sync_status(
    p_property_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_property RECORD;
    v_global_publish BOOLEAN;
    v_global_update BOOLEAN;
    v_global_delete BOOLEAN;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    -- Obtener flags de la propiedad
    SELECT
        ml_enabled, ml_auto_publish, ml_auto_update, ml_auto_delete
    INTO v_property
    FROM public.properties
    WHERE id = p_property_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Propiedad no encontrada');
    END IF;

    -- Obtener flags globales de site_settings
    SELECT (value->>'value')::boolean INTO v_global_publish
    FROM public.site_settings
    WHERE key = 'ml_auto_publish_on_create' AND locale = 'es-AR'
    LIMIT 1;

    SELECT (value->>'value')::boolean INTO v_global_update
    FROM public.site_settings
    WHERE key = 'ml_auto_update_on_edit' AND locale = 'es-AR'
    LIMIT 1;

    SELECT (value->>'value')::boolean INTO v_global_delete
    FROM public.site_settings
    WHERE key = 'ml_auto_delete_on_soft_delete' AND locale = 'es-AR'
    LIMIT 1;

    RETURN jsonb_build_object(
        'ml_enabled', COALESCE(v_property.ml_enabled, false),
        'publish', jsonb_build_object(
            'global', COALESCE(v_global_publish, false),
            'property_override', v_property.ml_auto_publish,
            'effective', COALESCE(v_property.ml_auto_publish, false) OR COALESCE(v_global_publish, false)
        ),
        'update', jsonb_build_object(
            'global', COALESCE(v_global_update, false),
            'property_override', v_property.ml_auto_update,
            'effective', COALESCE(v_property.ml_auto_update, false) OR COALESCE(v_global_update, false)
        ),
        'delete', jsonb_build_object(
            'global', COALESCE(v_global_delete, false),
            'property_override', v_property.ml_auto_delete,
            'effective', COALESCE(v_property.ml_auto_delete, false) OR COALESCE(v_global_delete, false)
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_ml_auto_sync_status(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_ml_auto_sync_status(UUID) TO authenticated;

-- ============================================================
-- RPC: Validar propiedad para publicar en ML
-- Retorna validación con errores/warnings antes de encolar
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_property_for_ml(
    p_property_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_prop RECORD;
    v_errors TEXT[] := ARRAY[]::TEXT[];
    v_warnings TEXT[] := ARRAY[]::TEXT[];
    v_image_count INTEGER;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    SELECT
        id, title, status, listing_type, price, currency,
        category_id, bedrooms, bathrooms, area_total,
        address, location_id, condition
    INTO v_prop
    FROM public.properties
    WHERE id = p_property_id AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'errors', ARRAY['Propiedad no encontrada']);
    END IF;

    -- Validaciones requeridas
    IF v_prop.category_id IS NULL THEN
        v_errors := array_append(v_errors, 'Falta categoría (category_id)');
    END IF;

    IF v_prop.listing_type IS NULL THEN
        v_errors := array_append(v_errors, 'Falta tipo de publicación (listing_type)');
    END IF;

    IF v_prop.price IS NULL OR v_prop.price <= 0 THEN
        v_errors := array_append(v_errors, 'Precio inválido o ausente');
    END IF;

    -- Contar imágenes
    SELECT COUNT(*) INTO v_image_count
    FROM public.property_images
    WHERE property_id = p_property_id;

    IF v_image_count = 0 THEN
        v_errors := array_append(v_errors, 'Mínimo 1 foto requerida');
    END IF;

    -- Warnings (no bloquean pero建议)
    IF v_prop.bedrooms IS NULL THEN
        v_warnings := array_append(v_warnings, 'Sin especificar dormitorios');
    END IF;

    IF v_prop.bathrooms IS NULL THEN
        v_warnings := array_append(v_warnings, 'Sin especificar baños');
    END IF;

    IF v_prop.area_total IS NULL THEN
        v_warnings := array_append(v_warnings, 'Sin especificar superficie total');
    END IF;

    IF v_prop.address IS NULL OR v_prop.address = '' THEN
        v_warnings := array_append(v_warnings, 'Dirección vacía (se usará ubicación)');
    END IF;

    IF v_prop.condition IS NULL THEN
        v_warnings := array_append(v_warnings, 'Sin especificar condición (nuevo/usado)');
    END IF;

    RETURN jsonb_build_object(
        'valid', array_length(v_errors, 1) IS NULL,
        'property_id', p_property_id,
        'title', v_prop.title,
        'errors', to_jsonb(v_errors),
        'warnings', to_jsonb(v_warnings),
        'image_count', v_image_count
    );
END;
$$;

REVOKE ALL ON FUNCTION public.validate_property_for_ml(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.validate_property_for_ml(UUID) TO authenticated;
