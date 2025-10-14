// lib/folder-manager.ts

import { ClientSDK, ApplicationContext } from "@sitecore-marketplace-sdk/client";

export interface FolderItem {
  itemId: string;
}

export interface CreateItemResponse {
  createItem: {
    item: {
      itemId: string;
    };
  };
}

/**
 * Gets the application context from the client
 * @param client - The ClientSDK instance
 * @returns The application context
 */
async function getApplicationContext(client: ClientSDK): Promise<ApplicationContext> {
  const response = await client.query("application.context");
  return response.data as ApplicationContext;
}

/**
 * Gets the Sitecore context ID from the application context
 * @param appContext - The application context
 * @returns The Sitecore context ID
 */
function getSitecoreContextId(appContext: ApplicationContext): string {
  const sitecoreContextId = (appContext as any).resourceAccess?.[0]?.context?.preview;
  if (!sitecoreContextId) {
    throw new Error("Sitecore Context ID not found in application context");
  }
  return sitecoreContextId;
}

/**
 * Gets the folder ID if it exists, returns null if it doesn't
 * @param client - The ClientSDK instance
 * @param path - The folder path to check
 * @returns The folder ID if it exists, null otherwise
 */
export async function getFolder(client: ClientSDK, path: string): Promise<string | null> {
  try {
    const appContext = await getApplicationContext(client);
    const sitecoreContextId = getSitecoreContextId(appContext);

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
          }
        }
      `
    };

    const response = await client.mutate("xmc.authoring.graphql", {
      params: {
        query: { sitecoreContextId },
        body: graphqlQuery,
      },
    });
    
    const itemData = (response as any)?.data?.data?.item;
    if (itemData?.itemId) {
      return itemData.itemId;
    }
    
    return null;
  } catch (error) {
    console.error('Error checking folder existence:', error);
    return null;
  }
}

/**
 * Creates a folder path segment by segment and returns the final folder ID
 * @param client - The ClientSDK instance
 * @param path - The full path to create
 * @returns The ID of the created or existing folder
 */
export async function createFolder(client: ClientSDK, path: string): Promise<string | null> {
  try {
    // Check if the full path already exists
    const existingFolderId = await getFolder(client, path);
    if (existingFolderId) {
      return existingFolderId;
    }

    // Split the path into segments
    const segments = path.split('/').filter(segment => segment.length > 0);
    
    let currentPath = '';
    let parentId = await getFolder(client, '/sitecore'); // Start from sitecore root
    
    if (!parentId) {
      throw new Error('Cannot find Sitecore root item');
    }

    // Process each segment
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += '/' + segment;
      
      // Check if this segment exists
      let segmentId = await getFolder(client, currentPath);
      
      if (!segmentId) {
        // Create the segment
        const appContext = await getApplicationContext(client);
        const sitecoreContextId = getSitecoreContextId(appContext);

        const graphqlMutation: { query: string } = {
          query: `
            mutation {
              createItem(
                input: {
                  name: "${segment}"
                  templateId: "{FE5DD826-48C6-436D-B87A-7C4210C7413B}"
                  parent: "${parentId}"
                  language: "en"
                }
              ) {
                item {
                  itemId
                }
              }
            }
          `
        };

        const response: any = await client.mutate("xmc.authoring.graphql", {
          params: {
            query: { sitecoreContextId },
            body: graphqlMutation,
          },
        });
        
        const createItemData: any = response?.data?.data?.createItem?.item;
        if (!createItemData?.itemId) {
          throw new Error(`Failed to create segment: ${segment}`);
        }
        
        segmentId = createItemData.itemId;
      }
      
      parentId = segmentId;
    }

    return parentId;
  } catch (error) {
    console.error('Error creating folder:', error);
    return null;
  }
}