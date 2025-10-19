// Folder validation utilities for library management

import { Library } from '../types/library';

/**
 * Normalizes a folder path by removing trailing slashes and converting to lowercase
 */
function normalizePath(path: string): string {
  return path.trim().toLowerCase().replace(/\/+$/, '');
}

/**
 * Checks if path1 is a parent of path2
 * Example: "/a/b" is parent of "/a/b/c"
 */
function isParentPath(path1: string, path2: string): boolean {
  const p1 = normalizePath(path1);
  const p2 = normalizePath(path2);
  
  if (p1 === p2) return false; // Same path, not parent
  
  // Check if path2 starts with path1 followed by a slash
  return p2.startsWith(p1 + '/');
}

/**
 * Checks if path1 is a child of path2
 * Example: "/a/b/c" is child of "/a/b"
 */
function isChildPath(path1: string, path2: string): boolean {
  return isParentPath(path2, path1);
}

/**
 * Checks if two paths overlap (one is parent/child of the other)
 */
function pathsOverlap(path1: string, path2: string): boolean {
  return isParentPath(path1, path2) || isChildPath(path1, path2);
}

/**
 * Validates that a folder doesn't overlap with any existing library folders
 * Returns an error message if invalid, or null if valid
 */
export function validateFolderNoOverlap(
  newFolder: string,
  existingLibraries: Library[],
  currentLibraryKey?: string // If editing, exclude current library from check
): string | null {
  const normalizedNewFolder = normalizePath(newFolder);
  
  if (!normalizedNewFolder) {
    return 'Folder path cannot be empty';
  }
  
  for (const library of existingLibraries) {
    // Skip the current library if we're editing
    if (currentLibraryKey && library.key === currentLibraryKey) {
      continue;
    }
    
    const existingFolder = normalizePath(library.folder);
    
    // Check if paths overlap
    if (pathsOverlap(normalizedNewFolder, existingFolder)) {
      // Determine the type of overlap for better error message
      if (isParentPath(normalizedNewFolder, existingFolder)) {
        return `Folder cannot be a parent of existing library "${library.name}" (${library.folder})`;
      } else if (isChildPath(normalizedNewFolder, existingFolder)) {
        return `Folder cannot be inside existing library "${library.name}" (${library.folder})`;
      }
    }
    
    // Check for exact match (shouldn't happen with keys, but just in case)
    if (normalizedNewFolder === existingFolder) {
      return `Folder is already used by library "${library.name}"`;
    }
  }
  
  return null; // Valid - no overlaps
}

/**
 * Gets all existing folders from libraries for display
 */
export function getExistingFolders(libraries: Library[]): string[] {
  return libraries.map(lib => lib.folder);
}

/**
 * Validates folder path format
 */
export function validateFolderFormat(folder: string): string | null {
  if (!folder.trim()) {
    return 'Folder path is required';
  }
  
  if (!folder.startsWith('/')) {
    return 'Folder path must start with "/"';
  }
  
  if (folder.includes('//')) {
    return 'Folder path cannot contain consecutive slashes';
  }
  
  // Check for invalid characters (basic validation)
  const invalidChars = ['<', '>', ':', '"', '|', '?', '*'];
  for (const char of invalidChars) {
    if (folder.includes(char)) {
      return `Folder path cannot contain "${char}"`;
    }
  }
  
  return null; // Valid format
}

/**
 * Full folder validation combining format and overlap checks
 */
export function validateFolder(
  folder: string,
  existingLibraries: Library[],
  currentLibraryKey?: string
): string | null {
  // First check format
  const formatError = validateFolderFormat(folder);
  if (formatError) {
    return formatError;
  }
  
  // Then check for overlaps
  const overlapError = validateFolderNoOverlap(folder, existingLibraries, currentLibraryKey);
  if (overlapError) {
    return overlapError;
  }
  
  return null; // All validations passed
}

