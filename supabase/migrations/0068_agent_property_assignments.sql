-- ============================================================================
-- 0068_agent_property_assignments
-- Tabla de asignación agente ↔ propiedad (quién administra qué propiedad)
-- Gap G4 del plan de integración modular
-- ============================================================================

-- Tabla de asignaciones
CREATE TABLE IF NOT EXISTS public.agent_property_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.admin_users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    UNIQUE(agent_id, property_id)
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_agent
    ON public.agent_property_assignments (agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_property
    ON public.agent_property_assignments (property_id);

-- RLS
ALTER TABLE public.agent_property_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_select_agent_property_assignments"
    ON public.agent_property_assignments
    FOR SELECT
    TO authenticated
    USING (public.is_staff());

CREATE POLICY "staff_insert_agent_property_assignments"
    ON public.agent_property_assignments
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_staff());

CREATE POLICY "staff_update_agent_property_assignments"
    ON public.agent_property_assignments
    FOR UPDATE
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

CREATE POLICY "staff_delete_agent_property_assignments"
    ON public.agent_property_assignments
    FOR DELETE
    TO authenticated
    USING (public.is_staff());

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_property_assignments TO authenticated;
GRANT ALL ON public.agent_property_assignments TO service_role;

-- ============================================================
-- VISTA: Propiedades con agente asignado (para filtrado rápido)
-- ============================================================
CREATE OR REPLACE VIEW public.v_agent_properties AS
SELECT
    apa.id AS assignment_id,
    apa.agent_id,
    apa.property_id,
    apa.assigned_at,
    apa.notes,
    a.name AS agent_name,
    a.email AS agent_email,
    a.photo_url AS agent_photo,
    p.title AS property_title,
    p.status AS property_status,
    p.listing_type AS property_listing_type,
    p.price AS property_price
FROM public.agent_property_assignments apa
JOIN public.agents a ON a.id = apa.agent_id
JOIN public.properties p ON p.id = apa.property_id;

-- ============================================================
-- RPC: Asignar agente a propiedad (idempotente)
-- ============================================================
CREATE OR REPLACE FUNCTION public.assign_agent_to_property(
    p_agent_id UUID,
    p_property_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_assignment_id UUID;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    INSERT INTO public.agent_property_assignments (agent_id, property_id, assigned_by, notes)
    VALUES (p_agent_id, p_property_id, auth.uid(), p_notes)
    ON CONFLICT (agent_id, property_id)
    DO UPDATE SET notes = EXCLUDED.notes, assigned_at = now()
    RETURNING id INTO v_assignment_id;

    RETURN jsonb_build_object(
        'success', true,
        'assignment_id', v_assignment_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.assign_agent_to_property(UUID, UUID, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.assign_agent_to_property(UUID, UUID, TEXT) TO authenticated;

-- ============================================================
-- RPC: Desasignar agente de propiedad
-- ============================================================
CREATE OR REPLACE FUNCTION public.unassign_agent_from_property(
    p_agent_id UUID,
    p_property_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    DELETE FROM public.agent_property_assignments
    WHERE agent_id = p_agent_id AND property_id = p_property_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.unassign_agent_from_property(UUID, UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.unassign_agent_from_property(UUID, UUID) TO authenticated;
