# Admin Quick Start Guide

## Accessing the Admin Interface

The admin interface runs in an iframe within the Sitecore XM Cloud Marketplace. 

**Parent Window URL (browser):**
```
https://xmapps.sitecorecloud.io/mkp-app/76ad59ee-756a-482f-a959-4233882a02a9?organization=org_lxSEYVnF3YpVUlEQ&tenantName=canadianlif38a5-clhiaa22e-dev232a
```

**Iframe URL (this app):**
```
http://localhost:3000/admin?organizationId=org_lxSEYVnF3YpVUlEQ&marketplaceAppTenantId=110d2bb3-9a54-4eb2-0caf-08de06908b4e
```

⚠️ **Important:** The `tenantName` parameter is in the **parent window's URL**, not the iframe URL.

## Library Management Overview

### What is a Library?

A library defines:
- **Where** images are stored in Sitecore (media library folder)
- **How** images are accessed (preview host URL)
- **Organization** for different image collections

### Main Library

The "Main Library" is automatically created on first load and:
- ✅ Always exists (cannot be deleted)
- 🔒 Name is locked to "Main Library"
- ⚙️ Default folder: `/sitecore/media library/Images/Main Library`
- 🌐 Preview Host: Auto-detected from your tenant

## Creating a New Library

1. Click **"+ Create New Library"** button
2. Fill in the form:
   - **Name**: Give it a descriptive name (e.g., "Product Images")
   - **Folder**: Sitecore media library path (e.g., `/sitecore/media library/Images/Products`)
   - **Preview Host**: Pre-filled from URL, or customize (must end with `.sitecorecloud.io`)
3. Click **"Save"**
4. Library appears in the list

### Example Libraries

```
Name: Product Images
Folder: /sitecore/media library/Images/Products
Preview Host: https://xmc-yoursite.sitecorecloud.io/

Name: Marketing Assets
Folder: /sitecore/media library/Images/Marketing
Preview Host: https://xmc-yoursite.sitecorecloud.io/

Name: Team Photos
Folder: /sitecore/media library/Images/Team
Preview Host: https://xmc-yoursite.sitecorecloud.io/
```

## Editing a Library

1. Click **"Edit"** button on the library row
2. Modify the editable fields:
   - ✏️ Name (locked for Main Library)
   - ✏️ Folder path
   - ✏️ Preview Host
3. Click **"Save"** to apply changes
4. Click **"Cancel"** to discard changes

## Deleting a Library

1. Click **"Delete"** button (only visible for non-Main libraries)
2. Confirm deletion in the dialog
3. Library is permanently removed from Sitecore

⚠️ **Warning**: Deleting a library does not delete the actual images in Sitecore, only the library configuration.

## Field Reference

| Field | Type | Required | Example |
|-------|------|----------|---------|
| **Key** | Read-only | Auto-generated | `0A92FEEE0E154E81B0442AD901B88DDD` |
| **Name** | Text | ✅ Yes | `Main Library` |
| **Folder** | Text | ✅ Yes | `/sitecore/media library/Images/Main Library` |
| **Preview Host** | URL | ✅ Yes | `https://xmc-tenant.sitecorecloud.io/` |

## Validation Rules

### Name
- Cannot be empty
- Main Library name cannot be changed

### Folder
- Cannot be empty
- Should be a valid Sitecore media library path
- Typically starts with `/sitecore/media library/`

### Preview Host
- Cannot be empty
- Must start with `https://`
- Must end with `.sitecorecloud.io` or `.sitecorecloud.io/`
- Trailing slash is automatically added if missing

### Valid Preview Host Examples
✅ `https://xmc-mysite.sitecorecloud.io/`  
✅ `https://xmc-mysite.sitecorecloud.io`  
❌ `http://xmc-mysite.sitecorecloud.io/` (must be HTTPS)  
❌ `https://mysite.com/` (must end with .sitecorecloud.io)  

## Technical Details

### Where Libraries Are Stored

Libraries are stored in Sitecore at:
```
/sitecore/system/Modules/SmartImageField/
  ├── 0A92FEEE0E154E81B0442AD901B88DDD/  (Main Library)
  │   └── Data
  ├── 1B83AFFD1F265F92C1553BE012C99CEE/  (Your Library 1)
  │   └── Data
  └── 2C94B00E2037608AD2664CF123D0ADFF/  (Your Library 2)
      └── Data
```

**Important:** Folder names are the library **Keys** (GUIDs), not the library names. This ensures unique identifiers and prevents naming conflicts.

Each "Data" item contains pipe-separated values:
```
Key|Name|Folder|PreviewHost
```

### Auto-Detection of Preview Host

The preview host is automatically derived from the `tenantName` query parameter in the **parent window's URL**:

1. System reads `tenantName` from parent window: `canadianlif38a5-clhiaa22e-dev232a`
2. Prefix with `xmc-`: `xmc-canadianlif38a5-clhiaa22e-dev232a`
3. Add domain: `https://xmc-canadianlif38a5-clhiaa22e-dev232a.sitecorecloud.io/`

**Parent Window URL Structure:**
```
https://xmapps.sitecorecloud.io/mkp-app/{APP_ID}?organization={ORG}&tenantName={TENANT}
```

**Iframe URL Structure:**
```
http://localhost:3000/admin?organizationId={ORG}&marketplaceAppTenantId={TENANT_ID}
```

## Troubleshooting

### "Failed to load libraries"
- Check your Sitecore connection
- Verify GraphQL endpoint is accessible
- Check browser console for detailed errors

### "Cannot create SmartImageField folder"
- Verify you have permissions in Sitecore
- Check that `/sitecore/system/Modules` exists
- Ensure GraphQL mutations are enabled

### "Invalid Preview Host"
- Ensure URL starts with `https://`
- Ensure URL ends with `.sitecorecloud.io`
- Check for typos in the URL

### Preview Host Not Auto-Detected
- Check that `tenantName` is in the URL query parameters
- Manually enter the preview host if needed
- Format: `https://xmc-{your-tenant}.sitecorecloud.io/`

## Best Practices

1. **Organize by Purpose**: Create separate libraries for different types of images
   - Products
   - Marketing materials
   - Team photos
   - Blog images

2. **Use Clear Names**: Make library names descriptive and easy to understand

3. **Follow Path Conventions**: Keep folder paths organized and consistent
   ```
   /sitecore/media library/Images/{Library Name}/
   ```

4. **Don't Delete Main Library**: It serves as the default and fallback library

5. **Test Preview Host**: Verify the preview host URL is correct before saving

## Support

For issues or questions:
- Check the detailed README in `src/app/admin/README.md`
- Review code documentation in the source files
- Check browser console for error messages
- Verify Sitecore GraphQL endpoint is working

## Next Steps

After setting up libraries:
1. Configure image upload destinations
2. Organize existing images into library folders
3. Train users on which library to use for different content types
4. Monitor library usage and adjust as needed

