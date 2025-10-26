-- Migration: Remove preview_host, client_id, and client_secret from libraries table
-- Date: 2025-10-26
-- Description: Removes fields that will be moved to the settings table

-- Remove the columns from libraries table
ALTER TABLE public.libraries
DROP COLUMN IF EXISTS preview_host,
DROP COLUMN IF EXISTS client_id,
DROP COLUMN IF EXISTS client_secret;

