// Sitecore implementation of Libraries storage using ClientSDK and GraphQL

import { Library } from '@/src/app/admin/types/library';
import { ILibrariesStorage } from './types';
import { ClientSDK, ApplicationContext } from '@sitecore-marketplace-sdk/client';

/**
 * Sitecore paths for library items
 */
const SITECORE_PATHS = {
  MODULES: '/sitecore/system/Modules',
  SMART: '/sitecore/system/Modules/Smart',
  SMART_IMAGE_FIELD: '/sitecore/system/Modules/Smart/SmartImageField',
  LIBRARIES_FOLDER: '/sitecore/system/Modules/Smart/SmartImageField/Libraries',
};

/**
 * Sitecore template IDs
 */
const TEMPLATE_IDS = {
  FOLDER: '{A87A00B1-E6DB-45AB-8B54-636FEC3B5523}',
  LIBRARY: '{D2923FEE-DA4E-49BE-830C-E27764DFA269}',
  LIBRARIES_FOLDER: '{0A92FEEE-0E15-4E81-B044-2AD901B88DDD}',
};

/**
 * Sitecore implementation of Libraries storage
 */
export class SitecoreLibrariesStorage implements ILibrariesStorage {
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
  private async getItemByPath(path: string): Promise<{ itemId: string; name: string; value: string } | null> {
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
        name: item.name,
        value: valueField?.value || '',
      };
    } catch (error) {
      console.warn(`⚠️ [Sitecore] Could not get item at path ${path}:`, error);
      return null;
    }
  }

  /**
   * Get all children of a folder
   */
  private async getChildren(folderPath: string): Promise<Array<{ name: string; value: string }>> {
    console.log(`⏳ [Sitecore] Getting children of: ${folderPath}`);
    
    try {
      const sitecoreContextId = await this.getSitecoreContextId();
      
      const graphqlQuery = {
        query: `
          query {
            item(
              where: {
                database: "master",
                path: "${folderPath}"
              }
            ) {
              children {
                nodes {
                  name
                  fields(ownFields: true, excludeStandardFields: true) {
                    nodes {
                      name
                      value
                    }
                  }
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
      
      if (!item || !item.children?.nodes) {
        console.log(`⚠️ [Sitecore] No children found at path: ${folderPath}`);
        return [];
      }

      return item.children.nodes.map((child: any) => {
        const valueField = child.fields?.nodes?.find((f: any) => f.name === 'Value');
        return {
          name: child.name,
          value: valueField?.value || '',
        };
      });
    } catch (error) {
      console.error(`❌ [Sitecore] Error getting children at path ${folderPath}:`, error);
      return [];
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
   * Delete an item from Sitecore
   */
  private async deleteItem(path: string): Promise<void> {
    console.log(`⏳ [Sitecore] Deleting item: ${path}`);
    
    try {
      const sitecoreContextId = await this.getSitecoreContextId();
      
      const item = await this.getItemByPath(path);
      if (!item) {
        console.log(`⚠️ [Sitecore] Item not found, skipping delete: ${path}`);
        return;
      }

      const deleteMutation = {
        query: `
          mutation {
            deleteItem(
              input: {
                database: "master"
                itemId: "${item.itemId}"
                language: "en"
              }
            ) {
              success
            }
          }
        `
      };

      await this.client.mutate("xmc.authoring.graphql", {
        params: {
          query: { sitecoreContextId },
          body: deleteMutation,
        },
      });
      console.log(`✅ [Sitecore] Deleted item: ${path}`);
    } catch (error) {
      console.error(`❌ [Sitecore] Error deleting item ${path}:`, error);
      throw error;
    }
  }

  /**
   * Create a folder directly in Sitecore without parent validation
   */
  private async createFolder(path: string, parentPath: string, folderName: string, templateId: string): Promise<void> {
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
                templateId: "${templateId}",
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
          'Smart',
          TEMPLATE_IDS.FOLDER
        );
      }

      // Check and create SmartImageField folder
      const smartImageFieldFolder = await this.getItemByPath(SITECORE_PATHS.SMART_IMAGE_FIELD);
      if (!smartImageFieldFolder) {
        await this.createFolder(
          SITECORE_PATHS.SMART_IMAGE_FIELD,
          SITECORE_PATHS.SMART,
          'SmartImageField',
          TEMPLATE_IDS.FOLDER
        );
      }

      // Check and create Libraries folder
      const librariesFolder = await this.getItemByPath(SITECORE_PATHS.LIBRARIES_FOLDER);
      if (!librariesFolder) {
        await this.createFolder(
          SITECORE_PATHS.LIBRARIES_FOLDER,
          SITECORE_PATHS.SMART_IMAGE_FIELD,
          'Libraries',
          TEMPLATE_IDS.LIBRARIES_FOLDER
        );
      }

      console.log('✅ [Sitecore] Folder structure is ready');
    } catch (error) {
      console.error('❌ [Sitecore] Error ensuring folder structure:', error);
      throw error;
    }
  }

  /**
   * Parse library value from Sitecore format (Key:Name:Folder)
   */
  private parseLibraryValue(name: string, value: string): Library | null {
    const parts = value.split(':');
    if (parts.length !== 3) {
      console.warn(`⚠️ [Sitecore] Invalid library value format: ${value}`);
      return null;
    }

    return {
      key: parts[0],
      name: parts[1],
      folder: parts[2],
    };
  }

  /**
   * Format library to Sitecore value format (Key:Name:Folder)
   */
  private formatLibraryValue(library: Library): string {
    return `${library.key}:${library.name}:${library.folder}`;
  }

  async getLibraries(organizationId: string): Promise<Library[]> {
    console.log('⏳ [Sitecore] Loading libraries for org:', organizationId);
    
    try {
      const children = await this.getChildren(SITECORE_PATHS.LIBRARIES_FOLDER);
      console.log(`⏳ [Sitecore] Found ${children.length} library items`);
      console.log(children);
      
      const libraries: Library[] = [];
      for (const child of children) {
        const library = this.parseLibraryValue(child.name, child.value);
        if (library) {
          libraries.push(library);
        }
      }

      console.log(`✅ [Sitecore] Loaded ${libraries.length} libraries`);
      return libraries;
    } catch (error) {
      console.error('❌ [Sitecore] Error in getLibraries:', error);
      throw error;
    }
  }

  async getLibrary(organizationId: string, key: string): Promise<Library | null> {
    console.log('⏳ [Sitecore] Loading library:', { organizationId, key });
    
    try {
      const libraries = await this.getLibraries(organizationId);
      const library = libraries.find(lib => lib.key === key);
      
      if (!library) {
        console.log('⚠️ [Sitecore] Library not found');
        return null;
      }

      console.log('✅ [Sitecore] Loaded library');
      return library;
    } catch (error) {
      console.error('❌ [Sitecore] Error in getLibrary:', error);
      throw error;
    }
  }

  async hasAnyLibraries(organizationId: string): Promise<boolean> {
    console.log('⏳ [Sitecore] Checking if libraries exist for org:', organizationId);
    
    try {
      // Ensure folder structure exists first
      await this.ensureFolderStructure();
      
      const children = await this.getChildren(SITECORE_PATHS.LIBRARIES_FOLDER);
      const exists = children.length > 0;
      
      console.log(exists ? '✅ [Sitecore] Libraries found' : '⚠️ [Sitecore] No libraries found');
      return exists;
    } catch (error) {
      console.error('❌ [Sitecore] Error in hasAnyLibraries:', error);
      return false;
    }
  }

  async saveLibrary(organizationId: string, library: Library): Promise<Library> {
    console.log('⏳ [Sitecore] Saving library...');
    
    try {
      // Ensure folder structure exists
      await this.ensureFolderStructure();

      // Format library value
      const value = this.formatLibraryValue(library);
      const path = `${SITECORE_PATHS.LIBRARIES_FOLDER}/${library.name}`;

      // Save library item
      await this.upsertItem(
        path,
        SITECORE_PATHS.LIBRARIES_FOLDER,
        library.name,
        value,
        TEMPLATE_IDS.LIBRARY
      );

      console.log('✅ [Sitecore] Library saved successfully');
      return library;
    } catch (error) {
      console.error('❌ [Sitecore] Error in saveLibrary:', error);
      throw error;
    }
  }

  async archiveLibrary(organizationId: string, library: Library): Promise<void> {
    console.log('⏳ [Sitecore] Archiving library...');
    
    if (library.name === 'Main Library') {
      throw new Error('Cannot archive Main Library');
    }

    try {
      const path = `${SITECORE_PATHS.LIBRARIES_FOLDER}/${library.name}`;
      await this.deleteItem(path);

      console.log('✅ [Sitecore] Library archived successfully');
    } catch (error) {
      console.error('❌ [Sitecore] Error in archiveLibrary:', error);
      throw error;
    }
  }
}
