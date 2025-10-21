// Supabase operations for admin library management

import { createClient } from '@supabase/supabase-js';
import { Library } from '../types/library';
import { validateFolder } from './folder-validation';

// Supabase client (using environment variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

/**
 * Gets or creates the Supabase client
 */
function getSupabaseClient() {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Anon Key must be configured in environment variables');
    }
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

/**
 * Database row type for libraries table
 */
interface LibraryRow {
  organization_id: string;
  marketplace_app_tenant_id: string;
  key: string;
  name: string;
  folder: string;
  preview_host: string;
  client_id?: string;
  client_secret?: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Converts a database row to a Library object
 */
function rowToLibrary(row: LibraryRow): Library {
  return {
    key: row.key,
    name: row.name,
    folder: row.folder,
    previewHost: row.preview_host,
    client_id: row.client_id,
    client_secret: row.client_secret,
  };
}

/**
 * Lists all active (non-archived) libraries for an organization and marketplace app tenant
 */
export async function listLibraries(organizationId: string, marketplaceAppTenantId: string): Promise<Library[]> {
  console.log('⏳ Loading active libraries from Supabase for org:', organizationId, 'tenant:', marketplaceAppTenantId);
  
  try {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('libraries')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('marketplace_app_tenant_id', marketplaceAppTenantId)
      .eq('archived', false)  // Only load non-archived libraries
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error loading libraries:', error);
      throw new Error(`Failed to load libraries: ${error.message}`);
    }

    const libraries = (data || []).map(rowToLibrary);
    console.log(`✅ Loaded ${libraries.length} active libraries from Supabase`);
    
    return libraries;
  } catch (error) {
    console.error('❌ Error in listLibraries:', error);
    throw error;
  }
}

/**
 * Checks if there are any active (non-archived) libraries for an organization and marketplace app tenant
 */
export async function hasAnyLibraries(organizationId: string, marketplaceAppTenantId: string): Promise<boolean> {
  console.log('⏳ Checking if any active libraries exist for org:', organizationId, 'tenant:', marketplaceAppTenantId);
  
  try {
    const client = getSupabaseClient();
    
    const { count, error } = await client
      .from('libraries')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('marketplace_app_tenant_id', marketplaceAppTenantId)
      .eq('archived', false);  // Only count non-archived libraries

    if (error) {
      console.error('❌ Error checking for libraries:', error);
      return false;
    }

    const hasLibraries = (count || 0) > 0;
    console.log(hasLibraries ? `✅ Found ${count} active libraries` : '⚠️ No active libraries found');
    
    return hasLibraries;
  } catch (error) {
    console.error('❌ Error in hasAnyLibraries:', error);
    return false;
  }
}

/**
 * Creates a new library
 */
export async function createLibrary(organizationId: string, marketplaceAppTenantId: string, library: Library): Promise<Library> {
  console.log(`⏳ Creating library in Supabase: ${library.name} (Key: ${library.key})...`);
  
  try {
    // Validate folder doesn't overlap with existing libraries
    const existingLibraries = await listLibraries(organizationId, marketplaceAppTenantId);
    const folderError = validateFolder(library.folder, existingLibraries);
    if (folderError) {
      throw new Error(`Folder validation failed: ${folderError}`);
    }
    
    const client = getSupabaseClient();
    
    const row: Omit<LibraryRow, 'created_at' | 'updated_at'> = {
      organization_id: organizationId,
      marketplace_app_tenant_id: marketplaceAppTenantId,
      key: library.key,
      name: library.name,
      folder: library.folder,
      preview_host: library.previewHost,
      client_id: library.client_id || null,
      client_secret: library.client_secret || null,
      archived: false,  // New libraries are not archived
    };

    const { data, error } = await client
      .from('libraries')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating library:', error);
      throw new Error(`Failed to create library: ${error.message}`);
    }

    console.log(`✅ Library "${library.name}" created successfully in Supabase`);
    
    return rowToLibrary(data);
  } catch (error) {
    console.error('❌ Error in createLibrary:', error);
    throw error;
  }
}

/**
 * Updates an existing library
 */
export async function updateLibrary(organizationId: string, marketplaceAppTenantId: string, library: Library): Promise<Library> {
  console.log(`⏳ Updating library in Supabase: ${library.name}...`);
  
  try {
    // Validate folder doesn't overlap with other libraries (excluding current one)
    const existingLibraries = await listLibraries(organizationId, marketplaceAppTenantId);
    const folderError = validateFolder(library.folder, existingLibraries, library.key);
    if (folderError) {
      throw new Error(`Folder validation failed: ${folderError}`);
    }
    
    const client = getSupabaseClient();
    
    const updates = {
      name: library.name,
      folder: library.folder,
      preview_host: library.previewHost,
      client_id: library.client_id || null,
      client_secret: library.client_secret || null,
    };

    const { data, error } = await client
      .from('libraries')
      .update(updates)
      .eq('organization_id', organizationId)
      .eq('marketplace_app_tenant_id', marketplaceAppTenantId)
      .eq('key', library.key)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating library:', error);
      throw new Error(`Failed to update library: ${error.message}`);
    }

    console.log(`✅ Library "${library.name}" updated successfully in Supabase`);
    
    return rowToLibrary(data);
  } catch (error) {
    console.error('❌ Error in updateLibrary:', error);
    throw error;
  }
}

/**
 * Archives a library (soft delete) - not allowed for Main Library
 * This operation cannot be undone through the UI
 */
export async function archiveLibrary(organizationId: string, marketplaceAppTenantId: string, library: Library): Promise<void> {
  if (library.name === 'Main Library') {
    throw new Error('Cannot archive Main Library');
  }

  console.log(`⏳ Archiving library in Supabase: ${library.name}...`);
  
  try {
    const client = getSupabaseClient();
    
    const { error } = await client
      .from('libraries')
      .update({ archived: true })
      .eq('organization_id', organizationId)
      .eq('marketplace_app_tenant_id', marketplaceAppTenantId)
      .eq('key', library.key);

    if (error) {
      console.error('❌ Error archiving library:', error);
      throw new Error(`Failed to archive library: ${error.message}`);
    }

    console.log(`✅ Library "${library.name}" archived successfully in Supabase`);
  } catch (error) {
    console.error('❌ Error in archiveLibrary:', error);
    throw error;
  }
}

/**
 * Alias for archiveLibrary to maintain backward compatibility
 * @deprecated Use archiveLibrary instead
 */
export const deleteLibrary = archiveLibrary;

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

