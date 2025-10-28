// Supabase client and helper functions for image metadata

import { createClient } from '@supabase/supabase-js';

// Supabase connection details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface ImageMetadata {
  id?: string;
  organization_id: string;
  key: string;
  image_item_path: string;
  image_item_id: string;
  image_preview_path: string;
  alt_text?: string;
  description?: string;
  image_name?: string;
  image_extension?: string;
  width?: number;
  height?: number;
  size_kb?: number;
  aspect_ratio?: string;
  mime_type?: string;
  focus_x?: number;
  focus_y?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ImageSearchResult extends ImageMetadata {
  relevance: number;
}

/**
 * Extract organizationId and key from URL parameters
 */
export function getUrlParams(): { organizationId: string; key: string } | null {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  const organizationId = params.get('organizationId');
  const key = params.get('key');
  
  if (!organizationId || !key) {
    console.error('Missing organizationId or key in URL parameters');
    return null;
  }
  
  return { 
    organizationId, 
    key
  };
}

/**
 * Upsert image metadata (insert or update)
 */
export async function upsertImageMetadata(data: Omit<ImageMetadata, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data: result, error } = await supabase.rpc('upsert_image_metadata', {
      p_organization_id: data.organization_id,
      p_key: data.key,
      p_image_item_path: data.image_item_path,
      p_image_item_id: data.image_item_id,
      p_image_preview_path: data.image_preview_path,
      p_alt_text: data.alt_text || null,
      p_description: data.description || null,
      p_image_name: data.image_name || null,
      p_image_extension: data.image_extension || null,
      p_width: data.width || null,
      p_height: data.height || null,
      p_size_kb: data.size_kb || null,
      p_aspect_ratio: data.aspect_ratio || null,
      p_mime_type: data.mime_type || null,
      p_focus_x: data.focus_x || null,
      p_focus_y: data.focus_y || null,
    });

    if (error) {
      console.error('Error upserting image metadata:', error);
      throw error;
    }

    return { id: result, success: true };
  } catch (error) {
    console.error('Failed to upsert image metadata:', error);
    return { id: null, success: false, error };
  }
}

/**
 * Search images by text query using full-text search
 */
export async function searchImagesByText(
  organizationId: string,
  key: string,
  searchQuery: string,
  limit: number = 20
): Promise<ImageSearchResult[]> {
  try {
    const { data, error } = await supabase.rpc('search_images_by_text', {
      p_organization_id: organizationId,
      p_key: key,
      p_search_query: searchQuery,
      p_limit: limit,
    });

    if (error) {
      console.error('Error searching images:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to search images:', error);
    return [];
  }
}

/**
 * Get a single image by item ID
 */
export async function getImageByItemId(
  organizationId: string,
  key: string,
  imageItemId: string
): Promise<ImageMetadata | null> {
  try {
    const { data, error } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('key', key)
      .eq('image_item_id', imageItemId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      console.error('Error fetching image:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch image:', error);
    return null;
  }
}

/**
 * Get all images for an organization and key
 */
export async function getAllImages(
  organizationId: string,
  key: string,
  limit: number = 100
): Promise<ImageMetadata[]> {
  try {
    const { data, error } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('key', key)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching images:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch images:', error);
    return [];
  }
}

/**
 * Delete an image by item ID
 */
export async function deleteImage(
  organizationId: string,
  key: string,
  imageItemId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('image_metadata')
      .delete()
      .eq('organization_id', organizationId)
      .eq('key', key)
      .eq('image_item_id', imageItemId);

    if (error) {
      console.error('Error deleting image:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete image:', error);
    return false;
  }
}

/**
 * Update only alt text and description for an existing image
 */
export async function updateImageMetadata(
  organizationId: string,
  key: string,
  imageItemId: string,
  altText?: string,
  description?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('image_metadata')
      .update({
        alt_text: altText,
        description: description,
      })
      .eq('organization_id', organizationId)
      .eq('key', key)
      .eq('image_item_id', imageItemId);

    if (error) {
      console.error('Error updating image metadata:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to update image metadata:', error);
    return false;
  }
}

