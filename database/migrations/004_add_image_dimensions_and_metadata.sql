-- Migration: Add image dimensions, size, and aspect ratio to image_metadata table
-- This adds support for filtering images by dimensions and aspect ratio

-- Add new columns to image_metadata table
ALTER TABLE public.image_metadata
  ADD COLUMN IF NOT EXISTS width INTEGER,
  ADD COLUMN IF NOT EXISTS height INTEGER,
  ADD COLUMN IF NOT EXISTS size_kb NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(20);

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_image_metadata_dimensions 
ON public.image_metadata(organization_id, key, width, height);

CREATE INDEX IF NOT EXISTS idx_image_metadata_aspect_ratio 
ON public.image_metadata(organization_id, key, aspect_ratio);

CREATE INDEX IF NOT EXISTS idx_image_metadata_size 
ON public.image_metadata(organization_id, key, size_kb);

-- Add comments to new columns
COMMENT ON COLUMN public.image_metadata.width IS 'Image width in pixels';
COMMENT ON COLUMN public.image_metadata.height IS 'Image height in pixels';
COMMENT ON COLUMN public.image_metadata.size_kb IS 'Image file size in kilobytes';
COMMENT ON COLUMN public.image_metadata.aspect_ratio IS 'Image aspect ratio (e.g., "16:9", "4:3", "1:1")';

