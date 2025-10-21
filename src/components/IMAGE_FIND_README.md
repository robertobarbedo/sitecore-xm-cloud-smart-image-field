# ImageFind Component Documentation

## Overview

The ImageFind component provides a powerful search interface for finding and selecting images from your database. It features real-time search, sorting, and pagination.

## Features

### ✅ Real-time Search
- **Debounced input** - 300ms delay to prevent excessive API calls
- **Type-ahead search** - Results update as you type
- **Vector search** - Uses PostgreSQL full-text search for semantic matching
- **No search button needed** - Automatically searches on input change

### ✅ Advanced Sorting
- **Sort by Name** - Alphabetical sorting by image file name
- **Sort by Date** - Chronological sorting by creation date
- **Toggle order** - Ascending ↑ or Descending ↓
- **Persists during search** - Sort order maintained as you search

### ✅ Pagination
- **10 images per page** - Optimized for performance
- **Page navigation** - Previous/Next buttons
- **Page indicator** - Shows current page and total pages
- **Auto-reset** - Returns to page 1 on new search

### ✅ Visual Display
- **Thumbnail grid** - Responsive grid layout
- **Image preview** - 150x150px thumbnails
- **Fallback image** - Shows placeholder if image fails to load
- **Image info** - Displays name, alt text, and creation date
- **Selection indicator** - Highlights selected image

### ✅ User Experience
- **Loading states** - Shows "Searching..." during queries
- **Error handling** - Displays error messages gracefully
- **Empty states** - Helpful messages when no results
- **Results count** - Shows number of images found
- **Click to select** - Click any image to select it

## Usage

### Basic Usage

```typescript
import { ImageFind } from '@/src/components/ImageFind';

<ImageFind 
  client={client}
  onImageSelected={handleImageSelected}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `client` | `ClientSDK` | Yes | Sitecore Marketplace SDK client |
| `onImageSelected` | `(imageData: any) => void` | No | Callback when image is selected |

### Image Selection

When an image is selected, the `onImageSelected` callback receives:

```typescript
{
  path: string;              // Folder path
  itemPath: string;          // Full Sitecore media library path
  itemId: string;            // Sitecore item ID
  previewUrl: string;          // Preview URL
  altText: string;           // Alt text from metadata
  description: string;       // Description from metadata
  imageName: string;         // File name without extension
  imageExtension: string;    // File extension (jpg, png, etc.)
}
```

## Search Functionality

### How Search Works

1. **User types** in the search box
2. **300ms debounce** - Waits for user to stop typing
3. **Vector search** - Queries using PostgreSQL full-text search
4. **Matches found** in:
   - Image name (case-insensitive)
   - Alt text (weighted higher)
   - Description (weighted lower)
5. **Results sorted** by relevance or selected field
6. **Display** in paginated grid

### Search Examples

```typescript
// Search by name
"beach" → Matches: beach-sunset.jpg

// Search by description
"sunset ocean" → Matches images with these words in description

// Search by alt text
"landscape" → Matches images with "landscape" in alt text

