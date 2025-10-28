// Storage abstraction types for libraries and settings

import { Library, Settings } from '@/src/app/admin/types/library';

/**
 * Storage type configuration
 */
export type StorageType = 'SUPABASE' | 'SITECORE';

/**
 * Interface for Settings storage operations
 */
export interface ISettingsStorage {
  /**
   * Get settings for an organization
   */
  getSettings(organizationId: string): Promise<Settings | null>;

  /**
   * Check if settings exist for an organization
   */
  hasSettings(organizationId: string): Promise<boolean>;

  /**
   * Save (create or update) settings for an organization
   */
  saveSettings(organizationId: string, settings: Settings): Promise<Settings>;
}

/**
 * Interface for Libraries storage operations
 */
export interface ILibrariesStorage {
  /**
   * Get all libraries for an organization (non-archived)
   */
  getLibraries(organizationId: string): Promise<Library[]>;

  /**
   * Get a single library by organization and key
   */
  getLibrary(organizationId: string, key: string): Promise<Library | null>;

  /**
   * Check if any libraries exist for an organization
   */
  hasAnyLibraries(organizationId: string): Promise<boolean>;

  /**
   * Save (create or update) a library
   */
  saveLibrary(organizationId: string, library: Library): Promise<Library>;

  /**
   * Archive (soft delete) a library
   */
  archiveLibrary(organizationId: string, library: Library): Promise<void>;
}
