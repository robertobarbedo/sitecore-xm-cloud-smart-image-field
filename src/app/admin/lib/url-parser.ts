// Utility to parse URL parameters and derive preview host

import { SitecoreQueryParams } from '../types/library';

/**
 * Parses the URL query parameters from the parent window and current page
 * The app runs in an iframe, so tenantName is in the parent window's URL
 */
export function getAdminUrlParams(): SitecoreQueryParams {
  if (typeof window === 'undefined') {
    return {};
  }

  // Get params from current iframe URL (organizationId, marketplaceAppTenantId)
  const iframeParams = new URLSearchParams(window.location.search);
  
  // Get params from parent window URL (tenantName)
  let parentParams: URLSearchParams | null = null;
  try {
    // Try to access parent window's URL
    if (window.parent && window.parent !== window) {
      parentParams = new URLSearchParams(window.parent.location.search);
    }
  } catch (error) {
    // Cross-origin access may be blocked, fallback to iframe params
    console.warn('Cannot access parent window URL (cross-origin):', error);
  }
  
  return {
    organizationId: iframeParams.get('organizationId') || undefined,
    tenantName: parentParams?.get('tenantName') || undefined,
    marketplaceAppTenantId: iframeParams.get('marketplaceAppTenantId') || undefined,
  };
}

/**
 * Derives the preview host URL from the tenantName parameter
 * Example: canadianlif38a5-clhiaa22e-dev232a -> https://xmc-canadianlif38a5-clhiaa22e-dev232a.sitecorecloud.io/
 */
export function derivePreviewHost(tenantName?: string): string {
  if (!tenantName) {
    return 'https://';
  }

  // Check if tenantName already starts with "xmc-"
  const prefix = tenantName.startsWith('xmc-') ? '' : 'xmc-';
  
  return `https://${prefix}${tenantName}.sitecorecloud.io/`;
}

/**
 * Gets the default preview host based on URL parameters
 */
export function getDefaultPreviewHost(): string {
  const params = getAdminUrlParams();
  return derivePreviewHost(params.tenantName);
}

/**
 * Validates that a preview host URL is valid
 */
export function validatePreviewHost(url: string): boolean {
  if (!url) return false;
  
  // Must start with https://
  if (!url.startsWith('https://')) return false;
  
  // Must end with .sitecorecloud.io or .sitecorecloud.io/
  const pattern = /\.sitecorecloud\.io\/?$/;
  return pattern.test(url);
}

/**
 * Normalizes a preview host URL by ensuring it has a trailing slash
 */
export function normalizePreviewHost(url: string): string {
  if (!url) return url;
  
  // Ensure trailing slash
  return url.endsWith('/') ? url : url + '/';
}

