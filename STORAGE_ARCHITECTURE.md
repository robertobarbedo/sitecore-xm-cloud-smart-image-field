# Storage Architecture

The Smart Image Field supports two storage backends for libraries and settings configuration:

## Storage Types

### 1. Supabase Storage (Default)
Stores configuration data in Supabase PostgreSQL database.

**Tables:**
- `settings` - Preview host and OAuth2 credentials
- `libraries` - Library configurations (name, folder path, key)
- `image_metadata` - Image metadata for search (always uses Supabase)

**Configuration:**
```env
NEXT_PUBLIC_STORAGE_TYPE=SUPABASE
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Sitecore Storage
Stores configuration data directly in Sitecore items under `/sitecore/system/Modules`.

**Sitecore Structure:**
```
/sitecore/system/Modules/
  └── Smart/
      └── SmartImageField/
          ├── PreviewHost (Setting)
          ├── Credentials (Setting)
          └── Libraries/
              ├── Main Library (Library)
              └── ... (other libraries)
```

**Template IDs:**
- Folder: `{A87A00B1-E6DB-45AB-8B54-636FEC3B5523}`
- Setting: `{D2923FEE-DA4E-49BE-830C-E27764DFA269}`
- Libraries Folder: `{0A92FEEE-0E15-4E81-B044-2AD901B88DDD}`

**Value Formats:**
- PreviewHost: `https://xmc-yourtenantname.sitecorecloud.io/`
- Credentials: `ClientID:ClientSecret`
- Library: `Key:Name:Folder`

**Configuration:**
```env
NEXT_PUBLIC_STORAGE_TYPE=SITECORE
```

**Note:** Sitecore storage requires ClientSDK context to create/update items via GraphQL.

## Important Notes

1. **Image Metadata Table:** The `image_metadata` table always uses Supabase storage regardless of `STORAGE_TYPE`. This table stores search metadata for images.

2. **Migration:** When switching storage types, you need to manually migrate your configuration data from one storage to another.

3. **Permissions:**
   - Supabase: Requires proper RLS policies
   - Sitecore: Requires write access to `/sitecore/system/Modules`

## Storage Interface

Both storage implementations follow the same interface:

### Settings Storage
```typescript
interface ISettingsStorage {
  getSettings(organizationId: string): Promise<Settings | null>;
  hasSettings(organizationId: string): Promise<boolean>;
  saveSettings(organizationId: string, settings: Settings): Promise<Settings>;
}
```

### Libraries Storage
```typescript
interface ILibrariesStorage {
  getLibraries(organizationId: string): Promise<Library[]>;
  getLibrary(organizationId: string, key: string): Promise<Library | null>;
  hasAnyLibraries(organizationId: string): Promise<boolean>;
  saveLibrary(organizationId: string, library: Library): Promise<Library>;
  archiveLibrary(organizationId: string, library: Library): Promise<void>;
}
```

## File Structure

```
src/lib/storage/
├── types.ts                          # Storage interfaces
├── factory.ts                        # Factory for creating storage instances
├── supabase-settings-storage.ts     # Supabase implementation for settings
├── supabase-libraries-storage.ts    # Supabase implementation for libraries
├── sitecore-settings-storage.ts     # Sitecore implementation for settings
├── sitecore-libraries-storage.ts    # Sitecore implementation for libraries
└── index.ts                         # Exports
```

## Usage Example

```typescript
import { createSettingsStorage, createLibrariesStorage } from '@/src/lib/storage';

// Storage type is automatically determined from NEXT_PUBLIC_STORAGE_TYPE
const settingsStorage = createSettingsStorage(client); // client optional for Supabase
const librariesStorage = createLibrariesStorage(client);

// Use the same interface regardless of storage type
const settings = await settingsStorage.getSettings(organizationId);
const libraries = await librariesStorage.getLibraries(organizationId);
```
