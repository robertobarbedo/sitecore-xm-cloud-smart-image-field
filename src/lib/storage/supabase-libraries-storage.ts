// Supabase implementation of Libraries storage

import { createClient } from '@supabase/supabase-js';
import { Library } from '@/src/app/admin/types/library';
import { ILibrariesStorage } from './types';

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
  };
}

/**
 * Supabase implementation of Libraries storage
 */
export class SupabaseLibrariesStorage implements ILibrariesStorage {
  async getLibraries(organizationId: string): Promise<Library[]> {
    console.log('⏳ [Supabase] Loading libraries for org:', organizationId);
    
    try {
      const client = getSupabaseClient();
      
      const { data, error } = await client
        .from('libraries')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('archived', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ [Supabase] Error loading libraries:', error);
        throw new Error(`Failed to load libraries: ${error.message}`);
      }

      const libraries = (data || []).map(rowToLibrary);
      console.log(`✅ [Supabase] Loaded ${libraries.length} libraries`);
      
      return libraries;
    } catch (error) {
      console.error('❌ [Supabase] Error in getLibraries:', error);
      throw error;
    }
  }

  async getLibrary(organizationId: string, key: string): Promise<Library | null> {
    console.log('⏳ [Supabase] Loading library:', { organizationId, key });
    
    try {
      const client = getSupabaseClient();
      
      const { data, error } = await client
        .from('libraries')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('key', key)
        .eq('archived', false)
        .maybeSingle();

      if (error) {
        console.error('❌ [Supabase] Error loading library:', error);
        throw new Error(`Failed to load library: ${error.message}`);
      }

      if (!data) {
        console.log('⚠️ [Supabase] Library not found');
        return null;
      }

      const library = rowToLibrary(data);
      console.log('✅ [Supabase] Loaded library');
      
      return library;
    } catch (error) {
      console.error('❌ [Supabase] Error in getLibrary:', error);
      throw error;
    }
  }

  async hasAnyLibraries(organizationId: string): Promise<boolean> {
    console.log('⏳ [Supabase] Checking if libraries exist for org:', organizationId);
    
    try {
      const client = getSupabaseClient();
      
      const { count, error } = await client
        .from('libraries')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('archived', false);

      if (error) {
        console.error('❌ [Supabase] Error checking for libraries:', error);
        return false;
      }

      const exists = (count || 0) > 0;
      console.log(exists ? '✅ [Supabase] Libraries found' : '⚠️ [Supabase] No libraries found');
      
      return exists;
    } catch (error) {
      console.error('❌ [Supabase] Error in hasAnyLibraries:', error);
      return false;
    }
  }

  async saveLibrary(organizationId: string, library: Library): Promise<Library> {
    console.log('⏳ [Supabase] Saving library...');
    
    try {
      const client = getSupabaseClient();
      
      const row = {
        organization_id: organizationId,
        marketplace_app_tenant_id: organizationId, // Use organizationId as tenant ID
        key: library.key,
        name: library.name,
        folder: library.folder,
        archived: false,
      };

      const { data, error } = await client
        .from('libraries')
        .upsert(row as any)
        .select()
        .single();

      if (error) {
        console.error('❌ [Supabase] Error saving library:', error);
        throw new Error(`Failed to save library: ${error.message}`);
      }

      console.log('✅ [Supabase] Library saved successfully');
      
      return rowToLibrary(data);
    } catch (error) {
      console.error('❌ [Supabase] Error in saveLibrary:', error);
      throw error;
    }
  }

  async archiveLibrary(organizationId: string, library: Library): Promise<void> {
    console.log('⏳ [Supabase] Archiving library...');
    
    try {
      const client = getSupabaseClient();
      
      // Type assertion needed for Supabase update
      const { error } = await (client
        .from('libraries') as any)
        .update({ archived: true })
        .eq('organization_id', organizationId)
        .eq('key', library.key);

      if (error) {
        console.error('❌ [Supabase] Error archiving library:', error);
        throw new Error(`Failed to archive library: ${error.message}`);
      }

      console.log('✅ [Supabase] Library archived successfully');
    } catch (error) {
      console.error('❌ [Supabase] Error in archiveLibrary:', error);
      throw error;
    }
  }
}
