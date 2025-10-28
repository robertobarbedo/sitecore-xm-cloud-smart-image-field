// lib/config.ts

import { SitecoreLibrariesStorage } from './storage/sitecore-libraries-storage';
import { SitecoreSettingsStorage } from './storage/sitecore-settings-storage';
import { ClientSDK } from '@sitecore-marketplace-sdk/client';

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
 * Gets configuration settings for the smart image field
 * - Reads baseFolder from Sitecore libraries (identified by organizationId + key)
 * - Reads previewHost, clientId, clientSecret from Sitecore settings (identified by organizationId only)
 * @param organizationId - The organization identifier
 * @param key - The library key
 * @param client - ClientSDK instance (required)
 * @returns Configuration object with baseFolder path, previewHost, and credentials
 * @throws Error if library or settings not found, or if there's a database error
 */
export async function getConfig(organizationId: string, key: string, client: ClientSDK): Promise<Config> {
  if (!organizationId || !key) {
    throw new Error('organizationId and key are required');
  }

  if (!client) {
    throw new Error('ClientSDK is required');
  }

  console.log(`⚙️ Using Sitecore storage for configuration`);

  try {
    // Create Sitecore storage instances
    const librariesStorage = new SitecoreLibrariesStorage(client);
    const settingsStorage = new SitecoreSettingsStorage(client);

    // Fetch library configuration (baseFolder)
    console.log('⏳ Fetching library with:', { organizationId, key });
    
    const library = await librariesStorage.getLibrary(organizationId, key);

    if (!library) {
      console.error('❌ Library not found with params:', { organizationId, key });
      throw new Error(`Library not found for organizationId: ${organizationId}, key: ${key}`);
    }

    // Fetch settings (previewHost, clientId, clientSecret)
    console.log('⏳ Fetching settings with:', { organizationId });
    
    const settings = await settingsStorage.getSettings(organizationId);

    if (!settings) {
      console.error('❌ Settings not found for organizationId:', organizationId);
      throw new Error(`Settings not found for organizationId: ${organizationId}`);
    }

    console.log('✅ Configuration loaded successfully');

    return {
      baseFolder: library.folder,
      previewHost: settings.preview_host,
      clientId: settings.client_id,
      clientSecret: settings.client_secret,
    };
  } catch (error) {
    console.error('❌ Error in getConfig:', error);
    throw error;
  }
}