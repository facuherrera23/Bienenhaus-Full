-- 0018_property_video_url.sql
-- Add video_url column to properties table

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS video_url text;

COMMENT ON COLUMN properties.video_url IS 'YouTube URL for property video (optional)';