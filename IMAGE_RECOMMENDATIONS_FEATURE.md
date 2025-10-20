# Image Recommendations Feature

## Overview
Added support for displaying recommended image dimensions and file size based on URL query parameters. When users upload images, the system validates them against these recommendations and provides visual feedback.

## URL Parameters

### New Query Parameters Supported

1. **`oridim`** - Original/Recommended Dimensions
   - Format: `widthxheight` (e.g., `1920x1080`)
   - Example: `?oridim=1920x1080`

2. **`oriaspect`** - Original/Recommended Aspect Ratio
   - Format: `WperH` (e.g., `3per2` for 3:2, `16per9` for 16:9)
   - Automatically converted to standard format (e.g., `3per2` → `3:2`)
   - Example: `?oriaspect=3per2`

3. **`orisizekb`** - Original/Recommended File Size (in KB)
   - Format: `number` (e.g., `600`)
   - Example: `?orisizekb=600`

### Full URL Examples
```
http://localhost:3000/?key=F06AAE96...&ap=1&oridim=1920x1080&oriaspect=16per9&orisizekb=600
http://localhost:3000/?key=F06AAE96...&ap=1&oriaspect=3per2&orisizekb=600
```

## Features Implemented

### 1. Automatic Parameter Parsing
- Reads `oridim` and `orisizekb` from URL query string on component mount
- Parses dimensions into width and height values
- Stores recommendations in component state

### 2. Recommendations Banner
Displays **before** the user uploads an image:

```
┌────────────────────────────────────────────────┐
│ Recommended Image Specifications:             │
│                                                │
│ Dimensions: 1920×1080 pixels                  │
│ Aspect Ratio: 16:9                            │
│ File Size: ≤600 KB                            │
└────────────────────────────────────────────────┘
```

**Styling:**
- Light blue background (`#e3f2fd`)
- Blue border (`#90caf9`)
- Clear, readable text
- Only shows if recommendations are present

### 3. Validation Results
Displays **after** the user uploads an image:

**If image matches recommendations:**
```
┌────────────────────────────────────────────────┐
│ ✓ Dimensions: 1920×1080                       │
│ ✓ Aspect Ratio: 16:9                          │
│ ✓ Size: 245.67 KB                             │
└────────────────────────────────────────────────┘
```
- Green text for matches (`#2e7d32`)

**If image doesn't match recommendations:**
```
┌────────────────────────────────────────────────┐
│ ⚠ Dimensions: 1280×720 (recommended: 1920×1080)│
│ ⚠ Aspect Ratio: 4:3 (recommended: 16:9)       │
│ ⚠ Size: 850.5 KB (recommended: ≤600 KB)      │
└────────────────────────────────────────────────┘
```
- Orange text for warnings (`#f57c00`)

**Mixed results:**
```
┌────────────────────────────────────────────────┐
│ ✓ Dimensions: 1920×1080                       │
│ ✓ Aspect Ratio: 16:9                          │
│ ⚠ Size: 850.5 KB (recommended: ≤600 KB)      │
└────────────────────────────────────────────────┘
```

### 4. Validation Logic

**Dimensions:**
- Must match exactly: `uploadedWidth === recommendedWidth && uploadedHeight === recommendedHeight`
- Shows actual dimensions vs recommended

**Aspect Ratio:**
- Must match exactly: `uploadedAspectRatio === recommendedAspectRatio`
- Compares calculated aspect ratio (e.g., "16:9") with recommended
- Shows actual aspect ratio vs recommended

**File Size:**
- Must be less than or equal to recommended size: `uploadedSize <= recommendedSize`
- Shows actual size vs maximum recommended

## User Flow

### Without Recommendations
```
1. Open ImageSelector or ImageFind
2. Upload or select image
3. Image is processed and saved
```

### With Recommendations (`?oridim=1920x1080&oriaspect=16per9&orisizekb=600`)
```
1. Open ImageSelector or ImageFind
2. See blue banner with recommendations
   "Recommended Image Specifications:"
   - Dimensions: 1920×1080 pixels
   - Aspect Ratio: 16:9
   - File Size: ≤600 KB
3. Upload or select image
4. Image is processed
5. See validation results (ImageSelector only):
   ✓ Green checks if matches
   ⚠ Orange warnings if doesn't match
6. Image is saved regardless of validation
```

## Technical Implementation

### Component Architecture

**`RecommendedInfoPanel.tsx`** - Reusable component
- Used in both `ImageSelector` and `ImageFind` components
- Handles URL parameter parsing
- Displays recommendations banner
- Shows validation results (when uploadedImage is provided)
- Self-contained with its own styles

### State Variables (in RecommendedInfoPanel)
```typescript
const [recommendedWidth, setRecommendedWidth] = useState<number | null>(null);
const [recommendedHeight, setRecommendedHeight] = useState<number | null>(null);
const [recommendedSizeKb, setRecommendedSizeKb] = useState<number | null>(null);
const [recommendedAspectRatio, setRecommendedAspectRatio] = useState<string | null>(null);
```

### Parsing Logic
```typescript
// Parse oridim (e.g., "1920x1080")
const oridim = urlParams.get('oridim');
if (oridim) {
  const [width, height] = oridim.split('x').map(d => parseInt(d));
  if (width && height) {
    setRecommendedWidth(width);
    setRecommendedHeight(height);
  }
}

// Parse oriaspect (e.g., "3per2" -> "3:2", "16per9" -> "16:9")
const oriaspect = urlParams.get('oriaspect');
if (oriaspect) {
  const aspectRatio = oriaspect.replace('per', ':');
  setRecommendedAspectRatio(aspectRatio);
}

// Parse orisizekb (e.g., "600")
const orisizekb = urlParams.get('orisizekb');
if (orisizekb) {
  const size = parseInt(orisizekb);
  if (size) {
    setRecommendedSizeKb(size);
  }
}
```

