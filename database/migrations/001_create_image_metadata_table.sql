-- Migration: Create image_metadata table with full-text search
-- Description: Stores image metadata for the smart image field with semantic search capabilities

-- Create the image_metadata table
CREATE TABLE IF NOT EXISTS image_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    key TEXT NOT NULL,
    image_item_path TEXT NOT NULL,
    image_item_id TEXT NOT NULL,
    image_preview_path TEXT NOT NULL,
    alt_text TEXT,
    description TEXT,
    
    -- Full-text search column (automatically maintained)
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(alt_text, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B')
    ) STORED,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite unique constraint on organization_id, key, and image_item_id
    UNIQUE(organization_id, key, image_item_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_image_metadata_org_key 
    ON image_metadata(organization_id, key);

CREATE INDEX IF NOT EXISTS idx_image_metadata_item_id 
    ON image_metadata(image_item_id);

-- GIN index for full-text search on the search_vector column
CREATE INDEX IF NOT EXISTS idx_image_metadata_search 
    ON image_metadata USING GIN(search_vector);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_image_metadata_updated_at ON image_metadata;
CREATE TRIGGER update_image_metadata_updated_at
    BEFORE UPDATE ON image_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE image_metadata ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only access rows matching their organization_id and key
DROP POLICY IF EXISTS "Access based on org and key" ON image_metadata;
CREATE POLICY "Access based on org and key"
    ON image_metadata
    FOR ALL
    USING (
        organization_id = current_setting('app.organization_id', TRUE) AND
        key = current_setting('app.key', TRUE)
    );

-- Grant permissions (adjust if you have specific roles)
GRANT ALL ON image_metadata TO postgres;
GRANT ALL ON image_metadata TO anon;
GRANT ALL ON image_metadata TO authenticated;
GRANT ALL ON image_metadata TO service_role;

-- Comment on table and columns for documentation
COMMENT ON TABLE image_metadata IS 'Stores metadata for images in the smart image field';
COMMENT ON COLUMN image_metadata.organization_id IS 'Organization identifier from Sitecore';
COMMENT ON COLUMN image_metadata.key IS 'Access key for the content';
COMMENT ON COLUMN image_metadata.image_item_path IS 'Full path to the image in Sitecore media library';
COMMENT ON COLUMN image_metadata.image_item_id IS 'Unique item ID from Sitecore';
COMMENT ON COLUMN image_metadata.image_preview_path IS 'URL path for image preview';
COMMENT ON COLUMN image_metadata.alt_text IS 'Alt text for accessibility';
COMMENT ON COLUMN image_metadata.description IS 'Detailed description for semantic search';
COMMENT ON COLUMN image_metadata.search_vector IS 'Full-text search vector (automatically maintained)';

