// Admin type definitions for Library management

export interface Library {
  key: string; // GUID without dashes or braces, e.g., 0A92FEEE0E154E81B0442AD901B88DDD
  name: string; // Default: "Main Library"
  folder: string; // Default: "/sitecore/media library/Images/Main Library"
  previewHost: string; // Default: derived from URL params, e.g., "https://xmc-canadianlif38a5-clhiaa22e-dev232a.sitecorecloud.io/"
  sitecoreItemId?: string; // The Sitecore item ID of the library folder
  sitecoreDataItemId?: string; // The Sitecore item ID of the Data item
  client_id?: string; // Sitecore Cloud environment Client ID for automation credentials
  client_secret?: string; // Sitecore Cloud environment Client Secret for automation credentials
}

export interface LibraryValidationResult {
  valid: boolean;
  errors: string[];
}

export interface SitecoreQueryParams {
  organizationId?: string;
  tenantName?: string;
  marketplaceAppTenantId?: string;
}

