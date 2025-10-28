-- Migration: Remove marketplace_app_tenant_id from libraries and settings tables
-- Date: 2025-10-26
-- Description: Simplifies the schema by removing marketplace_app_tenant_id column and updating primary keys

-- ====================================
-- 1. Update libraries table
-- ====================================

-- Drop the existing primary key constraint
ALTER TABLE public.libraries DROP CONSTRAINT IF EXISTS libraries_pkey;

-- Drop the marketplace_app_tenant_id column
ALTER TABLE public.libraries DROP COLUMN IF EXISTS marketplace_app_tenant_id;

-- Recreate primary key with only organization_id and key
ALTER TABLE public.libraries ADD PRIMARY KEY (organization_id, key);

-- Drop old index that included marketplace_app_tenant_id
DROP INDEX IF EXISTS idx_libraries_tenant;
DROP INDEX IF EXISTS idx_libraries_archived;

-- Recreate archived index without marketplace_app_tenant_id
CREATE INDEX IF NOT EXISTS idx_libraries_archived 
ON public.libraries(organization_id, archived);

-- ====================================
-- 2. Update settings table
-- ====================================

-- Drop the existing primary key constraint
ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS settings_pkey;

-- Drop the marketplace_app_tenant_id column
ALTER TABLE public.settings DROP COLUMN IF EXISTS marketplace_app_tenant_id;

-- Recreate primary key with only organization_id
ALTER TABLE public.settings ADD PRIMARY KEY (organization_id);

