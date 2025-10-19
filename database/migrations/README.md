# Database Migrations

This directory contains SQL migration files for the Supabase database.

## Migrations

### 001_create_image_metadata_table.sql
Creates the `image_metadata` table for storing image metadata for search functionality.

### 002_create_libraries_table.sql
Creates the `libraries` table for storing library configurations in the admin interface.

## Applying Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the migration SQL
5. Click **Run** to execute

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Apply migration 002
supabase db push
```

Or manually:

```bash
psql -h db.your-project.supabase.co -U postgres -d postgres < database/migrations/002_create_libraries_table.sql
```

## Migration 002: Libraries Table

**Purpose:** Store library configurations for the admin interface, organized by organization.

**Schema:**
```sql
CREATE TABLE libraries (
  organization_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  folder TEXT NOT NULL,
  preview_host TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, key)
);
```

**Features:**
- Composite primary key on `(organization_id, key)` for multi-tenant support
- Indexes on `organization_id` and `(organization_id, name)` for fast queries
- Row Level Security (RLS) enabled with policies for authenticated and anon users
- Automatic `updated_at` timestamp trigger

**Security Note:** In production, remove the anon policy and implement proper authentication:

```sql
-- Remove this policy in production:
DROP POLICY "Enable all operations for anon users" ON public.libraries;

-- Create organization-specific policies:
CREATE POLICY "Users can manage their organization's libraries"
ON public.libraries
FOR ALL
TO authenticated
USING (organization_id = auth.jwt()->>'organization_id')
WITH CHECK (organization_id = auth.jwt()->>'organization_id');
```

## Verifying the Migration

After applying the migration, verify it was successful:

```sql
-- Check if the table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'libraries';

-- Check the table structure
\d libraries

-- Test inserting a record
INSERT INTO libraries (organization_id, key, name, folder, preview_host)
VALUES ('test_org', 'TEST123', 'Test Library', '/test', 'https://test.com/');

-- Verify the record
SELECT * FROM libraries WHERE organization_id = 'test_org';

-- Clean up test data
DELETE FROM libraries WHERE organization_id = 'test_org';
```

## Rollback

If you need to rollback the migration:

```sql
-- Drop the table and related objects
DROP TRIGGER IF EXISTS update_libraries_updated_at ON public.libraries;
DROP TABLE IF EXISTS public.libraries CASCADE;
```

## Notes

- The `organization_id` field stores the organization identifier from the URL query string
- The `key` field is a GUID without dashes (e.g., `0A92FEEE0E154E81B0442AD901B88DDD`)
- The `preview_host` field must end with `.sitecorecloud.io/`
- The table supports multiple organizations with isolated data

