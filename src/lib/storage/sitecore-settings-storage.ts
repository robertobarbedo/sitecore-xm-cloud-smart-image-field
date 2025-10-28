// Sitecore implementation of Settings storage using ClientSDK and GraphQL

import { Settings } from '@/src/app/admin/types/library';
import { ISettingsStorage } from './types';
import { ClientSDK, ApplicationContext } from '@sitecore-marketplace-sdk/client';

/**
 * Sitecore paths for settings items
 */
const SITECORE_PATHS = {
  MODULES: '/sitecore/system/Modules',
  SMART: '/sitecore/system/Modules/Smart',
  SMART_IMAGE_FIELD: '/sitecore/system/Modules/Smart/SmartImageField',
  PREVIEW_HOST: '/sitecore/system/Modules/Smart/SmartImageField/PreviewHost',
  CREDENTIALS: '/sitecore/system/Modules/Smart/SmartImageField/Credentials',
  LIBRARIES_FOLDER: '/sitecore/system/Modules/Smart/SmartImageField/Libraries',
};

/**
 * Sitecore template IDs
 */
const TEMPLATE_IDS = {
  FOLDER: '{A87A00B1-E6DB-45AB-8B54-636FEC3B5523}',
  SETTING: '{D2923FEE-DA4E-49BE-830C-E27764DFA269}',
};

/**
 * Sitecore implementation of Settings storage
 */
export class SitecoreSettingsStorage implements ISettingsStorage {
  constructor(private client: ClientSDK) {}

  /**
   * Gets the Sitecore context ID from the client
   */
  private async getSitecoreContextId(): Promise<string> {
    const response = await this.client.query("application.context");
    const appContext = response.data as ApplicationContext;
    const sitecoreContextId = (appContext as any).resourceAccess?.[0]?.context?.preview;
    
    if (!sitecoreContextId) {
      throw new Error("Sitecore Context ID not found in application context");
    }
    
    return sitecoreContextId;
  }

  /**
   * Get an item by path from Sitecore
   */
  private async getItemByPath(path: string): Promise<{ itemId: string; value: string } | null> {
    console.log(`⏳ [Sitecore] Getting item at path: ${path}`);
    
    try {
      const sitecoreContextId = await this.getSitecoreContextId();
      
      const graphqlQuery = {
        query: `
          query {
            item(
              where: {
                database: "master",
                path: "${path}"
              }
            ) {
              itemId
              name
              path
              fields(ownFields: true, excludeStandardFields: true) {
                nodes {
                  name
                  value
                }
              }
            }
          }
        `
      };

      const response: any = await this.client.mutate("xmc.authoring.graphql", {
        params: {
          query: { sitecoreContextId },
          body: graphqlQuery,
        },
      });
      
      const item = response?.data?.data?.item;
      
      if (!item) {
        console.log(`⚠️ [Sitecore] Item not found at path: ${path}`);
        return null;
      }

      const valueField = item.fields?.nodes?.find((f: any) => f.name === 'Value');
      
      return {
        itemId: item.itemId,
        value: valueField?.value || '',
      };
    } catch (error) {
      console.warn(`⚠️ [Sitecore] Could not get item at path ${path}:`, error);
      return null;
    }
  }

  /**
   * Create or update an item in Sitecore
   */
  private async upsertItem(path: string, parentPath: string, itemName: string, value: string, templateId: string): Promise<void> {
    console.log(`⏳ [Sitecore] Upserting item: ${path}`);
    
    try {
      const sitecoreContextId = await this.getSitecoreContextId();
      
      // Check if item exists
      const existingItem = await this.getItemByPath(path);
      
      if (existingItem) {
        // Update existing item
        console.log(`⏳ [Sitecore] Updating existing item: ${path}`);
        
        const updateMutation = {
          query: `
            mutation {
              updateItem(
                input: {
                  fields: [
                    {
                      name: "Value",
                      value: "${value.replace(/"/g, '\\"')}",
                      reset: false
                    }
                  ]
                  database: "master"
                  itemId: "${existingItem.itemId}"
                  language: "en"
                  path: "${path}"
                  version: 1
                }
              ) {
                item {
                  name
                  itemId
                  fields(ownFields: true) {
                    nodes {
                      name
                      value
                    }
                  }
                }
              }
            }
          `
        };

        await this.client.mutate("xmc.authoring.graphql", {
          params: {
            query: { sitecoreContextId },
            body: updateMutation,
          },
        });
        console.log(`✅ [Sitecore] Updated item: ${path}`);
      } else {
        // Get parent item ID
        console.log(`⏳ [Sitecore] Getting parent item for: ${parentPath}`);
        const parentItem = await this.getItemByPath(parentPath);
        if (!parentItem) {
          throw new Error(`Parent item not found: ${parentPath}`);
        }
        
        // Create new item using parent ID
        console.log(`⏳ [Sitecore] Creating new item: ${path}`);
        
        const createMutation = {
          query: `
            mutation {
              createItem(
                input: {
                  name: "${itemName}",
                  templateId: "${templateId}",
                  fields: [
                    {
                      name: "Value",
                      value: "${value.replace(/"/g, '\\"')}",
                      reset: false
                    }
                  ]
                  database: "master"
                  parent: "${parentItem.itemId}"
                  language: "en"
                }
              ) {
                item {
                  name
                  itemId
                  fields(ownFields: true) {
                    nodes {
                      name
                      value
                    }
                  }
                }
              }
            }
          `
        };

        await this.client.mutate("xmc.authoring.graphql", {
          params: {
            query: { sitecoreContextId },
            body: createMutation,
          },
        });
        console.log(`✅ [Sitecore] Created item: ${path}`);
      }
    } catch (error) {
      console.error(`❌ [Sitecore] Error upserting item ${path}:`, error);
      throw error;
    }
  }

