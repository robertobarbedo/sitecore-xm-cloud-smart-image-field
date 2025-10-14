// lib/config.ts

export interface Config {
  baseFolder: string;
  authApiEndpoint: string;
}

/**
 * Gets configuration settings for the smart image field
 * @param organizationId - The organization identifier
 * @returns Configuration object with baseFolder path and auth endpoint
 */
export function getConfig(organizationId: string): Config {
  return {
    baseFolder: "/sitecore/media library/Default Website",
    authApiEndpoint: "/api/auth/sitecore"
  };
}