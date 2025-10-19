// Sitecore GraphQL operations for library management

import { ClientSDK, ApplicationContext } from '@sitecore-marketplace-sdk/client';
import { Library } from '../types/library';

// Sitecore constants
const SMART_IMAGE_FIELD_FOLDER_PATH = '/sitecore/system/Modules/SmartImageField';
const MODULES_FOLDER_ID = '{08477468-D438-43D4-9D6A-6D84A611971C}';
const FOLDER_TEMPLATE_ID = '{A87A00B1-E6DB-45AB-8B54-636FEC3B5523}';
const NAME_VALUE_LIST_TEMPLATE_ID = '{D2923FEE-DA4E-49BE-830C-E27764DFA269}';

// Delay to prevent race conditions in GraphQL operations (in milliseconds)
const GRAPHQL_OPERATION_DELAY = 250;

/**
 * Utility function to add delay between operations to prevent race conditions
 */
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gets the Sitecore context ID from the client
 */
async function getSitecoreContextId(client: ClientSDK): Promise<string> {
  const response = await client.query("application.context");
  const appContext = response.data as ApplicationContext;
  const sitecoreContextId = (appContext as any).resourceAccess?.[0]?.context?.preview;
  
  if (!sitecoreContextId) {
    throw new Error("Sitecore Context ID not found in application context");
  }
  
  return sitecoreContextId;
}

/**
 * Generates a GUID without dashes or braces
 */
export function generateLibraryKey(): string {
  // Generate a random GUID and remove dashes and braces
  const guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  
  return guid.replace(/-/g, '').toUpperCase();
}

/**
 * Checks if the SmartImageField folder exists in Sitecore
 */
export async function checkSmartImageFieldFolder(client: ClientSDK): Promise<string | null> {
  const graphqlQuery = {
    query: `
      query {
        item(
          where: {
            database: "master",
            path: "${SMART_IMAGE_FIELD_FOLDER_PATH}"
          }
        ) {
          itemId
        }
      }
    `
  };

  try {
    console.log('⏳ Checking SmartImageField folder...');
    const sitecoreContextId = await getSitecoreContextId(client);
    
    const result: any = await client.mutate("xmc.authoring.graphql", {
      params: {
        query: { sitecoreContextId },
        body: graphqlQuery,
      },
    });
    
    await delay(GRAPHQL_OPERATION_DELAY);
    
    if (result?.data?.data?.item?.itemId) {
      console.log('✅ SmartImageField folder found:', result.data.data.item.itemId);
      return result.data.data.item.itemId;
    }
    
    console.log('⚠️ SmartImageField folder not found');
    return null;
  } catch (error) {
    console.error('❌ Error checking SmartImageField folder:', error);
    await delay(GRAPHQL_OPERATION_DELAY);
    return null;
  }
}

/**
 * Creates the SmartImageField folder in Sitecore
 */
