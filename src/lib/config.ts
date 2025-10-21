// lib/config.ts

import { supabase } from './supabase-client';

//baseFolder is the path where we will store the images, it will appended with year, month, day, hour and random suffix
//previewHost is the host of the preview environment, when appended with the image path, it will be the full URL of the image
//clientId and clientSecret are OAuth2 credentials for Sitecore authentication
export interface Config {
  baseFolder: string;
  previewHost: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Gets configuration settings for the smart image field from the libraries table
 * @param organizationId - The organization identifier
 * @param key - The library key
 * @returns Configuration object with baseFolder path and previewHost
 * @throws Error if library not found or if there's a database error
 */
export async function getConfig(organizationId: string, key: string): Promise<Config> {
  if (!organizationId || !key) {
    throw new Error('organizationId and key are required');
  }

  try {
    const { data, error } = await supabase
      .from('libraries')
      .select('folder, preview_host, client_id, client_secret')
      .eq('organization_id', organizationId)
      .eq('key', key)
      .eq('archived', false)
      .single();

    if (error) {
      console.error('Error fetching library config:', error);
      throw new Error(`Failed to fetch library configuration: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Library not found for organizationId: ${organizationId}, key: ${key}`);
    }

    return {
      baseFolder: data.folder,
      previewHost: data.preview_host,
      clientId: data.client_id,
      clientSecret: data.client_secret,
    };
  } catch (error) {
    console.error('Error in getConfig:', error);
    throw error;
  }
}