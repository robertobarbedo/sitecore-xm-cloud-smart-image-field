-- Migration: Add marketplace_app_tenant_id to libraries table
-- This migration adds marketplace_app_tenant_id as part of the composite primary key

-- Drop the existing primary key constraint
ALTER TABLE public.libraries DROP CONSTRAINT IF EXISTS libraries_pkey;

-- Add the new column
ALTER TABLE public.libraries 
ADD COLUMN IF NOT EXISTS marketplace_app_tenant_id TEXT NOT NULL DEFAULT 'migration-pending';

-- Update existing rows if any (you should update these with the correct values)
-- UPDATE public.libraries 
-- SET marketplace_app_tenant_id = 'your-tenant-id'
-- WHERE marketplace_app_tenant_id = 'migration-pending';

-- Create new composite primary key
ALTER TABLE public.libraries 
ADD PRIMARY KEY (organization_id, marketplace_app_tenant_id, key);

-- Update index for filtering archived libraries
DROP INDEX IF EXISTS idx_libraries_archived;
CREATE INDEX idx_libraries_archived 
ON public.libraries(organization_id, marketplace_app_tenant_id, archived);

-- Add index for marketplace app tenant
CREATE INDEX IF NOT EXISTS idx_libraries_tenant 
ON public.libraries(organization_id, marketplace_app_tenant_id);

-- Add comment
COMMENT ON COLUMN public.libraries.marketplace_app_tenant_id IS 'Marketplace App Tenant ID from query string';

