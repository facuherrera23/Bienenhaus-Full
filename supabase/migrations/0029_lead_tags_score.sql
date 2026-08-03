-- 0029_lead_tags_score.sql
-- Add lead scoring and tagging columns used by the admin CRM (leads.api.ts, leads.ts)

ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS leads_score_idx ON leads (score) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS leads_tags_gin_idx ON leads USING gin (tags) WHERE deleted_at IS NULL;
