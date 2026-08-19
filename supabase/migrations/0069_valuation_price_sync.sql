-- ============================================================================
-- 0069_valuation_price_sync
-- Trigger: al finalizar tasación, sincronizar precio estimado → propiedad
-- Gap G7 del plan de integración modular
-- ============================================================================

-- ============================================================
-- FUNCIÓN: Sincronizar precio de propiedad desde tasación finalizada
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_property_price_from_valuation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Solo ejecutar cuando el status cambia a 'finalized' y hay valor estimado
    IF NEW.status = 'finalized' AND (OLD.status IS NULL OR OLD.status != 'finalized') THEN
        IF NEW.estimated_value IS NOT NULL AND NEW.estimated_value > 0 THEN
            UPDATE public.properties
            SET price = NEW.estimated_value,
                updated_at = now()
            WHERE id = NEW.property_id
              AND deleted_at IS NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGER: Ejecutar sync después de UPDATE en property_valuations
-- ============================================================
DROP TRIGGER IF EXISTS trg_sync_valuation_price ON public.property_valuations;
CREATE TRIGGER trg_sync_valuation_price
    AFTER UPDATE ON public.property_valuations
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_property_price_from_valuation();
