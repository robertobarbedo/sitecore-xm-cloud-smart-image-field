-- Migration: Add environment credentials columns to libraries table
-- Date: 2025-10-21
-- Description: Adds columns to store Sitecore Cloud environment Client ID and Client Secret
--              for automation credentials that enable advanced features like automated image processing.

-- Add environment credentials columns to libraries table
ALTER TABLE public.libraries
ADD COLUMN client_id VARCHAR(255),
ADD COLUMN client_secret TEXT;

-- Add comments to the columns
COMMENT ON COLUMN public.libraries.client_id IS 'Sitecore Cloud environment Client ID for automation credentials';
COMMENT ON COLUMN public.libraries.client_secret IS 'Sitecore Cloud environment Client Secret for automation credentials (should be encrypted in production)';

-- Note: In production, consider encrypting the client_secret column using pgcrypto or application-level encryption

