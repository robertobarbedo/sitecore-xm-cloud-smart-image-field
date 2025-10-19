-- Verification Script for Upsert Setup
-- Run this in Supabase SQL Editor to verify everything is working

-- 1. Check the unique constraint exists
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conrelid = 'image_metadata'::regclass
    AND contype = 'u';
-- Expected: UNIQUE (organization_id, key, image_item_id)

-- 2. Test INSERT (first time)
SELECT upsert_image_metadata(
    'test_org_001',
    'test_key_001',
    '/sitecore/media library/test/image1.jpg',
    'test-item-001',
    'https://example.com/preview/image1.jpg',
    'Test Image 1',
    'This is the first save'
) AS first_save_id;
-- Expected: Returns a UUID

-- 3. Get the record
SELECT * FROM image_metadata 
WHERE organization_id = 'test_org_001' 
AND key = 'test_key_001'
AND image_item_id = 'test-item-001';
-- Expected: One row with alt_text = 'Test Image 1'

-- 4. Test UPDATE (same keys)
SELECT upsert_image_metadata(
    'test_org_001',
    'test_key_001',
    '/sitecore/media library/test/image1.jpg',
    'test-item-001',  -- Same item_id
    'https://example.com/preview/image1.jpg',
    'Updated Test Image 1',  -- Changed alt text
    'This is the updated description'  -- Changed description
) AS second_save_id;
-- Expected: Returns THE SAME UUID as first_save_id

-- 5. Verify UPDATE (should still be only one row)
SELECT 
    id,
    alt_text,
    description,
    created_at,
    updated_at
FROM image_metadata 
WHERE organization_id = 'test_org_001' 
AND key = 'test_key_001'
AND image_item_id = 'test-item-001';
-- Expected: 
-- - Only ONE row
-- - alt_text = 'Updated Test Image 1'
-- - description = 'This is the updated description'
-- - updated_at > created_at

-- 6. Test INSERT (different item_id)
SELECT upsert_image_metadata(
    'test_org_001',
    'test_key_001',
    '/sitecore/media library/test/image2.jpg',
    'test-item-002',  -- Different item_id
    'https://example.com/preview/image2.jpg',
    'Test Image 2',
    'This is a different image'
) AS third_save_id;
-- Expected: Returns a DIFFERENT UUID

-- 7. Verify both records exist
SELECT 
    image_item_id,
    alt_text,
    description
FROM image_metadata 
WHERE organization_id = 'test_org_001' 
AND key = 'test_key_001'
ORDER BY created_at;
-- Expected: TWO rows
-- Row 1: test-item-001, 'Updated Test Image 1'
-- Row 2: test-item-002, 'Test Image 2'

-- 8. Clean up test data
DELETE FROM image_metadata 
WHERE organization_id = 'test_org_001' 
AND key = 'test_key_001';
-- Expected: 2 rows deleted

-- ✅ If all tests pass, your upsert is working correctly!

