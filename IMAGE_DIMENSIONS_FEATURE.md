# Image Dimensions and Filtering Feature

## Overview
Added comprehensive image metadata tracking (dimensions, size, aspect ratio) with advanced filtering capabilities in the Find tool.

## Database Changes

### Migration: `004_add_image_dimensions_and_metadata.sql`
Added four new columns to the `image_metadata` table:
- `width` (INTEGER) - Image width in pixels
- `height` (INTEGER) - Image height in pixels  
- `size_kb` (NUMERIC(10,2)) - Image file size in kilobytes
- `aspect_ratio` (VARCHAR(20)) - Image aspect ratio (e.g., "16:9", "4:3", "1:1")

**Indexes added for performance:**
- `idx_image_metadata_dimensions` - For width/height filtering
- `idx_image_metadata_aspect_ratio` - For aspect ratio filtering
- `idx_image_metadata_size` - For size-based queries

### Updated Database Function
**`upsert_image_metadata.sql`** - Updated to accept and store the new metadata fields

## Code Changes

### 1. TypeScript Types (`src/lib/supabase-client.ts`)
Updated `ImageMetadata` interface to include:
```typescript
width?: number;
height?: number;
size_kb?: number;
aspect_ratio?: string;
```

### 2. Image Upload (`src/components/ImageSelector.tsx`)
**New Functionality:**
- Automatically reads image dimensions when file is selected
- Calculates file size in KB
- Computes aspect ratio using GCD algorithm
- All metadata is captured and included in upload

**New Helper Functions:**
- `gcd(a, b)` - Greatest Common Divisor calculator
- `calculateAspectRatio(width, height)` - Returns simplified ratio (e.g., "16:9")
- `getImageDimensions(file)` - Loads image to extract width/height

### 3. Sitecore Field Storage (`src/app/page.tsx`)
**Updated `SelectedImage` interface** to include new fields:
```typescript
width?: number;
height?: number;
sizeKb?: number;
aspectRatio?: string;
```

**Updated `handleSave`** - Now saves all metadata to both:
- Sitecore field (as JSON)
- Supabase database (for search/filtering)

### 4. Find Tool Filters (`src/components/ImageFind.tsx`)

#### New Filter UI (Left Sidebar)
**Dimensions Filter:**
- Width input field
- Height input field  
- "Approximate (±10%)" checkbox for fuzzy matching
  - When enabled: Allows 10% variance in dimensions
  - When disabled: Exact dimension matching

**Aspect Ratio Filter:**
- Dropdown with common aspect ratios:
  - 1:1 (Square)
  - 4:3 (Standard)
  - 3:2 (Classic)
  - 16:9 (Widescreen)
  - 21:9 (Ultrawide)
  - 9:16 (Portrait)
  - 2:3 (Portrait)
  - 3:4 (Portrait)

**Clear Filters Button:**
- Appears when any filter is active
- Resets all filters with one click

#### Filter Logic
**`filterResults(results)`** - Client-side filtering function:
- Filters by width/height with exact or approximate matching
- Filters by aspect ratio (exact match)
- Filters are applied after search but before sorting
- Filters work in combination (AND logic)

#### Layout Changes
- New two-column layout with filters sidebar (220px) on left
- Main content area on right (flex: 1)
- Responsive design with proper spacing

## User Experience

### Upload Flow
1. User selects/drops image
2. System reads image properties automatically:
   - Dimensions extracted from image file
   - File size calculated
   - Aspect ratio computed
3. All metadata saved automatically with image
4. No user input required for metadata capture

### Find/Search Flow
1. User can search by text (existing)
2. **NEW**: Filter by dimensions
   - Enter width and/or height
   - Toggle approximate matching for flexibility
3. **NEW**: Filter by aspect ratio
   - Select from dropdown of common ratios
4. Filters apply in real-time
5. Results show matching images only
6. Clear filters button resets all at once

## Data Flow

```
Upload:
File Selection → Read Dimensions → Calculate Size → Compute Aspect Ratio
    ↓
Upload to Sitecore + Save to Database
    ↓
Store in Sitecore Field JSON + Store in Supabase

Search/Find:
Load Images from Database → Apply Text Search → Apply Filters
    ↓
Filter by Dimensions (exact or ±10%)
    ↓
Filter by Aspect Ratio
    ↓
Sort Results → Paginate → Display
```

## Example Data

### Sitecore Field JSON (before):
```json
{
  "path": "/sitecore/media library/Images",
  "itemPath": "/sitecore/media library/Images/photo",
  "itemId": "abc123",
  "imageUrl": "https://...",
  "altText": "Photo",
  "description": "A nice photo"
}
```

### Sitecore Field JSON (after):
```json
{
  "path": "/sitecore/media library/Images",
  "itemPath": "/sitecore/media library/Images/photo",
  "itemId": "abc123",
  "imageUrl": "https://...",
  "altText": "Photo",
  "description": "A nice photo",
  "width": 1920,
  "height": 1080,
  "sizeKb": 245.67,
  "aspectRatio": "16:9"
}
```

## Testing Checklist

- [ ] Run migration `004_add_image_dimensions_and_metadata.sql`
- [ ] Deploy updated `upsert_image_metadata` function
- [ ] Upload a new image and verify metadata is captured
- [ ] Check Sitecore field JSON includes new fields
- [ ] Check Supabase table has new column values
- [ ] Test dimension filter with exact matching
- [ ] Test dimension filter with approximate matching
- [ ] Test aspect ratio filter
- [ ] Test combining multiple filters
- [ ] Test "Clear Filters" button
- [ ] Verify filters work with text search

## Future Enhancements

Potential improvements:
- Add file size filter (min/max KB)
- Add orientation filter (landscape/portrait/square)
- Add dimension range sliders instead of text inputs
- Add custom aspect ratio input
- Show metadata in image cards/tooltips
- Export filtered results
- Bulk operations on filtered images

## Performance Notes

- Image dimension reading happens client-side (no server overhead)
- Filters applied client-side after database query
- Indexes added for future server-side filtering optimization
- Currently loads 100 images max for filtering (configurable)

