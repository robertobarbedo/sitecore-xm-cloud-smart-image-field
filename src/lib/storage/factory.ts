// Storage factory to create storage instances based on STORAGE_TYPE

import { ISettingsStorage, ILibrariesStorage, StorageType } from './types';
import { SupabaseSettingsStorage } from './supabase-settings-storage';
import { SupabaseLibrariesStorage } from './supabase-libraries-storage';
import { SitecoreSettingsStorage } from './sitecore-settings-storage';
import { SitecoreLibrariesStorage } from './sitecore-libraries-storage';
import { ClientSDK } from '@sitecore-marketplace-sdk/client';

/**
 * Get the storage type from environment variable
 */
export function getStorageType(): StorageType {
  // Use process.env for server-side and build-time, but also check window for client-side
  const storageType = typeof window !== 'undefined' 
    ? (window as any).ENV?.NEXT_PUBLIC_STORAGE_TYPE || process.env.NEXT_PUBLIC_STORAGE_TYPE
    : process.env.NEXT_PUBLIC_STORAGE_TYPE;
  
  const finalStorageType = storageType || 'SITECORE';
  
  console.log(`🔍 Storage type from env: "${storageType}" -> Using: "${finalStorageType}"`);
  
  if (finalStorageType !== 'SUPABASE' && finalStorageType !== 'SITECORE') {
    console.warn(`⚠️ Invalid STORAGE_TYPE: ${finalStorageType}, defaulting to SITECORE`);
    return 'SITECORE';
  }
  
  return finalStorageType as StorageType;
}

/**
 * Create a settings storage instance based on storage type
 */
export function createSettingsStorage(client?: ClientSDK): ISettingsStorage {
  const storageType = getStorageType();
  
  console.log(`📦 Creating Settings storage: ${storageType}`, { hasClient: !!client });
  
  if (storageType === 'SITECORE') {
    if (!client) {
      // Check if we're in a server context (API routes) - if so, use Supabase silently
      const isServerContext = typeof window === 'undefined';
      if (!isServerContext) {
        console.error('❌ ClientSDK is required for Sitecore storage but not provided, falling back to Supabase');
      } else {
        console.log('ℹ️ Running in server context (API route), using Supabase storage');
      }
      return new SupabaseSettingsStorage();
    }
    return new SitecoreSettingsStorage(client);
  }
  
  return new SupabaseSettingsStorage();
}

/**
 * Create a libraries storage instance based on storage type
 */
export function createLibrariesStorage(client?: ClientSDK): ILibrariesStorage {
  const storageType = getStorageType();
  
  console.log(`📦 Creating Libraries storage: ${storageType}`, { hasClient: !!client });
  
  if (storageType === 'SITECORE') {
    if (!client) {
      // Check if we're in a server context (API routes) - if so, use Supabase silently
      const isServerContext = typeof window === 'undefined';
      if (!isServerContext) {
        console.error('❌ ClientSDK is required for Sitecore storage but not provided, falling back to Supabase');
      } else {
        console.log('ℹ️ Running in server context (API route), using Supabase storage');
      }
      return new SupabaseLibrariesStorage();
    }
    return new SitecoreLibrariesStorage(client);
  }
  
  return new SupabaseLibrariesStorage();
}
