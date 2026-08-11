-- Migración: Dead Letter Queue para ML Sync
-- Permite recuperar jobs fallidos permanentemente con visibilidad completa

CREATE TABLE ml_sync_dead_letter (
    id BIGSERIAL PRIMARY KEY,
    original_queue_id INT NOT NULL REFERENCES ml_sync_queue(id),
    property_id UUID NOT NULL REFERENCES properties(id),
    operation ml_operation NOT NULL,
    attempts INT NOT NULL,
    max_attempts INT NOT NULL,
    last_error TEXT,
    payload JSONB,
    ml_item_id INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    moved_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES admin_users(id),
    resolution_notes TEXT
);

CREATE INDEX idx_ml_dead_letter_property ON ml_sync_dead_letter(property_id);
CREATE INDEX idx_ml_dead_letter_moved_at ON ml_sync_dead_letter(moved_at DESC);
CREATE INDEX idx_ml_dead_letter_resolved ON ml_sync_dead_letter(resolved_at) WHERE resolved_at IS NOT NULL;

-- Tabla para rate limiting en edge functions
CREATE TABLE rate_limit_logs (
    id BIGSERIAL PRIMARY KEY,
    key TEXT NOT NULL, -- 'ratelimit:ml-sync:ip'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_logs_key ON rate_limit_logs(key);
CREATE INDEX idx_rate_limit_logs_created ON rate_limit_logs(created_at);

-- Constraint de deduplicación para webhook events
ALTER TABLE ml_webhook_events
ADD CONSTRAINT uq_ml_webhook_event UNIQUE (resource, attempts, topic);