  /**
   * Create a folder directly in Sitecore
   */
  private async createFolder(path: string, parentPath: string, folderName: string): Promise<void> {
    console.log(`⏳ [Sitecore] Creating folder: ${path}`);
    
    try {
      const sitecoreContextId = await this.getSitecoreContextId();
      
      // Get parent item ID
      const parentItem = await this.getItemByPath(parentPath);
      if (!parentItem) {
        throw new Error(`Parent item not found: ${parentPath}`);
      }
      
      const createMutation = {
        query: `
          mutation {
            createItem(
              input: {
                name: "${folderName}",
                templateId: "${TEMPLATE_IDS.FOLDER}",
                database: "master"
                parent: "${parentItem.itemId}"
                language: "en"
              }
            ) {
              item {
                itemId
                name
              }
            }
          }
        `
      };

      await this.client.mutate("xmc.authoring.graphql", {
        params: {
          query: { sitecoreContextId },
          body: createMutation,
        },
      });
      console.log(`✅ [Sitecore] Created folder: ${path}`);
    } catch (error: any) {
      // If folder already exists, that's fine
      if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
        console.log(`ℹ️ [Sitecore] Folder already exists: ${path}`);
      } else {
        console.error(`❌ [Sitecore] Error creating folder ${path}:`, error);
        throw error;
      }
    }
  }

  /**
   * Ensure folder structure exists in Sitecore
   */
  private async ensureFolderStructure(): Promise<void> {
    console.log('⏳ [Sitecore] Ensuring folder structure exists...');
    
    try {
      // Check and create Smart folder
      const smartFolder = await this.getItemByPath(SITECORE_PATHS.SMART);
      if (!smartFolder) {
        await this.createFolder(
          SITECORE_PATHS.SMART,
          SITECORE_PATHS.MODULES,
          'Smart'
        );
      }

      // Check and create SmartImageField folder
      const smartImageFieldFolder = await this.getItemByPath(SITECORE_PATHS.SMART_IMAGE_FIELD);
      if (!smartImageFieldFolder) {
        await this.createFolder(
          SITECORE_PATHS.SMART_IMAGE_FIELD,
          SITECORE_PATHS.SMART,
          'SmartImageField'
        );
      }

      console.log('✅ [Sitecore] Folder structure is ready');
    } catch (error) {
      console.error('❌ [Sitecore] Error ensuring folder structure:', error);
      throw error;
    }
  }

  async getSettings(organizationId: string): Promise<Settings | null> {
    console.log('⏳ [Sitecore] Loading settings for org:', organizationId);
    
    try {
      const previewHostItem = await this.getItemByPath(SITECORE_PATHS.PREVIEW_HOST);
      const credentialsItem = await this.getItemByPath(SITECORE_PATHS.CREDENTIALS);

      if (!previewHostItem || !credentialsItem) {
        console.log('⚠️ [Sitecore] Settings not found');
        return null;
      }

      // Parse credentials (ClientID:ClientSecret)
      const [client_id, client_secret] = credentialsItem.value.split(':');

      if (!client_id || !client_secret) {
        console.warn('⚠️ [Sitecore] Invalid credentials format');
        return null;
      }

      const settings: Settings = {
        preview_host: previewHostItem.value,
        client_id,
        client_secret,
      };

      console.log('✅ [Sitecore] Loaded settings');
      return settings;
    } catch (error) {
      console.error('❌ [Sitecore] Error in getSettings:', error);
      throw error;
    }
  }

  async hasSettings(organizationId: string): Promise<boolean> {
    console.log('⏳ [Sitecore] Checking if settings exist for org:', organizationId);
    
    try {
      // Ensure folder structure exists first
      await this.ensureFolderStructure();
      
      const previewHostItem = await this.getItemByPath(SITECORE_PATHS.PREVIEW_HOST);
      const credentialsItem = await this.getItemByPath(SITECORE_PATHS.CREDENTIALS);

      const exists = !!(previewHostItem && credentialsItem);
      console.log(exists ? '✅ [Sitecore] Settings found' : '⚠️ [Sitecore] No settings found');
      
      return exists;
    } catch (error) {
      console.error('❌ [Sitecore] Error in hasSettings:', error);
      return false;
    }
  }

  async saveSettings(organizationId: string, settings: Settings): Promise<Settings> {
    console.log('⏳ [Sitecore] Saving settings...');
    
    try {
      // Ensure folder structure exists
      await this.ensureFolderStructure();

      // Save PreviewHost
      await this.upsertItem(
        SITECORE_PATHS.PREVIEW_HOST,
        SITECORE_PATHS.SMART_IMAGE_FIELD,
        'PreviewHost',
        settings.preview_host,
        TEMPLATE_IDS.SETTING
      );

      // Save Credentials (ClientID:ClientSecret)
      const credentialsValue = `${settings.client_id}:${settings.client_secret}`;
      await this.upsertItem(
        SITECORE_PATHS.CREDENTIALS,
        SITECORE_PATHS.SMART_IMAGE_FIELD,
        'Credentials',
        credentialsValue,
        TEMPLATE_IDS.SETTING
      );

      console.log('✅ [Sitecore] Settings saved successfully');
      return settings;
    } catch (error) {
      console.error('❌ [Sitecore] Error in saveSettings:', error);
      throw error;
    }
  }
}
