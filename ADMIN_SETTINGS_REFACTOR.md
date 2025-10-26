# Admin Settings Refactor

## Summary

Refactored the Admin area to separate library-specific fields from general application settings.

## Date
October 26, 2025

## Changes Made

### Database Changes

#### 1. Removed Fields from `libraries` Table
- Removed: `preview_host`, `client_id`, `client_secret`
- Migration: `008_remove_fields_from_libraries.sql`

#### 2. Created New `settings` Table
- Fields:
  - `organization_id` (PRIMARY KEY)
  - `marketplace_app_tenant_id` (PRIMARY KEY)
  - `preview_host` (required)
  - `client_id` (optional)
  - `client_secret` (optional)
  - `created_at`
  - `updated_at`
- Migration: `009_create_settings_table.sql`

### Type Definitions

#### Updated `Library` Interface
Removed fields:
- `previewHost`
- `client_id`
- `client_secret`

The `Library` interface now only contains:
- `key`
- `name`
- `folder`
- `sitecoreItemId` (optional)
- `sitecoreDataItemId` (optional)

#### New `Settings` Interface
Created new interface with:
- `preview_host`
- `client_id` (optional)
- `client_secret` (optional)

### New Files Created

1. **`src/app/admin/lib/supabase-settings.ts`**
   - Functions for managing settings in Supabase
   - `getSettings()` - Load settings for organization/tenant
   - `hasSettings()` - Check if settings exist
   - `saveSettings()` - Create or update settings (upsert)

2. **`src/app/admin/components/Settings.tsx`**
   - Settings management component
   - Form for Preview Host, Client ID, and Client Secret
   - Success/error messaging
   - Link to Sitecore credentials creation page

3. **`database/migrations/008_remove_fields_from_libraries.sql`**
   - SQL migration to remove fields from libraries table

4. **`database/migrations/009_create_settings_table.sql`**
   - SQL migration to create settings table with proper indexes and RLS policies

### Updated Files

1. **`src/app/admin/types/library.ts`**
   - Removed credential fields from Library interface
   - Added new Settings interface

2. **`src/app/admin/lib/supabase-admin.ts`**
   - Updated LibraryRow type to remove credential fields
   - Updated createLibrary() to not include credentials
   - Updated updateLibrary() to not include credentials
   - Fixed type assertions for Supabase operations

3. **`src/app/admin/components/LibraryForm.tsx`**
   - Removed Preview Host field
   - Removed Client ID and Client Secret fields
   - Removed environment credentials section
   - Simplified form to only show Key, Name, and Folder
   - Updated help text to mention Settings button

4. **`src/app/admin/components/LibraryManager.tsx`**
   - Added 'settings' to ViewMode type
   - Added Settings button with cog icon in header
   - Imported and integrated SettingsComponent
   - Removed previewHost from library initialization
   - Updated styling for Settings button

5. **`src/app/admin/components/LibraryList.tsx`**
   - Removed Preview Host column from table
   - Updated table layout to show only Name, Folder, Key, and Actions

6. **`src/app/admin/lib/sitecore-operations.ts`** (Legacy file)
   - Updated to remove previewHost from data format
   - Changed pipe-delimited format from 4 fields to 3 fields
   - Added backward compatibility for reading old format

## User Experience Changes

### Library Management
- Library form now only shows:
  - Key (auto-generated, read-only)
  - Name
  - Folder
- Simplified interface focused on library-specific data

### Settings Management
- New Settings button in top right corner with cog icon
- Settings form includes:
  - Preview Host (required)
  - Client ID (optional)
  - Client Secret (optional)
- Settings are shared across all libraries in the organization
- Link to create Sitecore automation credentials
- Success/error feedback
- Back button to return to library list

## Migration Path

1. Database migrations applied via Supabase MCP server
2. Existing library data remains intact (only schema changes)
3. Users will need to configure settings after upgrade:
   - Click Settings button
   - Enter Preview Host (previously in each library)
   - Optionally enter Client ID and Client Secret (previously in each library)

## Benefits

1. **Single Source of Truth**: Preview Host and credentials are now stored once per organization instead of per library
2. **Simplified Library Management**: Library form is cleaner and focused on library-specific data
3. **Better Organization**: Clear separation between library configuration and application settings
4. **Easier Maintenance**: Credentials can be updated in one place
5. **Consistent Experience**: All libraries use the same preview host and credentials

## Technical Notes

- Settings use upsert operation (insert or update)
- One settings record per organization_id + marketplace_app_tenant_id combination
- Row Level Security (RLS) enabled on settings table
- Proper indexes added for performance
- Type-safe operations with TypeScript
- Backward compatibility maintained in legacy sitecore-operations.ts

## Testing Recommendations

1. Test first-time setup flow (no libraries exist)
2. Test settings creation and update
3. Test library creation with settings configured
4. Test library editing
5. Verify Settings button visibility and navigation
6. Test validation for Preview Host format
7. Test credentials link opens correctly