export async function createSmartImageFieldFolder(client: ClientSDK): Promise<string> {
  const graphqlMutation = {
    query: `
      mutation {
        createItem(
          input: {
            name: "SmartImageField"
            templateId: "${FOLDER_TEMPLATE_ID}"
            parent: "${MODULES_FOLDER_ID}"
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

  try {
    console.log('⏳ Creating SmartImageField folder...');
    const sitecoreContextId = await getSitecoreContextId(client);
    
    const result: any = await client.mutate("xmc.authoring.graphql", {
      params: {
        query: { sitecoreContextId },
        body: graphqlMutation,
      },
    });
    
    await delay(GRAPHQL_OPERATION_DELAY);
    
    if (result?.data?.data?.createItem?.item?.itemId) {
      console.log('✅ SmartImageField folder created:', result.data.data.createItem.item.itemId);
      return result.data.data.createItem.item.itemId;
    }
    
    throw new Error('Failed to create SmartImageField folder');
  } catch (error) {
    console.error('❌ Error creating SmartImageField folder:', error);
    await delay(GRAPHQL_OPERATION_DELAY);
    throw error;
  }
}

/**
 * Ensures the SmartImageField folder exists
 * Includes race condition protection by checking again after creation attempt
 */
export async function ensureSmartImageFieldFolder(client: ClientSDK): Promise<string> {
  console.log('🔍 Ensuring SmartImageField folder exists...');
  
  let folderId = await checkSmartImageFieldFolder(client);
  
  if (!folderId) {
    console.log('📁 Folder not found, attempting to create...');
    
    try {
      folderId = await createSmartImageFieldFolder(client);
    } catch (error) {
      // If creation fails, it might be a race condition (folder was just created)
      // Check again to see if it exists now
      console.warn('⚠️ Creation failed, checking if folder exists now (race condition handling)...');
      await delay(GRAPHQL_OPERATION_DELAY);
      
      folderId = await checkSmartImageFieldFolder(client);
      
      if (!folderId) {
        // Still doesn't exist, re-throw the original error
        throw error;
      }
      
      console.log('✅ Folder exists after retry (race condition detected and handled)');
    }
  }
  
  return folderId;
}

/**
 * Checks if there are any libraries (children) under SmartImageField folder
 * Returns true if any children exist, false if empty
 */
export async function hasAnyLibraries(client: ClientSDK): Promise<boolean> {
  const graphqlQuery = {
    query: `
      query {
        item(
          where: {
            database: "master",
            path: "${SMART_IMAGE_FIELD_FOLDER_PATH}"
          }
        ) {
          itemId
          children {
            nodes {
              itemId
              name
            }
          }
        }
      }
    `
  };

  try {
    console.log('⏳ Checking if any libraries exist...');
    const sitecoreContextId = await getSitecoreContextId(client);
    
    const result: any = await client.mutate("xmc.authoring.graphql", {
      params: {
        query: { sitecoreContextId },
        body: graphqlQuery,
      },
    });
    
    await delay(GRAPHQL_OPERATION_DELAY);
    
    const children = result?.data?.data?.item?.children?.nodes || [];
    const hasChildren = children.length > 0;
    
    console.log(hasChildren ? `✅ Found ${children.length} existing libraries` : '⚠️ No libraries found');
    return hasChildren;
  } catch (error) {
    console.error('❌ Error checking for libraries:', error);
    await delay(GRAPHQL_OPERATION_DELAY);
    return false;
  }
}

/**
 * Lists all libraries from Sitecore
 */
export async function listLibraries(client: ClientSDK): Promise<Library[]> {
  const graphqlQuery = {
    query: `
      query {
        item(
          where: {
            database: "master",
            path: "${SMART_IMAGE_FIELD_FOLDER_PATH}"
          }
        ) {
          itemId
          children {
            nodes {
              itemId
              name
              children {
                nodes {
                  itemId
                  name
                  ... on NameValueListItem {
                    value {
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    `
  };

  try {
    console.log('⏳ Loading libraries...');
    const sitecoreContextId = await getSitecoreContextId(client);
    
    const result: any = await client.mutate("xmc.authoring.graphql", {
      params: {
        query: { sitecoreContextId },
        body: graphqlQuery,
      },
    });
    
    await delay(GRAPHQL_OPERATION_DELAY);
    
    const libraries: Library[] = [];
    const folders = result?.data?.data?.item?.children?.nodes || [];
    
    for (const folder of folders) {
      const dataItem = folder.children?.nodes?.find((child: any) => child.name === 'Data');
      
      if (dataItem?.value?.value) {
        const parts = dataItem.value.value.split('|');
        if (parts.length === 4) {
          libraries.push({
            key: parts[0],
            name: parts[1],
            folder: parts[2],
            previewHost: parts[3],
            sitecoreItemId: folder.itemId,
            sitecoreDataItemId: dataItem.itemId,
          });
        }
      }
    }
    
    console.log(`✅ Loaded ${libraries.length} libraries`);
    return libraries;
  } catch (error) {
    console.error('❌ Error listing libraries:', error);
    await delay(GRAPHQL_OPERATION_DELAY);
    throw error;
  }
}

/**
 * Creates a new library in Sitecore
 */
export async function createLibrary(client: ClientSDK, library: Library): Promise<Library> {
  console.log(`⏳ Creating library: ${library.name} (Key: ${library.key})...`);
  
  // Ensure the SmartImageField folder exists
  const parentFolderId = await ensureSmartImageFieldFolder(client);
  const sitecoreContextId = await getSitecoreContextId(client);
  
  // Create the library folder using the key as the folder name
  console.log(`⏳ Creating library folder with name: ${library.key}...`);
  const folderMutation = {
    query: `
      mutation {
        createItem(
          input: {
            name: "${library.key}"
            templateId: "${FOLDER_TEMPLATE_ID}"
            parent: "${parentFolderId}"
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

  const folderResult: any = await client.mutate("xmc.authoring.graphql", {
    params: {
      query: { sitecoreContextId },
      body: folderMutation,
    },
  });
  
  await delay(GRAPHQL_OPERATION_DELAY);
  
  const libraryFolderId = folderResult?.data?.data?.createItem?.item?.itemId;
  
  if (!libraryFolderId) {
    throw new Error('Failed to create library folder');
  }
  
  console.log('✅ Library folder created:', libraryFolderId, `(${library.key})`);

  // Create the Data item
  console.log('⏳ Creating library data item...');
  const dataValue = `${library.key}|${library.name}|${library.folder}|${library.previewHost}`;
  const dataMutation = {
    query: `
      mutation {
        createItem(
          input: {
            name: "Data"
            templateId: "${NAME_VALUE_LIST_TEMPLATE_ID}"
            parent: "${libraryFolderId}"
            language: "en"
            fields: [
              { name: "Value", value: "${dataValue}" }
            ]
          }
        ) {
          item {
            itemId
          }
        }
      }
    `
  };

  const dataResult: any = await client.mutate("xmc.authoring.graphql", {
    params: {
      query: { sitecoreContextId },
      body: dataMutation,
    },
  });
  
  await delay(GRAPHQL_OPERATION_DELAY);
  
  const dataItemId = dataResult?.data?.data?.createItem?.item?.itemId;
  
  if (!dataItemId) {
    throw new Error('Failed to create library data item');
  }
  
  console.log('✅ Library data item created:', dataItemId);
  console.log(`✅ Library "${library.name}" created successfully`);

  return {
    ...library,
    sitecoreItemId: libraryFolderId,
    sitecoreDataItemId: dataItemId,
  };
}

/**
 * Updates an existing library in Sitecore
 */
export async function updateLibrary(client: ClientSDK, library: Library): Promise<Library> {
  if (!library.sitecoreDataItemId) {
    throw new Error('Cannot update library without sitecoreDataItemId');
  }

  console.log(`⏳ Updating library: ${library.name}...`);
  
  const dataValue = `${library.key}|${library.name}|${library.folder}|${library.previewHost}`;
  const graphqlMutation = {
    query: `
      mutation {
        updateItem(
          input: {
            itemId: "${library.sitecoreDataItemId}"
            language: "en"
            fields: [
              { name: "Value", value: "${dataValue}" }
            ]
          }
        ) {
          item {
            itemId
          }
        }
      }
    `
  };

  try {
    const sitecoreContextId = await getSitecoreContextId(client);
    
    await client.mutate("xmc.authoring.graphql", {
      params: {
        query: { sitecoreContextId },
        body: graphqlMutation,
      },
    });
    
    await delay(GRAPHQL_OPERATION_DELAY);
    
    console.log(`✅ Library "${library.name}" updated successfully`);
    return library;
  } catch (error) {
    console.error(`❌ Error updating library "${library.name}":`, error);
    await delay(GRAPHQL_OPERATION_DELAY);
    throw error;
  }
}

/**
 * Deletes a library from Sitecore (not allowed for Main Library)
 */
export async function deleteLibrary(client: ClientSDK, library: Library): Promise<void> {
  if (library.name === 'Main Library') {
    throw new Error('Cannot delete Main Library');
  }

  if (!library.sitecoreItemId) {
    throw new Error('Cannot delete library without sitecoreItemId');
  }

  console.log(`⏳ Deleting library: ${library.name}...`);
  
  const graphqlMutation = {
    query: `
      mutation {
        deleteItem(
          input: {
            itemId: "${library.sitecoreItemId}"
          }
        ) {
          success
        }
      }
    `
  };

  try {
    const sitecoreContextId = await getSitecoreContextId(client);
    
    await client.mutate("xmc.authoring.graphql", {
      params: {
        query: { sitecoreContextId },
        body: graphqlMutation,
      },
    });
    
    await delay(GRAPHQL_OPERATION_DELAY);
    
    console.log(`✅ Library "${library.name}" deleted successfully`);
  } catch (error) {
    console.error(`❌ Error deleting library "${library.name}":`, error);
    await delay(GRAPHQL_OPERATION_DELAY);
    throw error;
  }
}