// Empty search
"" → Shows all images (sorted by creation date, newest first)
```

## Sorting Options

### Date Created (Default)
- **Newest first** (desc) - Default
- **Oldest first** (asc)

### Image Name
- **A to Z** (asc)
- **Z to A** (desc)

## Pagination

- **10 images per page** - Fixed page size
- **Previous/Next buttons** - Navigate between pages
- **Auto-disable** - Buttons disabled at first/last page
- **Page counter** - "Page X of Y"
- **Reset on search** - Returns to page 1 when search changes

## Image Display

### Thumbnail Loading

Images are loaded from:
```
config.previewHost + "-/media/" + path
```

Example:
```
https://example.com/-/media/Default Website/2024/01/15/beach.jpg
```

### Fallback Behavior

If an image fails to load:
1. `onError` event triggers
2. Shows SVG placeholder with "No Image" text
3. User can still select the image
4. Metadata is still accessible

## Styling

The component uses inline JSX styles following the Sitecore design system:

- **Clean, minimal design** - Matches Sitecore UI
- **Subtle borders** - #e5e5e5
- **Blue accent** - #1e90ff for selection and hover
- **Responsive grid** - Auto-fill with min 150px columns
- **13px base font** - Consistent with app

## States

### Loading State
```
Searching...
X images found
```

### Empty State (No Results)
```
🔍
No images found matching your search
Try different search terms
```

### Empty State (No Images)
```
🔍
No images yet
Upload your first image to get started
```

### Error State
```
[Red box with error message]
Failed to search images. Please try again.
```

## Performance Optimizations

1. **Debounced Search** - Reduces API calls
2. **Limited Results** - Fetches max 100 images
3. **Client-side Pagination** - No API calls between pages
4. **Client-side Sorting** - No API calls when changing sort
5. **Image Loading** - Lazy loads only visible images

## Integration

### With Main App

The component integrates with the main app through:

1. **Image Selection** - Calls `handleImageSelected` in parent
2. **State Update** - Updates `selectedImage` state
3. **Save Button** - Enables when image is selected
4. **Metadata Tab** - Can edit selected image metadata

### With Database

Queries use:
- `searchImagesByText()` - For searches with query
- `getAllImages()` - For empty search (show all)
- `getUrlParams()` - Extracts organizationId and key from URL

## Security

- **Organization isolation** - Only shows images for current org
- **Key validation** - Requires valid key from URL
- **Read-only** - Cannot modify images from Find tab
- **No sensitive data** - Only displays metadata

## Example Flow

1. User switches to "Find" tab
2. Component loads all images (newest first)
3. User types "beach" in search
4. After 300ms, searches database
5. Results filtered by "beach" in name/description
6. User clicks sort by "Name"
7. Results re-sorted alphabetically
8. User clicks an image
9. Image selected, shown in thumbnail preview
10. User can save or switch to Metadata tab

## Future Enhancements

Potential improvements:
- [ ] Filter by file extension (JPG, PNG, GIF)
- [ ] Filter by date range
- [ ] Bulk selection
- [ ] Delete images
- [ ] Image preview modal
- [ ] Drag and drop reordering
- [ ] Export search results
- [ ] Save search queries

## Troubleshooting

### No Images Showing

**Problem**: Component shows "No images yet"

**Solutions**:
1. Upload images using the "New" tab
2. Save images to database
3. Check URL has `organizationId` and `key` parameters
4. Verify images were saved to correct organization

### Search Not Working

**Problem**: Search returns no results

**Solutions**:
1. Check console for errors
2. Verify Supabase connection
3. Try empty search to see all images
4. Check image metadata has text in alt/description

### Images Not Loading

**Problem**: Thumbnails show "No Image"

**Solutions**:
1. Verify `config.previewHost` is correct
2. Check image paths in database
3. Test image URL in browser
4. Check Sitecore media library permissions

## Code Example

Complete usage example:

```typescript
import { useState } from 'react';
import { ImageFind } from '@/src/components/ImageFind';

function MyComponent() {
  const [selectedImage, setSelectedImage] = useState(null);
  const { client } = useMarketplaceClient();

  const handleImageSelected = (imageData) => {
    setSelectedImage(imageData);
    console.log('Selected image:', imageData);
  };

  return (
    <div>
      <ImageFind 
        client={client}
        onImageSelected={handleImageSelected}
      />
      
      {selectedImage && (
        <div>
          Selected: {selectedImage.imageName}.{selectedImage.imageExtension}
        </div>
      )}
    </div>
  );
}
```

## Dependencies

- React (hooks: useState, useEffect, useCallback)
- Sitecore Marketplace SDK (`ClientSDK`)
- Supabase client (`searchImagesByText`, `getAllImages`, `getUrlParams`)
- Config (`getConfig`)

## Accessibility

- ✅ Keyboard navigation supported
- ✅ Alt text on images
- ✅ Focus states visible
- ✅ Button titles for screen readers
- ✅ Semantic HTML structure

## Browser Support

Tested and working in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Related Components

- **ImageSelector** - Upload new images
- **ImageMetadata** - Edit image metadata
- **AppContext** - View application context

