# Field URL Generator

## Overview

The Field URL Generator is a tool within the Admin interface that helps users create properly formatted URLs for the Smart Image Field custom field in Sitecore.

## How to Access

1. Navigate to the Admin interface (`/admin`)
2. View the Libraries list
3. Click the **"🔗 New Field URL"** button next to any library

## Features

### 1. Auto Publish
- **Checkbox**: Enable/Disable auto-publishing
- **Query String**: `ap=1` (enabled) or `ap=0` (disabled)
- Automatically publishes images after processing

### 2. Original Image Recommendations

#### Dimensions
- **Input**: Width × Height (e.g., 1200 × 800)
- **Query String**: `oridim=1200x800`
- Specifies recommended dimensions for original images

#### File Size
- **Input**: Maximum size in kilobytes (e.g., 500)
- **Query String**: `orisizekb=500`
- Specifies maximum file size for original images

### 3. Viewport-Specific Dimensions

Configure image dimensions for different device viewports:

#### Mobile 📱
- **Query String**: `vmobile=100x200`
- For mobile devices

#### Tablet Portrait 📱
- **Query String**: `vtablet=230x398`
- For tablet devices in portrait orientation

#### Desktop Small 💻
- **Query String**: `vdesksmall=1366x768`
- For smaller desktop displays (the original image is considered the largest)

**Note**: Only selected viewports will be included in the generated URL.

## Generated URL Format

```
http://localhost:3000?key={LIBRARY_KEY}&ap=1&oridim=1200x800&orisizekb=500&vmobile=100x200&vtablet=230x398&vdesksmall=1366x768
```

### Base URL
The base URL is configured via the environment variable:
```
NEXT_PUBLIC_FIELD_URL_HOST=http://localhost:3000
```

### Required Parameter
- `key`: The library's unique identifier (automatically added)

### Optional Parameters
All other parameters are optional and only included if configured:
- `ap`: Auto-publish setting
- `oridim`: Original image dimensions
- `orisizekb`: Original image size in KB
- `vmobile`: Mobile viewport dimensions
- `vtablet`: Tablet viewport dimensions
- `vdesksmall`: Small desktop viewport dimensions

## Using the Generated URL

### Copy the URL
Select and copy the generated URL from the text field.

### Configure Sitecore Custom Field
1. In Sitecore, navigate to your Custom Field configuration
2. Use the generated URL as the field's source URL
3. The Smart Image Field will load with your specified configuration

## Example Workflow

1. **Select Library**: Click "New Field URL" for the "Products" library
2. **Configure Options**:
   - Enable Auto Publish ✓
   - Set original dimensions: 1920 × 1080
   - Set max file size: 800 KB
   - Add Mobile viewport: 375 × 667
   - Add Desktop Small viewport: 1366 × 768
3. **Copy URL**: Select and copy the URL from the text field
4. **Use in Sitecore**: Paste the URL into your Custom Field configuration

## Technical Details

### No Data Storage
- The URL Generator does not store any configuration
- It's a client-side tool for generating URLs
- URLs are generated dynamically based on user input

### Environment Configuration
Make sure to set the `NEXT_PUBLIC_FIELD_URL_HOST` environment variable to the appropriate host for your environment:

**Development:**
```env
NEXT_PUBLIC_FIELD_URL_HOST=http://localhost:3000
```

**Production:**
```env
NEXT_PUBLIC_FIELD_URL_HOST=https://your-production-domain.com
```

## UI Features

### Prominent Button
The "New Field URL" button is styled with:
- Purple gradient background
- Link icon (🔗)
- Shadow effect for prominence
- Hover animation

### Real-time URL Generation
The URL updates automatically as you configure options, providing instant feedback. Click the URL field to select all text for easy copying.

### Responsive Design
The interface adapts to different screen sizes for optimal usability on all devices.

## Benefits

✅ **Easy URL Creation** - No need to manually construct query strings
✅ **Error Prevention** - Proper formatting guaranteed
✅ **Visual Feedback** - See the URL as you configure
✅ **Easy Selection** - Click to select entire URL
✅ **Guidance** - Built-in instructions for usage
✅ **No Storage Required** - Pure utility tool

## Future Enhancements

Potential future features:
- URL templates/presets
- Validation for dimension ratios
- Preview of what each viewport means
- More viewport options
- URL history/favorites

