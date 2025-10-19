# Database Changelog

## [2024-01-XX] - Added Image Name and Extension Fields

### Added

#### Database Schema
- ✅ Added `image_name` column (TEXT, nullable) - Stores file name without extension
- ✅ Added `image_extension` column (TEXT, nullable) - Stores file extension (jpg, png, etc.)

#### Functions Updated
- ✅ `upsert_image_metadata()` - Now accepts `p_image_name` and `p_image_extension` parameters
- ✅ `search_images_by_text()` - Returns `image_name` and `image_extension` in results
- ✅ `search_images_by_text()` - Now also searches by image name (case-insensitive)

#### Application Code
- ✅ Updated `SelectedImage` interface in `src/app/page.tsx`
- ✅ Updated `ImageMetadata` interface in `src/lib/supabase-client.ts`
- ✅ Updated `UploadedImageData` interface in `src/components/ImageSelector.tsx`
- ✅ `handleFileUpload()` now extracts name and extension from uploaded file
- ✅ `loadExistingValue()` now extracts name and extension from itemPath if not present
- ✅ `handleSave()` now saves name and extension to both Sitecore and Supabase
- ✅ Change detection includes name and extension fields

### Migration Applied

```sql
ALTER TABLE image_metadata 
ADD COLUMN IF NOT EXISTS image_name TEXT,
ADD COLUMN IF NOT EXISTS image_extension TEXT;
```

### Data Structure

#### Sitecore Field Value (JSON)
```json
{
  "path": "/sitecore/media library/Default Website/2024/...",
  "itemPath": "/sitecore/media library/.../beach.jpg",
  "itemId": "item-123",
  "imageUrl": "https://.../beach.jpg",
  "altText": "Beach sunset",
  "description": "Beautiful beach at sunset",
  "imageName": "beach",
  "imageExtension": "jpg"
}
```

#### Database Record
```sql
{
  id: "uuid",
  organization_id: "org_xxx",
  key: "key_xxx",
  image_item_path: "/sitecore/media library/.../beach.jpg",
  image_item_id: "item-123",
  image_preview_path: "https://.../beach.jpg",
  alt_text: "Beach sunset",
  description: "Beautiful beach at sunset",
  image_name: "beach",          -- NEW
  image_extension: "jpg",        -- NEW
  created_at: "2024-01-XX",
  updated_at: "2024-01-XX"
}
```

### Benefits

1. **Easier Searching** - Users can search by file name
2. **Better Organization** - Filter images by extension type
3. **Metadata Completeness** - Full file information available
4. **Future Features** - Enable filtering by file type (JPG, PNG, GIF, etc.)

### Example Usage

#### Upload New Image
```typescript
// Automatically extracts from file name
const file = new File(['...'], 'beach-sunset.jpg', { type: 'image/jpeg' });
// Results in:
// imageName: "beach-sunset"
// imageExtension: "jpg"
```

#### Search by Name
```sql
SELECT * FROM search_images_by_text(
  'org_xxx',
  'key_xxx',
  'beach',  -- Will match image_name
  10
);
```

#### Load Existing Image
```typescript
// If old data doesn't have name/extension, it's extracted from itemPath
// itemPath: "/sitecore/.../photo.png"
// Results in:
// imageName: "photo"
// imageExtension: "png"
```

### Backward Compatibility

✅ **Fully backward compatible**
- Existing records without name/extension will work fine
- Fields are nullable
- Name/extension extracted automatically on load if missing
- No data migration required

### Testing

To test the new fields:

1. **Upload a new image** - Check console logs for name and extension
2. **Save the image** - Verify data in Supabase includes name and extension
3. **Reload the page** - Existing images should show name and extension
4. **Search by name** - Try searching for the file name

### Database Verification

```sql
-- Check new columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'image_metadata'
AND column_name IN ('image_name', 'image_extension');

-- View data with new fields
SELECT 
  image_name,
  image_extension,
  image_item_path,
  alt_text
FROM image_metadata
ORDER BY created_at DESC
LIMIT 10;
```

---

## [2024-01-XX] - Initial Database Setup

### Added
- Created `image_metadata` table
- Added full-text search with `search_vector`
- Created `upsert_image_metadata()` function
- Created `search_images_by_text()` function
- Enabled Row Level Security
- Set up indexes for performance

