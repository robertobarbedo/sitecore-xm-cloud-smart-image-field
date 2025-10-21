-- Migration: Add focus point coordinates to image_metadata table
-- Description: Adds focus_x and focus_y columns to store focal point coordinates for images
-- Date: 2025-10-21

-- Add focus_x column (normalized value between 0 and 1)
ALTER TABLE image_metadata
ADD COLUMN IF NOT EXISTS focus_x NUMERIC(5,4) DEFAULT NULL;

-- Add focus_y column (normalized value between 0 and 1)
ALTER TABLE image_metadata
ADD COLUMN IF NOT EXISTS focus_y NUMERIC(5,4) DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN image_metadata.focus_x IS 'Focal point X coordinate (normalized 0-1, where 0 is left and 1 is right)';
COMMENT ON COLUMN image_metadata.focus_y IS 'Focal point Y coordinate (normalized 0-1, where 0 is top and 1 is bottom)';

-- Add check constraints to ensure values are between 0 and 1
ALTER TABLE image_metadata
ADD CONSTRAINT focus_x_range CHECK (focus_x IS NULL OR (focus_x >= 0 AND focus_x <= 1));

ALTER TABLE image_metadata
ADD CONSTRAINT focus_y_range CHECK (focus_y IS NULL OR (focus_y >= 0 AND focus_y <= 1));

