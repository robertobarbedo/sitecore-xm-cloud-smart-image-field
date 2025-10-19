# Folder Overlap Validation

## Overview

Library folders must be completely separate and cannot overlap. This prevents one library from containing or being contained within another library's folder structure.

## Validation Rules

### ✅ Valid Scenarios (Separate Folders)

These libraries have completely separate folders:

```
Library A: /sitecore/media library/Images/Main Library
Library B: /sitecore/media library/Images/Products
Library C: /sitecore/media library/Images/Marketing
Library D: /sitecore/media library/Documents
```

**Why Valid:**
- All folders are siblings under `/Images/` (or different parents)
- No folder is inside another folder
- Each library has its own isolated space

### ❌ Invalid Scenarios (Overlapping Folders)

#### Scenario 1: Child Folder
```
Existing: /sitecore/media library/Images/Main Library
New:      /sitecore/media library/Images/Main Library/Products  ❌

Error: "Folder cannot be inside existing library 'Main Library'"
```

**Why Invalid:** The new folder is a child (subfolder) of an existing library.

#### Scenario 2: Parent Folder
```
Existing: /sitecore/media library/Images/Products
New:      /sitecore/media library/Images                        ❌

Error: "Folder cannot be a parent of existing library 'Products'"
```

**Why Invalid:** The new folder is a parent (contains) an existing library.

#### Scenario 3: Exact Duplicate
```
Existing: /sitecore/media library/Images/Main Library
New:      /sitecore/media library/Images/Main Library           ❌

Error: "Folder is already used by library 'Main Library'"
```

**Why Invalid:** Two libraries cannot share the exact same folder.

## Examples

### Example 1: Creating Product Images Library

**Existing Libraries:**
- Main Library: `/sitecore/media library/Images/Main Library`

**Trying to Create:**
```
Name: Product Images
Folder: /sitecore/media library/Images/Products  ✅ VALID
```

**Result:** ✅ Allowed - separate sibling folder

---

### Example 2: Invalid Subfolder Attempt

**Existing Libraries:**
- Main Library: `/sitecore/media library/Images/Main Library`

**Trying to Create:**
```
Name: Logos
Folder: /sitecore/media library/Images/Main Library/Logos  ❌ INVALID
```

**Error:**
```
Folder cannot be inside existing library "Main Library" 
(/sitecore/media library/Images/Main Library)
```

**Solution:** Use a sibling folder instead:
```
Folder: /sitecore/media library/Images/Logos  ✅ VALID
```

---

### Example 3: Invalid Parent Folder Attempt

**Existing Libraries:**
- Main Library: `/sitecore/media library/Images/Main Library`
- Products: `/sitecore/media library/Images/Products`

**Trying to Create:**
```
Name: All Images
Folder: /sitecore/media library/Images  ❌ INVALID
```

**Error:**
```
Folder cannot be a parent of existing library "Main Library" 
(/sitecore/media library/Images/Main Library)
```

**Solution:** Use a different location or more specific path:
```
Folder: /sitecore/media library/AllImages  ✅ VALID
```

---

### Example 4: Complex Structure

**Valid Library Structure:**
```
/sitecore/media library/
  ├── Images/
  │   ├── Main Library/           (Library 1)
  │   ├── Products/               (Library 2)
  │   ├── Marketing/              (Library 3)
  │   └── Team/                   (Library 4)
  ├── Documents/
  │   └── Brochures/              (Library 5)
  └── Videos/                      (Library 6)
```

**All Valid:** Each library has its own isolated folder.

---

**Invalid Attempts:**
```
/sitecore/media library/Images                        ❌ Parent of Libraries 1-4
/sitecore/media library/Images/Products/Categories    ❌ Child of Library 2
/sitecore/media library/Documents                     ❌ Parent of Library 5
```

## Implementation Details

### Client-Side Validation

The validation happens in the form before submission:

```typescript
// In LibraryForm.tsx
const folderError = validateFolder(
  formData.folder,      // Folder being validated
  existingLibraries,    // All existing libraries
  formData.key          // Current library key (if editing)
);

if (folderError) {
  validationErrors.push(folderError);
}
```

### Server-Side Validation

The validation also happens when saving to Supabase:

```typescript
// In supabase-admin.ts - createLibrary()
const existingLibraries = await listLibraries(organizationId);
const folderError = validateFolder(library.folder, existingLibraries);

if (folderError) {
  throw new Error(`Folder validation failed: ${folderError}`);
}
```

### Path Normalization

Paths are normalized before comparison:
- Convert to lowercase
- Remove trailing slashes
- Trim whitespace

```typescript
// These are treated as identical:
"/sitecore/media library/Images/Products"
"/sitecore/media library/Images/Products/"
"/SITECORE/MEDIA LIBRARY/IMAGES/PRODUCTS"
```

### Overlap Detection Algorithm

```typescript
function pathsOverlap(path1, path2):
  // Check if path1 is parent of path2
  if (path2.startsWith(path1 + '/')) return true
  
  // Check if path1 is child of path2
  if (path1.startsWith(path2 + '/')) return true
  
  return false
```

## Format Validation

In addition to overlap checks, folder paths must follow these rules:

### ✅ Valid Format Rules

1. **Must start with slash:**
   ```
   /sitecore/media library/Images  ✅
   sitecore/media library/Images   ❌
   ```

