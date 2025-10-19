-- Migration: Create libraries table for admin library management
-- This table stores library configurations per organization and marketplace app tenant

-- Create the libraries table
CREATE TABLE IF NOT EXISTS public.libraries (
  organization_id TEXT NOT NULL,
  marketplace_app_tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  folder TEXT NOT NULL,
  preview_host TEXT NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Composite primary key
  PRIMARY KEY (organization_id, marketplace_app_tenant_id, key)
);

-- Add index on organization_id for faster queries
CREATE INDEX IF NOT EXISTS idx_libraries_organization_id 
ON public.libraries(organization_id);

-- Add index on name for searching
CREATE INDEX IF NOT EXISTS idx_libraries_name 
ON public.libraries(organization_id, name);

-- Add index for filtering archived libraries
CREATE INDEX IF NOT EXISTS idx_libraries_archived 
ON public.libraries(organization_id, marketplace_app_tenant_id, archived);

-- Add index for marketplace app tenant
CREATE INDEX IF NOT EXISTS idx_libraries_tenant 
ON public.libraries(organization_id, marketplace_app_tenant_id);

-- Enable Row Level Security
ALTER TABLE public.libraries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- In a production environment, you would want more restrictive policies
CREATE POLICY "Enable all operations for authenticated users" 
ON public.libraries
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow all operations for anon users (for development)
-- Remove this in production and use proper authentication
CREATE POLICY "Enable all operations for anon users" 
ON public.libraries
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_libraries_updated_at
BEFORE UPDATE ON public.libraries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.libraries IS 'Stores library configurations for the admin interface, organized by organization';

-- Add comments to columns
COMMENT ON COLUMN public.libraries.organization_id IS 'Organization identifier from query string';
COMMENT ON COLUMN public.libraries.marketplace_app_tenant_id IS 'Marketplace App Tenant ID from query string';
COMMENT ON COLUMN public.libraries.key IS 'Unique library key (GUID without dashes)';
COMMENT ON COLUMN public.libraries.name IS 'Display name of the library';
COMMENT ON COLUMN public.libraries.folder IS 'Sitecore media library folder path';
COMMENT ON COLUMN public.libraries.preview_host IS 'Preview host URL for images';
COMMENT ON COLUMN public.libraries.archived IS 'Indicates if the library is archived (soft delete)';

