-- Migración: Versionado de Site Settings
-- Permite rollback a versiones anteriores

CREATE TABLE site_settings_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot jsonb NOT NULL, -- { key: { value, value_type, is_public, locale } }
    changed_keys text[] NOT NULL,
    changed_by uuid REFERENCES admin_users(id),
    change_summary text, -- "Updated hero_title, contact_whatsapp"
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_site_settings_versions_created ON site_settings_versions(created_at DESC);