2. **No consecutive slashes:**
   ```
   /sitecore/media library/Images    ✅
   /sitecore//media library/Images   ❌
   ```

3. **No invalid characters:**
   ```
   /sitecore/media library/Images    ✅
   /sitecore/media<library>/Images   ❌
   ```

   Invalid characters: `< > : " | ? *`

## User Experience

### Form Validation

When a user enters an overlapping folder:

1. **Real-time validation** on form submission
2. **Clear error message** explaining the issue
3. **Specific library name** mentioned in the error
4. **Prevents save** until fixed

### Error Display

```
┌─────────────────────────────────────────┐
│ Please fix the following errors:       │
│                                         │
│ • Folder cannot be inside existing     │
│   library "Main Library"                │
│   (/sitecore/media library/Images/     │
│   Main Library)                         │
└─────────────────────────────────────────┘
```

### Visual Feedback

- Error shown in red error box
- Form field remains editable
- User can correct and retry

## Best Practices

### 1. Use Descriptive Folder Names
```
✅ Good:
  - /sitecore/media library/Images/Products
  - /sitecore/media library/Images/Marketing
  - /sitecore/media library/Documents/PDFs

❌ Bad:
  - /sitecore/media library/Images/Lib1
  - /sitecore/media library/Images/Temp
  - /sitecore/media library/X
```

### 2. Keep Folders at Same Level
```
✅ Good (siblings):
  - /sitecore/media library/Images/Main
  - /sitecore/media library/Images/Products
  - /sitecore/media library/Images/Marketing

❌ Bad (nested):
  - /sitecore/media library/Images/Main
  - /sitecore/media library/Images/Main/Products
  - /sitecore/media library/Images/Main/Marketing
```

### 3. Plan Folder Structure in Advance
```
Recommended Structure:

/sitecore/media library/
  ├── Images/
  │   ├── Main/
  │   ├── Products/
  │   ├── Marketing/
  │   ├── Team/
  │   └── Events/
  ├── Documents/
  │   ├── Brochures/
  │   └── Reports/
  └── Videos/
      ├── Tutorials/
      └── Presentations/
```

### 4. Use Consistent Naming
```
✅ Consistent:
  - /sitecore/media library/Images/Products
  - /sitecore/media library/Images/Marketing
  - /sitecore/media library/Images/Events

❌ Inconsistent:
  - /sitecore/media library/Images/products
  - /sitecore/media library/IMAGES/Marketing
  - /Sitecore/Media Library/images/events
```

## Testing Overlap Validation

### Test Case 1: Sibling Folders (Should Pass)
```javascript
Existing: [
  { name: "Main", folder: "/sitecore/media library/Images/Main" }
]
New: "/sitecore/media library/Images/Products"
Expected: ✅ PASS
```

### Test Case 2: Child Folder (Should Fail)
```javascript
Existing: [
  { name: "Main", folder: "/sitecore/media library/Images/Main" }
]
New: "/sitecore/media library/Images/Main/Products"
Expected: ❌ FAIL - "Folder cannot be inside existing library"
```

### Test Case 3: Parent Folder (Should Fail)
```javascript
Existing: [
  { name: "Main", folder: "/sitecore/media library/Images/Main" }
]
New: "/sitecore/media library/Images"
Expected: ❌ FAIL - "Folder cannot be a parent of existing library"
```

### Test Case 4: Editing Current Library (Should Pass)
```javascript
Existing: [
  { name: "Main", key: "ABC", folder: "/sitecore/media library/Images/Main" }
]
Editing: { key: "ABC", folder: "/sitecore/media library/Images/Main" }
Expected: ✅ PASS - Same library, not overlap
```

## Troubleshooting

### Issue: Getting overlap error when folders seem different

**Problem:**
```
Existing: /sitecore/media library/Images/Main
New:      /sitecore/media library/Images/Main Library
Error:    "Folder is inside existing library"
```

**Cause:** Path normalization makes paths case-insensitive.

**Solution:** Use clearly different names:
```
New: /sitecore/media library/Images/MainLibrary
or
New: /sitecore/media library/Images/Library-Main
```

### Issue: Want to reorganize existing libraries

**Problem:** Need to move libraries but folders overlap during transition.

**Solution:**
1. Create new libraries with new folder structure
2. Move content in Sitecore
3. Update library folders
4. Delete old libraries

### Issue: Need hierarchical organization

**Problem:** Want to group related libraries hierarchically.

**Solution:** Use naming conventions instead of nested folders:
```
❌ Bad (nested):
  - /sitecore/media library/Products/
  - /sitecore/media library/Products/Electronics/
  - /sitecore/media library/Products/Clothing/

✅ Good (flat with naming):
  - /sitecore/media library/Products-Main/
  - /sitecore/media library/Products-Electronics/
  - /sitecore/media library/Products-Clothing/
```

## Benefits

✅ **Data Isolation** - Each library's content is completely separate  
✅ **No Conflicts** - Cannot accidentally include another library's images  
✅ **Clear Organization** - Folder structure is flat and easy to understand  
✅ **Easy Migration** - Libraries can be moved independently  
✅ **Better Performance** - No need to traverse nested structures  

## Summary

The folder overlap validation ensures:
1. Each library has its own isolated folder
2. No library contains another library
3. No library is contained within another library
4. Clear error messages guide users to correct structure
5. Validation happens both client-side and server-side

This creates a clean, maintainable folder structure for library organization.

