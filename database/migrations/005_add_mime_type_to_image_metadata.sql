-- Migration: Add mime_type column to image_metadata table
-- Date: 2025-10-21
-- Description: Adds a column to store the MIME type of uploaded images (e.g., image/jpeg, image/png)

-- Add mime_type column to image_metadata table
ALTER TABLE public.image_metadata
ADD COLUMN mime_type VARCHAR(100);

-- Create an index for filtering by mime_type
CREATE INDEX IF NOT EXISTS idx_image_metadata_mime_type
ON public.image_metadata(organization_id, key, mime_type);

-- Add a comment to the column
COMMENT ON COLUMN public.image_metadata.mime_type IS 'MIME type of the image (e.g., image/jpeg, image/png)';

