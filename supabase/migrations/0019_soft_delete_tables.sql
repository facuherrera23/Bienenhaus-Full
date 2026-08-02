-- 0019_soft_delete_tables.sql
-- Add soft delete (deleted_at) to main tables

-- Properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS properties_deleted_at_idx ON properties (deleted_at) WHERE deleted_at IS NOT NULL;

-- Leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS leads_deleted_at_idx ON leads (deleted_at) WHERE deleted_at IS NOT NULL;

-- Agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS agents_deleted_at_idx ON agents (deleted_at) WHERE deleted_at IS NOT NULL;

-- Newsletter subscribers
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS newsletter_subscribers_deleted_at_idx ON newsletter_subscribers (deleted_at) WHERE deleted_at IS NOT NULL;

-- Update RLS policies to exclude deleted records from normal SELECT
-- Properties: public select should not see deleted
DROP POLICY IF EXISTS "properties_public_select" ON properties;
CREATE POLICY "properties_public_select" ON properties
  FOR SELECT USING (status = 'publicada'::property_status AND deleted_at IS NULL);

-- Properties staff select should see deleted too (for trash)
DROP POLICY IF EXISTS "properties_staff_select" ON properties;
CREATE POLICY "properties_staff_select" ON properties
  FOR SELECT USING (is_staff());

-- Leads staff select
DROP POLICY IF EXISTS "leads_staff_select" ON leads;
CREATE POLICY "leads_staff_select" ON leads
  FOR SELECT USING (is_staff());

-- Agents staff select
DROP POLICY IF EXISTS "agents_staff_select" ON agents;
CREATE POLICY "agents_staff_select" ON agents
  FOR SELECT USING (is_staff());

-- Newsletter subscribers staff select
DROP POLICY IF EXISTS "newsletter_subscribers_staff_select" ON newsletter_subscribers;
CREATE POLICY "newsletter_subscribers_staff_select" ON newsletter_subscribers
  FOR SELECT USING (is_staff());

-- Newsletter public select (if any)
DROP POLICY IF EXISTS "newsletter_subscribers_public_select" ON newsletter_subscribers;
CREATE POLICY "newsletter_subscribers_public_select" ON newsletter_subscribers
  FOR SELECT USING (deleted_at IS NULL);

-- Agents public select (only active and not deleted)
DROP POLICY IF EXISTS "agents_public_select" ON agents;
CREATE POLICY "agents_public_select" ON agents
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);