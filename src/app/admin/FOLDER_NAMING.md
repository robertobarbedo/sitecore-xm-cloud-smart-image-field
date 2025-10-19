# Library Folder Naming Convention

## Overview

Library folders in Sitecore are named using the library's **Key** (GUID), not the library name.

## Structure

### Current Implementation (✅ Correct)
```
/sitecore/system/Modules/SmartImageField/
  ├── 0A92FEEE0E154E81B0442AD901B88DDD/  ← Key as folder name
  │   └── Data
  ├── 1B83AFFD1F265F92C1553BE012C99CEE/  ← Key as folder name
  │   └── Data
  └── 2C94B00E2037608AD2664CF123D0ADFF/  ← Key as folder name
      └── Data
```

### Previous Implementation (❌ Old)
```
/sitecore/system/Modules/SmartImageField/
  ├── Main Library/  ← Library name as folder name (OLD)
  │   └── Data
  ├── Product Images/  ← Library name as folder name (OLD)
  │   └── Data
  └── Marketing Assets/  ← Library name as folder name (OLD)
      └── Data
```

## Why Use Keys as Folder Names?

### ✅ Advantages

1. **Guaranteed Uniqueness**
   - GUIDs are globally unique
   - No risk of duplicate folder names
   - No conflicts even if multiple libraries have the same display name

2. **Special Character Safety**
   - Keys contain only alphanumeric characters
   - No issues with spaces, slashes, or special characters in library names
   - Prevents Sitecore item naming conflicts

3. **Rename Safety**
   - Library name can be changed without moving the folder
   - Folder structure remains stable
   - No broken references after renames

4. **Race Condition Protection**
   - Combined with 2-second delays
   - GUID-based names reduce collision chances
   - Easier to detect and handle duplicate creation attempts

5. **API Consistency**
   - Consistent with REST/API best practices
   - Key-based URLs are standard in modern APIs
   - Easy to reference in integrations

## Examples

### Example 1: Main Library
```
Library Name: "Main Library"
Library Key:  "0A92FEEE0E154E81B0442AD901B88DDD"

Sitecore Path:
/sitecore/system/Modules/SmartImageField/0A92FEEE0E154E81B0442AD901B88DDD/Data

Data Content:
0A92FEEE0E154E81B0442AD901B88DDD|Main Library|/sitecore/media library/Images/Main Library|https://xmc-tenant.sitecorecloud.io/
```

### Example 2: Product Images Library
```
Library Name: "Product Images"
Library Key:  "1B83AFFD1F265F92C1553BE012C99CEE"

Sitecore Path:
/sitecore/system/Modules/SmartImageField/1B83AFFD1F265F92C1553BE012C99CEE/Data

Data Content:
1B83AFFD1F265F92C1553BE012C99CEE|Product Images|/sitecore/media library/Images/Products|https://xmc-tenant.sitecorecloud.io/
```

### Example 3: Library with Special Characters
```
Library Name: "Client/Vendor Images & Assets"
Library Key:  "2C94B00E2037608AD2664CF123D0ADFF"

Sitecore Path:
/sitecore/system/Modules/SmartImageField/2C94B00E2037608AD2664CF123D0ADFF/Data

Data Content:
2C94B00E2037608AD2664CF123D0ADFF|Client/Vendor Images & Assets|/sitecore/media library/Images/ClientVendor|https://xmc-tenant.sitecorecloud.io/
```

**Note:** The special characters in "Client/Vendor Images & Assets" would cause issues in folder names, but the key-based approach handles this perfectly.

## Implementation Details

### GraphQL Mutation
```graphql
mutation {
  createItem(
    input: {
      name: "0A92FEEE0E154E81B0442AD901B88DDD"  # Key, not library name
      templateId: "{A87A00B1-E6DB-45AB-8B54-636FEC3B5523}"
      parent: "{PARENT_FOLDER_ID}"
      language: "en"
    }
  ) {
    item {
      itemId
    }
  }
}
```

### Code Implementation
```typescript
// Create the library folder using the key as the folder name
const folderMutation = {
  query: `
    mutation {
      createItem(
        input: {
          name: "${library.key}"  // ← Uses key, not library.name
          templateId: "${FOLDER_TEMPLATE_ID}"
          parent: "${parentFolderId}"
          language: "en"
        }
      ) {
        item {
          itemId
        }
      }
    }
  `
};
```

## Lookup Strategy

When loading libraries, the system:

1. Queries all folders under `/sitecore/system/Modules/SmartImageField/`
2. Each folder name is the library Key
3. Reads the `Data` item inside each folder
4. Parses the pipe-separated values to get library details

```typescript
// Folder structure example:
// /SmartImageField/0A92FEEE0E154E81B0442AD901B88DDD/Data

// Data content:
// "0A92FEEE0E154E81B0442AD901B88DDD|Main Library|/sitecore/media library/Images/Main Library|https://..."

// Parsed library:
{
  key: "0A92FEEE0E154E81B0442AD901B88DDD",  // From folder name AND data
  name: "Main Library",                       // From data
  folder: "/sitecore/media library/Images/Main Library",  // From data
  previewHost: "https://...",                 // From data
  sitecoreItemId: "{FOLDER_ITEM_ID}",
  sitecoreDataItemId: "{DATA_ITEM_ID}"
}
```

## Migration Notes

### If Migrating from Old Structure

If you have existing libraries using the old naming convention (library name as folder name):

1. **Option A: Manual Migration**
   - Delete old libraries from Sitecore
   - Recreate them in the admin interface
   - New structure will be used automatically

2. **Option B: Leave Legacy Data**
   - Old structure will still work for reading
   - New libraries will use key-based naming
   - System will handle mixed naming conventions

3. **Option C: Write Migration Script**
   - Query all existing libraries
   - For each library:
     - Read the Data item
     - Parse the key
     - Create new folder with key as name
     - Copy Data item
     - Delete old folder

## Best Practices

1. **Always Use Generated Keys**
   - Let the system generate GUIDs
   - Never manually create or modify keys

2. **Don't Assume Folder Name = Library Name**
   - Always read the Data item to get library name
   - Use key for lookups, not name

3. **Consistent Reference**
   - Reference libraries by their key
   - Key is the stable identifier
   - Name is just display text

4. **Documentation**
   - Include key in logs and error messages
   - Makes debugging easier
   - Unique identifier for support

## Console Output Example

```
⏳ Creating library: Product Images (Key: 1B83AFFD1F265F92C1553BE012C99CEE)...
🔍 Ensuring SmartImageField folder exists...
⏳ Checking SmartImageField folder...
✅ SmartImageField folder found: {guid}
⏳ Creating library folder with name: 1B83AFFD1F265F92C1553BE012C99CEE...
✅ Library folder created: {guid} (1B83AFFD1F265F92C1553BE012C99CEE)
⏳ Creating library data item...
✅ Library data item created: {guid}
✅ Library "Product Images" created successfully
```

Notice the folder is created with the **key** (`1B83AFFD1F265F92C1553BE012C99CEE`), but the logs also show the human-readable **name** ("Product Images") for clarity.

## Summary

| Aspect | Old Approach | New Approach |
|--------|--------------|--------------|
| **Folder Name** | Library name | Library key (GUID) |
| **Uniqueness** | Not guaranteed | Guaranteed |
| **Special Characters** | Problematic | No issues |
| **Rename Impact** | Must move folder | No impact |
| **API Consistency** | Poor | Excellent |
| **Race Conditions** | Higher risk | Lower risk |

The key-based naming convention provides a more robust, scalable, and maintainable solution for library storage in Sitecore.

