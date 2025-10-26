# Admin Library Management

This admin interface allows users to create and manage "Libraries" for the Sitecore XM Cloud Smart Image Field application.

## Overview

Libraries are organizational units that define where images are stored and how they should be accessed. Each library configuration is stored in Sitecore under `/sitecore/system/Modules/SmartImageField`.

## Library Structure

Each library has the following fields:

### Key
- **Type**: Read-only
- **Format**: GUID without dashes or curly braces (e.g., `0A92FEEE0E154E81B0442AD901B88DDD`)
- **Description**: Auto-assigned unique identifier for the library

### Name
- **Type**: Read/Write (locked for Main Library)
- **Default**: "Main Library"
- **Description**: Display name of the library
- **Validation**: Required field

### Folder
- **Type**: Read/Write
- **Default**: "/sitecore/media library/Images/Main Library"
- **Description**: Path to the Sitecore media library folder where images are stored
- **Validation**: Required field

### Preview Host
- **Type**: Read/Write
- **Default**: Derived from URL query parameters
- **Format**: `https://xmc-{tenantName}.sitecorecloud.io/`
- **Description**: Base URL for image preview and access
- **Validation**: 
  - Must start with `https://`
  - Must end with `.sitecorecloud.io` or `.sitecorecloud.io/`
  - Trailing slash is automatically added if missing

## URL Parameter Parsing

The Preview Host default value is automatically derived from URL parameters across the iframe boundary.

### Iframe Architecture

The admin application runs in an **iframe** within the Sitecore XM Cloud Marketplace:

**Parent Window URL (browser address bar):**
```
https://xmapps.sitecorecloud.io/mkp-app/76ad59ee-756a-482f-a959-4233882a02a9?organization=org_lxSEYVnF3YpVUlEQ&tenantName=canadianlif38a5-clhiaa22e-dev232a
```

**Iframe URL (this application):**
```
http://localhost:3000/admin?organizationId=org_lxSEYVnF3YpVUlEQ&marketplaceAppTenantId=110d2bb3-9a54-4eb2-0caf-08de06908b4e
```

### Parameter Sources

| Parameter | Source | Example |
|-----------|--------|---------|
| `organizationId` | Iframe URL | `org_lxSEYVnF3YpVUlEQ` |
| `marketplaceAppTenantId` | Iframe URL | `110d2bb3-9a54-4eb2-0caf-08de06908b4e` |
| `tenantName` | **Parent Window URL** | `canadianlif38a5-clhiaa22e-dev232a` |

### Preview Host Derivation

The system automatically:
1. Reads `tenantName` from the **parent window's** query parameters
2. Prefixes it with `xmc-` if not already present
3. Appends `.sitecorecloud.io/` to create the full URL

**Example:**
- Input: `tenantName=canadianlif38a5-clhiaa22e-dev232a` (from parent window)
- Output: `https://xmc-canadianlif38a5-clhiaa22e-dev232a.sitecorecloud.io/`

## Main Library

The "Main Library" is special:
- **Always exists**: Automatically created if not found
- **Cannot be deleted**: The delete button is hidden
- **Name is locked**: The name field is read-only to ensure it remains "Main Library"

This ensures at least one library is always present with a standard name.

## Sitecore Storage

### Folder Structure
```
/sitecore/system/Modules/SmartImageField/
  ├── 0A92FEEE0E154E81B0442AD901B88DDD/  (Main Library)
  │   └── Data (Name-Value List Item)
  ├── 1B83AFFD1F265F92C1553BE012C99CEE/  (Custom Library 1)
  │   └── Data (Name-Value List Item)
  └── 2C94B00E2037608AD2664CF123D0ADFF/  (Custom Library 2)
      └── Data (Name-Value List Item)
```

**Note:** The folder name is the library's **Key** (GUID), not the library name. This ensures uniqueness and avoids issues with special characters.

### Data Format
Each library's data is stored in a "Data" item (template: `{D2923FEE-DA4E-49BE-830C-E27764DFA269}`) with pipe-separated values:

