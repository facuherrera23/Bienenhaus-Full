-- Migración: Políticas de retención para papelera
-- Permite auto-eliminación de elementos en papelera después de X días

CREATE TABLE trash_retention_policies (
    entity text PRIMARY KEY,
    retention_days int NOT NULL DEFAULT 90,
    notify_before_days int DEFAULT 7,
    auto_delete_enabled boolean DEFAULT true,
    updated_at timestamptz DEFAULT now()
);

INSERT INTO trash_retention_policies (entity, retention_days) VALUES
('properties', 90), ('leads', 60), ('owners', 90), ('agents', 90),
('visits', 30), ('action_plans', 90), ('communications', 90),
('reports', 365), ('valuations', 365), ('price_analyses', 180);

-- Comentario para documentación
COMMENT ON TABLE trash_retention_policies IS 'Políticas de retención para elementos en papelera. Auto-eliminación tras X días.';
COMMENT ON COLUMN trash_retention_policies.retention_days IS 'Días tras los cuales se elimina permanentemente';
COMMENT ON COLUMN trash_retention_policies.notify_before_days IS 'Días antes de la auto-eliminación para notificar';
COMMENT ON COLUMN trash_retention_policies.auto_delete_enabled IS 'Habilita/deshabilita auto-eliminación automática';