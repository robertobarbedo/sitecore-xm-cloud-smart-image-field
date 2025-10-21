# Focus Point Feature

This document describes the Focus X and Focus Y fields added to the image metadata system to support focal point storage.

## Overview

Focus X and Focus Y are new fields that will be used to store the focal point coordinates for images. These normalized coordinates (values between 0 and 1) allow for precise specification of the image's focal point, which can be used for smart cropping and responsive image display.

## Database Changes

### Migration: `007_add_focus_point_to_image_metadata.sql`

Added two new columns to the `image_metadata` table:

- **focus_x**: `NUMERIC(5,4)` - Focal point X coordinate (normalized 0-1, where 0 is left and 1 is right)
- **focus_y**: `NUMERIC(5,4)` - Focal point Y coordinate (normalized 0-1, where 0 is top and 1 is bottom)

Both fields:
- Are nullable (optional)
- Have check constraints to ensure values are between 0 and 1
- Are stored with 4 decimal places of precision

### Function Updates

Updated `upsert_image_metadata()` function to include:
- `p_focus_x NUMERIC DEFAULT NULL`
- `p_focus_y NUMERIC DEFAULT NULL`

These parameters are now part of the INSERT and UPDATE operations.

## TypeScript Interface Changes

### Updated Interfaces

The following TypeScript interfaces now include `focusX` and `focusY` fields:

1. **ImageMetadata** (`src/lib/supabase-client.ts`)
   ```typescript
   focus_x?: number;
   focus_y?: number;
   ```

2. **SelectedImage** (`src/app/page.tsx`)
   ```typescript
   focusX?: number;
   focusY?: number;
   ```

3. **SelectedImage** (`src/components/ImageMetadata.tsx`)
   ```typescript
   focusX?: number;
   focusY?: number;
   ```

4. **UploadedImageData** (`src/components/ImageSelector.tsx`)
   ```typescript
   focusX?: number;
   focusY?: number;
   ```

### Updated Functions

1. **upsertImageMetadata()** (`src/lib/supabase-client.ts`)
   - Now passes `p_focus_x` and `p_focus_y` to the Supabase RPC call

2. **handleSave()** (`src/app/page.tsx`)
   - Includes `focus_x` and `focus_y` when saving to Supabase

3. **handleSelectImage()** (`src/components/ImageFind.tsx`)
   - Passes `focusX` and `focusY` when an image is selected

## Data Flow

The focus point data flows through the system as follows:

1. **Storage**: Values are stored in both:
   - Sitecore JSON field (as `focusX` and `focusY` in the SelectedImage object)
   - Supabase database (as `focus_x` and `focus_y` in the image_metadata table)

2. **Reading**: When loading an existing image:
   - Values are parsed from the Sitecore field JSON
   - Can be queried from Supabase for search results

3. **Saving**: When saving an image:
   - Values are serialized to JSON and saved to Sitecore
   - Values are upserted to Supabase for searchability

## Coordinate System

The focal point uses a normalized coordinate system:

- **X-axis (focus_x)**:
  - `0.0` = Left edge
  - `0.5` = Center horizontally
  - `1.0` = Right edge

- **Y-axis (focus_y)**:
  - `0.0` = Top edge
  - `0.5` = Center vertically
  - `1.0` = Bottom edge

### Examples

- Center of image: `focusX: 0.5, focusY: 0.5`
- Top-left corner: `focusX: 0.0, focusY: 0.0`
- Bottom-right corner: `focusX: 1.0, focusY: 1.0`
- Left-center: `focusX: 0.0, focusY: 0.5`

## Future Implementation

These fields are ready to be populated and used. Potential future enhancements:

1. **UI Component**: Add a visual focal point selector in the ImageMetadata component
2. **Smart Cropping**: Use focal point data for intelligent image cropping
3. **Responsive Images**: Generate art-directed responsive images based on focal point
4. **AI Detection**: Automatically detect focal points using computer vision

## Testing

To test the new fields:

1. Upload or select an image
2. Manually add focusX and focusY values to the JSON data
3. Save the image
4. Verify the values are stored in both Sitecore and Supabase
5. Load the image and verify the values are retrieved correctly

## Validation

The database enforces the following constraints:
- Values must be between 0.0 and 1.0 (inclusive)
- Values can be null (focal point is optional)
- Values are stored with 4 decimal places (e.g., 0.3333)