```
Key|Name|Folder|PreviewHost
```

**Example:**
```
0A92FEEE0E154E81B0442AD901B88DDD|Main Library|/sitecore/media library/Images/Main Library|https://xmc-canadianlif38a5-clhiaa22e-dev232a.sitecorecloud.io/
```

### GraphQL Operations

#### Create SmartImageField Folder
```graphql
mutation {
  createItem(
    input: {
      name: "SmartImageField"
      templateId: "{A87A00B1-E6DB-45AB-8B54-636FEC3B5523}"
      parent: "{08477468-D438-43D4-9D6A-6D84A611971C}"
      language: "en"
    }
  ) {
    item {
      itemId
    }
  }
}
```

#### List Libraries
```graphql
query {
  item(
    where: {
      database: "master",
      path: "/sitecore/system/Modules/SmartImageField"
    }
  ) {
    itemId
    children {
      nodes {
        itemId
        name
        children {
          nodes {
            itemId
            name
            ... on NameValueListItem {
              value {
                value
              }
            }
          }
        }
      }
    }
  }
}
```

## Code Organization

The admin code is organized under `src/app/admin/`:

```
src/app/admin/
├── page.tsx                      # Main admin page
├── components/
│   ├── LibraryManager.tsx        # Main orchestrator component
│   ├── LibraryList.tsx           # Library listing table
│   └── LibraryForm.tsx           # Create/edit library form
├── lib/
│   ├── sitecore-operations.ts    # GraphQL operations for Sitecore
│   └── url-parser.ts             # URL parsing and validation utilities
├── types/
│   └── library.ts                # TypeScript type definitions
└── README.md                     # This file
```

## Features

### Library Listing
- Displays all libraries in a responsive table
- Shows library details: name, folder, preview host, and key
- Highlights the Main Library with a special badge
- Provides Edit and Delete actions (Delete hidden for Main Library)

### Create New Library
- Click "+ Create New Library" button
- Auto-generates a unique key
- Pre-fills Preview Host from URL parameters
- Validates all fields before saving
- Creates both the library folder and Data item in Sitecore

### Edit Library
- Click "Edit" button on any library
- Modify editable fields (name locked for Main Library)
- Validates changes before saving
- Updates the Data item in Sitecore

### Delete Library
- Click "Delete" button (available for non-Main libraries)
- Confirmation dialog prevents accidental deletion
- Removes both the Data item and library folder from Sitecore

## Validation Rules

1. **All fields are required** - Name, Folder, and Preview Host must have values
2. **Preview Host format** - Must be a valid HTTPS URL ending with `.sitecorecloud.io`
3. **Main Library protection** - Name cannot be changed, library cannot be deleted
4. **Automatic normalization** - Preview Host automatically gets trailing slash if missing

## Error Handling

The system handles various error scenarios:
- Failed Sitecore GraphQL queries
- Missing SmartImageField folder (auto-creates)
- Missing Main Library (auto-creates)
- Network errors
- Validation errors

All errors are displayed in user-friendly error messages with clear instructions.

## Usage Flow

1. **First Load**
   - System checks if SmartImageField folder exists
   - Creates folder if missing
   - Checks if Main Library exists
   - Creates Main Library if missing
   - Displays library list

2. **Create Library**
   - User clicks "+ Create New Library"
   - Form opens with pre-filled defaults
   - User enters name and folder path
   - System validates and saves to Sitecore
   - Returns to library list

3. **Edit Library**
   - User clicks "Edit" on a library
   - Form opens with existing values
   - User modifies editable fields
   - System validates and updates Sitecore
   - Returns to library list

4. **Delete Library**
   - User clicks "Delete" on a non-Main library
   - Confirmation dialog appears
   - User confirms deletion
   - System removes from Sitecore
   - Library removed from list

## Future Enhancements

Potential improvements for future versions:
- Bulk import/export of libraries
- Library usage statistics
- Validation of folder paths in Sitecore
- Preview of images in each library
- Search and filter libraries
- Sorting options
- Pagination for large library lists

