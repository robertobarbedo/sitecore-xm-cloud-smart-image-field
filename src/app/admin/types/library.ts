// Admin type definitions for Library management

export interface Library {
  key: string; // GUID without dashes or braces, e.g., 0A92FEEE0E154E81B0442AD901B88DDD
  name: string; // Default: "Main Library"
  folder: string; // Default: "/sitecore/media library/Images/Main Library"
  sitecoreItemId?: string; // The Sitecore item ID of the library folder
  sitecoreDataItemId?: string; // The Sitecore item ID of the Data item
}

export interface Settings {
  preview_host: string; // Preview host URL, e.g., "https://xmc-canadianlif38a5-clhiaa22e-dev232a.sitecorecloud.io/"
  client_id: string; // Sitecore Cloud environment Client ID for automation credentials (required)
  client_secret: string; // Sitecore Cloud environment Client Secret for automation credentials (required)
}

export interface LibraryValidationResult {
  valid: boolean;
  errors: string[];
}

export interface SitecoreQueryParams {
  organizationId?: string;
  tenantName?: string;
}

