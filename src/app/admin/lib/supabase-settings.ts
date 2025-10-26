// Supabase operations for admin settings management

import { createClient } from '@supabase/supabase-js';
import { Settings } from '../types/library';

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
  client_id?: string;
  client_secret?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Converts a database row to a Settings object
 */
function rowToSettings(row: SettingsRow): Settings {
  return {
    preview_host: row.preview_host,
    client_id: row.client_id || undefined,
    client_secret: row.client_secret || undefined,
  };
}

/**
 * Gets settings for an organization and marketplace app tenant
 */
export async function getSettings(organizationId: string, marketplaceAppTenantId: string): Promise<Settings | null> {
  console.log('⏳ Loading settings from Supabase for org:', organizationId, 'tenant:', marketplaceAppTenantId);
  
  try {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('settings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('marketplace_app_tenant_id', marketplaceAppTenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found
        console.log('⚠️ No settings found');
        return null;
      }
      console.error('❌ Error loading settings:', error);
      throw new Error(`Failed to load settings: ${error.message}`);
    }

    const settings = rowToSettings(data);
    console.log('✅ Loaded settings from Supabase');
    
    return settings;
  } catch (error) {
    console.error('❌ Error in getSettings:', error);
    throw error;
  }
}

/**
 * Checks if settings exist for an organization and marketplace app tenant
 */
export async function hasSettings(organizationId: string, marketplaceAppTenantId: string): Promise<boolean> {
  console.log('⏳ Checking if settings exist for org:', organizationId, 'tenant:', marketplaceAppTenantId);
  
  try {
    const client = getSupabaseClient();
    
    const { count, error } = await client
      .from('settings')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('marketplace_app_tenant_id', marketplaceAppTenantId);

    if (error) {
      console.error('❌ Error checking for settings:', error);
      return false;
    }

    const exists = (count || 0) > 0;
    console.log(exists ? '✅ Settings found' : '⚠️ No settings found');
    
    return exists;
  } catch (error) {
    console.error('❌ Error in hasSettings:', error);
    return false;
  }
}

/**
 * Creates or updates settings (upsert)
 */
export async function saveSettings(organizationId: string, marketplaceAppTenantId: string, settings: Settings): Promise<Settings> {
  console.log('⏳ Saving settings to Supabase...');
  
  try {
    const client = getSupabaseClient();
    
    const row = {
      organization_id: organizationId,
      marketplace_app_tenant_id: marketplaceAppTenantId,
      preview_host: settings.preview_host,
      client_id: settings.client_id || undefined,
      client_secret: settings.client_secret || undefined,
    };

    const { data, error } = await client
      .from('settings')
      .upsert(row as any)
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving settings:', error);
      throw new Error(`Failed to save settings: ${error.message}`);
    }

    console.log('✅ Settings saved successfully in Supabase');
    
    return rowToSettings(data);
  } catch (error) {
    console.error('❌ Error in saveSettings:', error);
    throw error;
  }
}

