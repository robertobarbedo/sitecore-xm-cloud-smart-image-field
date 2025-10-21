# 🔄 Upsert Logic Explained

## Primary Key Strategy

The `image_metadata` table uses a **composite unique constraint** as the primary key for upserts:

```sql
UNIQUE(organization_id, key, image_item_id)
```

This means:
- ✅ Each organization can have multiple images
- ✅ Each key can have multiple images  
- ✅ But the combination of (organization_id + key + image_item_id) must be unique

## How Upsert Works

When you click **Save**, the `upsert_image_metadata` function executes:

```sql
INSERT INTO image_metadata (
    organization_id,
    key,
    image_item_path,
    image_item_id,
    image_preview_path,
    alt_text,
    description
) VALUES (...)
ON CONFLICT (organization_id, key, image_item_id)
DO UPDATE SET
    image_item_path = EXCLUDED.image_item_path,
    image_preview_path = EXCLUDED.image_preview_path,
    alt_text = EXCLUDED.alt_text,
    description = EXCLUDED.description,
    updated_at = NOW()
```

### What This Means:

#### Scenario 1: New Image (INSERT)
```
organizationId: "org_ABC"
key: "key_123"
image_item_id: "new-image-001"
```
- ✅ No existing row with this combination
- ✅ **INSERT** new row into table
- ✅ Returns new UUID

#### Scenario 2: Existing Image (UPDATE)
```
organizationId: "org_ABC"
key: "key_123"
image_item_id: "existing-image-001"  ← Already exists!
```
- ✅ Row with this combination exists
- ✅ **UPDATE** the existing row
- ✅ Updates: image_item_path, image_preview_path, alt_text, description
- ✅ Updates: updated_at timestamp
- ✅ Keeps: id, organization_id, key, image_item_id, created_at
- ✅ Returns existing UUID

## Example Flow

### First Save (INSERT)
```typescript
// User uploads and saves image
upsertImageMetadata({
  organization_id: "org_lxSEYVnF3YpVUlEQ",
  key: "e3641953fabc471fb110d46241bce7a1",
  image_item_path: "/sitecore/media library/test/beach.jpg",
  image_item_id: "item-beach-001",
  image_preview_path: "https://.../-/media/test/beach.jpg",
  alt_text: "Beach sunset",
  description: "Beautiful beach"
});
```

**Result:**
```
✅ NEW row created
id: "550e8400-e29b-41d4-a716-446655440000"
created_at: "2024-01-15 10:00:00"
updated_at: "2024-01-15 10:00:00"
```

### Second Save (UPDATE)
```typescript
// User updates alt text and description
upsertImageMetadata({
  organization_id: "org_lxSEYVnF3YpVUlEQ",  // Same
  key: "e3641953fabc471fb110d46241bce7a1",  // Same
  image_item_id: "item-beach-001",  // Same ← Triggers UPDATE
  image_item_path: "/sitecore/media library/test/beach.jpg",
  image_preview_path: "https://.../-/media/test/beach.jpg",
  alt_text: "Stunning beach sunset",  // Updated!
  description: "Beautiful sunset over the beach"  // Updated!
});
```

**Result:**
```
✅ EXISTING row updated
id: "550e8400-e29b-41d4-a716-446655440000"  // Same ID
created_at: "2024-01-15 10:00:00"  // Unchanged
updated_at: "2024-01-15 10:15:00"  // Updated!
alt_text: "Stunning beach sunset"  // Changed
description: "Beautiful sunset over the beach"  // Changed
```

## Why This Matters

### ✅ No Duplicates
The same image (identified by `image_item_id`) in the same organization and key context will never create duplicate rows.

### ✅ Metadata Updates
When you edit alt text or description and save again, it updates the existing record instead of creating a new one.

### ✅ Data Integrity
- Organization isolation maintained
- Key-based access control preserved
- Image identity tracked by `image_item_id`

## Database Verification

You can verify the constraint is in place:

```sql
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
WHERE conrelid = 'image_metadata'::regclass
    AND contype = 'u';
```

**Result:**
```
constraint_name: image_metadata_organization_id_key_image_item_id_key
constraint_definition: UNIQUE (organization_id, key, image_item_id)
```

## Testing Upsert Behavior

### Test 1: Insert
```sql
SELECT upsert_image_metadata(
    'test_org',
    'test_key',
    '/path/to/image',
    'test-item-001',  ← New item
    'https://preview.url',
    'Test alt',
    'Test description'
);
```

**Expected:** Returns new UUID

### Test 2: Update (same item)
```sql
SELECT upsert_image_metadata(
    'test_org',
    'test_key',
    '/path/to/image',
    'test-item-001',  ← Same item ID
    'https://preview.url',
    'Updated alt',  ← Changed
    'Updated description'  ← Changed
);
```

**Expected:** Returns same UUID, row updated

### Test 3: Verify
```sql
SELECT * FROM image_metadata 
WHERE organization_id = 'test_org' 
AND key = 'test_key' 
AND image_item_id = 'test-item-001';
```

**Expected:** Only ONE row with updated values

## In Your Application

When you click **Save** in the UI:

1. ✅ Extract `organizationId` and `key` from URL
2. ✅ Get `image_item_id` from Sitecore
3. ✅ Call `upsertImageMetadata()` with all fields
4. ✅ Database automatically:
   - Inserts if new
   - Updates if exists
5. ✅ Returns UUID of the record

**You don't need to check if the record exists** - the database handles it automatically!

## Summary

| Field | Role |
|-------|------|
| `organization_id` | Part of composite key - Organization isolation |
| `key` | Part of composite key - Access control |
| `image_item_id` | Part of composite key - Unique image identifier |
| `id` | Database UUID - Internal reference |

**Composite Key = (organization_id + key + image_item_id)**

This ensures:
- ✅ One record per image per organization/key combination
- ✅ Updates instead of duplicates
- ✅ Data integrity maintained
- ✅ Efficient queries and searches

## Current Status

✅ Unique constraint created
✅ Upsert function deployed  
✅ Working correctly in your application
✅ Ready to use - no changes needed!

