-- Migration: Create settings table for admin general settings
-- Date: 2025-10-26
-- Description: This table stores general settings per organization and marketplace app tenant

-- Create the settings table
CREATE TABLE IF NOT EXISTS public.settings (
  organization_id TEXT NOT NULL,
  marketplace_app_tenant_id TEXT NOT NULL,
  preview_host TEXT NOT NULL,
  client_id VARCHAR(255),
  client_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Composite primary key
  PRIMARY KEY (organization_id, marketplace_app_tenant_id)
);

-- Add index on organization_id for faster queries
CREATE INDEX IF NOT EXISTS idx_settings_organization_id 
ON public.settings(organization_id);

-- Enable Row Level Security
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users" 
ON public.settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow all operations for anon users (for development)
CREATE POLICY "Enable all operations for anon users" 
ON public.settings
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.settings IS 'Stores general settings for the admin interface, organized by organization';

-- Add comments to columns
COMMENT ON COLUMN public.settings.organization_id IS 'Organization identifier from query string';
COMMENT ON COLUMN public.settings.marketplace_app_tenant_id IS 'Marketplace App Tenant ID from query string';
COMMENT ON COLUMN public.settings.preview_host IS 'Preview host URL for images';
COMMENT ON COLUMN public.settings.client_id IS 'Sitecore Cloud environment Client ID for automation credentials';
COMMENT ON COLUMN public.settings.client_secret IS 'Sitecore Cloud environment Client Secret for automation credentials (should be encrypted in production)';

