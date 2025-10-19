-- Function: Search images by text query
-- This function provides full-text search on alt_text and description fields

CREATE OR REPLACE FUNCTION search_images_by_text(
    p_organization_id TEXT,
    p_key TEXT,
    p_search_query TEXT,
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    organization_id TEXT,
    key TEXT,
    image_item_path TEXT,
    image_item_id TEXT,
    image_preview_path TEXT,
    alt_text TEXT,
    description TEXT,
    relevance REAL,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        im.id,
        im.organization_id,
        im.key,
        im.image_item_path,
        im.image_item_id,
        im.image_preview_path,
        im.alt_text,
        im.description,
        ts_rank(im.search_vector, websearch_to_tsquery('english', p_search_query)) AS relevance,
        im.created_at,
        im.updated_at
    FROM image_metadata im
    WHERE 
        im.organization_id = p_organization_id
        AND im.key = p_key
        AND im.search_vector @@ websearch_to_tsquery('english', p_search_query)
    ORDER BY relevance DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_images_by_text TO postgres;
GRANT EXECUTE ON FUNCTION search_images_by_text TO anon;
GRANT EXECUTE ON FUNCTION search_images_by_text TO authenticated;
GRANT EXECUTE ON FUNCTION search_images_by_text TO service_role;

COMMENT ON FUNCTION search_images_by_text IS 'Search images using full-text search on alt_text and description fields';