### Validation Function
```typescript
const checkRecommendations = () => {
  if (!uploadedImage) return null;
  
  const issues = [];
  const matches = [];
  
  // Check dimensions
  if (recommendedWidth && recommendedHeight) {
    const dimensionsMatch = uploadedImage.width === recommendedWidth 
                         && uploadedImage.height === recommendedHeight;
    if (dimensionsMatch) {
      matches.push(`✓ Dimensions: ${uploadedImage.width}×${uploadedImage.height}`);
    } else {
      issues.push(`⚠ Dimensions: ${uploadedImage.width}×${uploadedImage.height} (recommended: ${recommendedWidth}×${recommendedHeight})`);
    }
  }
  
  // Check file size
  if (recommendedSizeKb && uploadedImage.sizeKb) {
    const sizeMatch = uploadedImage.sizeKb <= recommendedSizeKb;
    if (sizeMatch) {
      matches.push(`✓ Size: ${uploadedImage.sizeKb} KB`);
    } else {
      issues.push(`⚠ Size: ${uploadedImage.sizeKb} KB (recommended: ≤${recommendedSizeKb} KB)`);
    }
  }
  
  return { issues, matches };
};
```

## Design Decisions

### ✅ Non-Blocking Validation
- Images that don't match recommendations are still uploaded
- Warnings are informational, not errors
- Users can proceed with any image size/dimensions

### ✅ Clear Visual Hierarchy
1. Recommendations shown first (blue banner)
2. Upload area in the middle
3. Validation results shown after upload

### ✅ Conditional Display
- Only shows recommendations banner if URL params are present
- Only shows validation results after an image is uploaded
- Gracefully handles missing or malformed parameters

### ✅ User-Friendly Messages
- Uses checkmarks (✓) for success
- Uses warning symbols (⚠) for mismatches
- Shows both actual and recommended values for comparison

## Browser Compatibility
- Uses `URLSearchParams` API (supported in all modern browsers)
- Graceful fallback if window is undefined (SSR safety)
- No external dependencies required

## Testing Scenarios

### Test Case 1: Perfect Match
**URL:** `?oridim=1920x1080&oriaspect=16per9&orisizekb=600`
**Upload:** 1920×1080 image, 16:9 ratio, 245 KB
**Expected:**
- Shows recommendations banner with all three criteria
- Shows three green checkmarks after upload

### Test Case 2: Wrong Dimensions
**URL:** `?oridim=1920x1080&oriaspect=16per9&orisizekb=600`
**Upload:** 1280×720 image, 16:9 ratio, 200 KB
**Expected:**
- Shows recommendations banner
- Shows orange warning for dimensions
- Shows green check for aspect ratio
- Shows green check for size

### Test Case 3: File Too Large
**URL:** `?oridim=1920x1080&oriaspect=16per9&orisizekb=600`
**Upload:** 1920×1080 image, 16:9 ratio, 850 KB
**Expected:**
- Shows recommendations banner
- Shows green check for dimensions
- Shows green check for aspect ratio
- Shows orange warning for size

### Test Case 4: Wrong Aspect Ratio
**URL:** `?oriaspect=16per9`
**Upload:** 1920×1080 image with 4:3 ratio (1024×768)
**Expected:**
- Shows recommendations banner with aspect ratio only
- Shows orange warning for aspect ratio after upload

### Test Case 4: No Recommendations
**URL:** `?key=ABC123` (no oridim or orisizekb)
**Upload:** Any image
**Expected:**
- No recommendations banner
- No validation results
- Normal upload flow

### Test Case 5: Only Aspect Ratio
**URL:** `?oriaspect=3per2`
**Upload:** Any image
**Expected:**
- Shows only aspect ratio in recommendations
- Validates only aspect ratio after upload

### Test Case 6: Multiple Components
**URL:** `?oriaspect=16per9&orisizekb=600`
**Action:** Navigate between New and Find tabs
**Expected:**
- Both ImageSelector (New tab) and ImageFind show same recommendations banner
- Validation only shows in ImageSelector after upload

## Future Enhancements

Potential improvements:
- Allow tolerance range for dimensions (e.g., ±10%)
- Support multiple recommended sizes (small, medium, large)
- Add aspect ratio recommendations
- Show image preview with overlay showing crop areas
- Export validation report
- Block upload if image severely exceeds recommendations (optional strict mode)

## Summary

✅ **URL Parameters Parsed:** `oridim`, `oriaspect`, and `orisizekb`
✅ **Aspect Ratio Support:** Converts "3per2" to "3:2" format automatically
✅ **Reusable Component:** `RecommendedInfoPanel` used in multiple views
✅ **Visible in Both Views:** Shows in ImageSelector (New tab) and ImageFind (Find tab)
✅ **Recommendations Display:** Clear blue banner
✅ **Validation Display:** Green checks and orange warnings (ImageSelector only)
✅ **Non-Blocking:** Images upload regardless of match
✅ **User-Friendly:** Clear, actionable feedback

**The feature provides helpful guidance without preventing users from uploading the images they need!** 🎯

