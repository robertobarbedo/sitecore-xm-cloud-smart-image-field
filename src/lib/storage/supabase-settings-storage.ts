// Supabase implementation of Settings storage

import { createClient } from '@supabase/supabase-js';
import { Settings } from '@/src/app/admin/types/library';
import { ISettingsStorage } from './types';

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
 * Database row type for settings table
 */
interface SettingsRow {
  organization_id: string;
  marketplace_app_tenant_id: string;
  preview_host: string;
  client_id: string;
  client_secret: string;
  created_at: string;
  updated_at: string;
}

/**
 * Converts a database row to a Settings object
 */
function rowToSettings(row: SettingsRow): Settings {
  return {
    preview_host: row.preview_host,
    client_id: row.client_id,
    client_secret: row.client_secret,
  };
}

/**
 * Supabase implementation of Settings storage
 */
export class SupabaseSettingsStorage implements ISettingsStorage {
  async getSettings(organizationId: string): Promise<Settings | null> {
    console.log('⏳ [Supabase] Loading settings for org:', organizationId);
    
    try {
      const client = getSupabaseClient();
      
      const { data, error } = await client
        .from('settings')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) {
        console.error('❌ [Supabase] Error loading settings:', error);
        throw new Error(`Failed to load settings: ${error.message}`);
      }

      if (!data) {
        console.log('⚠️ [Supabase] No settings found');
        return null;
      }

      const settings = rowToSettings(data);
      console.log('✅ [Supabase] Loaded settings');
      
      return settings;
    } catch (error) {
      console.error('❌ [Supabase] Error in getSettings:', error);
      throw error;
    }
  }

  async hasSettings(organizationId: string): Promise<boolean> {
    console.log('⏳ [Supabase] Checking if settings exist for org:', organizationId);
    
    try {
      const client = getSupabaseClient();
      
      const { count, error } = await client
        .from('settings')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (error) {
        console.error('❌ [Supabase] Error checking for settings:', error);
        return false;
      }

      const exists = (count || 0) > 0;
      console.log(exists ? '✅ [Supabase] Settings found' : '⚠️ [Supabase] No settings found');
      
      return exists;
    } catch (error) {
      console.error('❌ [Supabase] Error in hasSettings:', error);
      return false;
    }
  }

  async saveSettings(organizationId: string, settings: Settings): Promise<Settings> {
    console.log('⏳ [Supabase] Saving settings...');
    
    try {
      const client = getSupabaseClient();
      
      const row = {
        organization_id: organizationId,
        marketplace_app_tenant_id: organizationId, // Use organizationId as tenant ID
        preview_host: settings.preview_host,
        client_id: settings.client_id,
        client_secret: settings.client_secret,
      };

      const { data, error } = await client
        .from('settings')
        .upsert(row as any)
        .select()
        .single();

      if (error) {
        console.error('❌ [Supabase] Error saving settings:', error);
        throw new Error(`Failed to save settings: ${error.message}`);
      }

      console.log('✅ [Supabase] Settings saved successfully');
      
      return rowToSettings(data);
    } catch (error) {
      console.error('❌ [Supabase] Error in saveSettings:', error);
      throw error;
    }
  }
}
