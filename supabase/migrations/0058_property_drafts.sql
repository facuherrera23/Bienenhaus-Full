-- Migración: Tabla de borradores de propiedades para sync multi-dispositivo
-- Permite guardar borradores por usuario y propiedad

CREATE TABLE property_drafts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
    admin_user_id uuid REFERENCES admin_users(id) ON DELETE CASCADE,
    form_values jsonb NOT NULL,
    updated_at timestamptz DEFAULT now(),
    UNIQUE (property_id, admin_user_id)
);

CREATE INDEX idx_property_drafts_user ON property_drafts(admin_user_id);
CREATE INDEX idx_property_drafts_property ON property_drafts(property_id);

-- Comentario para documentación
COMMENT ON TABLE property_drafts IS 'Borradores de propiedades por usuario para sync multi-dispositivo. Se guarda con debounce de 2s.';
COMMENT ON COLUMN property_drafts.form_values IS 'Valores del formulario serializados como JSON (PropertyFormValues parcial)';