-- Function: Upsert image metadata
-- This function inserts or updates image metadata based on organization_id, key, and image_item_id

CREATE OR REPLACE FUNCTION upsert_image_metadata(
    p_organization_id TEXT,
    p_key TEXT,
    p_image_item_path TEXT,
    p_image_item_id TEXT,
    p_image_preview_path TEXT,
    p_alt_text TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_image_name TEXT DEFAULT NULL,
    p_image_extension TEXT DEFAULT NULL,
    p_width INTEGER DEFAULT NULL,
    p_height INTEGER DEFAULT NULL,
    p_size_kb NUMERIC DEFAULT NULL,
    p_aspect_ratio TEXT DEFAULT NULL,
    p_mime_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO image_metadata (
        organization_id,
        key,
        image_item_path,
        image_item_id,
        image_preview_path,
        alt_text,
        description,
        image_name,
        image_extension,
        width,
        height,
        size_kb,
        aspect_ratio,
        mime_type
    ) VALUES (
        p_organization_id,
        p_key,
        p_image_item_path,
        p_image_item_id,
        p_image_preview_path,
        p_alt_text,
        p_description,
        p_image_name,
        p_image_extension,
        p_width,
        p_height,
        p_size_kb,
        p_aspect_ratio,
        p_mime_type
    )
    ON CONFLICT (organization_id, key, image_item_id)
    DO UPDATE SET
        image_item_path = EXCLUDED.image_item_path,
        image_preview_path = EXCLUDED.image_preview_path,
        alt_text = EXCLUDED.alt_text,
        description = EXCLUDED.description,
        image_name = EXCLUDED.image_name,
        image_extension = EXCLUDED.image_extension,
        width = EXCLUDED.width,
        height = EXCLUDED.height,
        size_kb = EXCLUDED.size_kb,
        aspect_ratio = EXCLUDED.aspect_ratio,
        mime_type = EXCLUDED.mime_type,
        updated_at = NOW()
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION upsert_image_metadata TO postgres;
GRANT EXECUTE ON FUNCTION upsert_image_metadata TO anon;
GRANT EXECUTE ON FUNCTION upsert_image_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_image_metadata TO service_role;

COMMENT ON FUNCTION upsert_image_metadata IS 'Insert or update image metadata (upsert based on organization_id, key, and image_item_id)';

