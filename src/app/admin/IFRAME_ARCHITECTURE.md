# Iframe Architecture - Technical Notes

## Overview

The admin application runs in an **iframe** within the Sitecore XM Cloud Marketplace portal. This architecture requires special handling for URL parameter parsing.

## URL Structure

### Parent Window (Browser Address Bar)
```
https://xmapps.sitecorecloud.io/mkp-app/76ad59ee-756a-482f-a959-4233882a02a9?organization=org_lxSEYVnF3YpVUlEQ&tenantName=canadianlif38a5-clhiaa22e-dev232a
```

**Query Parameters:**
- `organization` - Organization identifier
- `tenantName` - Tenant name (used to derive preview host)

### Iframe (This Application)
```
http://localhost:3000/admin?organizationId=org_lxSEYVnF3YpVUlEQ&marketplaceAppTenantId=110d2bb3-9a54-4eb2-0caf-08de06908b4e
```

**Query Parameters:**
- `organizationId` - Organization identifier (passed from parent)
- `marketplaceAppTenantId` - Tenant application ID

## Cross-Window Communication

### Accessing Parent Window URL

The application needs to read `tenantName` from the parent window's URL:

```typescript
// Try to access parent window's query parameters
if (window.parent && window.parent !== window) {
  const parentParams = new URLSearchParams(window.parent.location.search);
  const tenantName = parentParams.get('tenantName');
}
```

### Cross-Origin Security

**Potential Issues:**
- If the parent window is on a different origin, browser security may block access
- `window.parent.location` access may throw a security exception

**Solution:**
```typescript
let parentParams: URLSearchParams | null = null;
try {
  if (window.parent && window.parent !== window) {
    parentParams = new URLSearchParams(window.parent.location.search);
  }
} catch (error) {
  // Cross-origin access blocked - handle gracefully
  console.warn('Cannot access parent window URL (cross-origin):', error);
}
```

### Same-Origin in Production

In production, both the parent window and iframe should be on the same domain:
- Parent: `https://xmapps.sitecorecloud.io/...`
- Iframe: `https://xmapps.sitecorecloud.io/your-app/...`

During development:
- Parent: `https://xmapps.sitecorecloud.io/...`
- Iframe: `http://localhost:3000/...` (different origin)

**Development Workaround:**
If cross-origin access fails during development, consider:
1. Passing `tenantName` as a query parameter to the iframe URL
2. Using `postMessage` for parent-child communication
3. Setting up a local proxy to avoid CORS issues

## Parameter Flow

```
┌─────────────────────────────────────────────────┐
│  Parent Window (Sitecore Marketplace)           │
│  https://xmapps.sitecorecloud.io/mkp-app/...    │
│                                                  │
│  Query Parameters:                               │
│  - organization                                  │
│  - tenantName ──────────────────┐              │
└──────────────────────────────────┼──────────────┘
                                   │
                                   │ Cross-window access
                                   │ via window.parent.location
                                   │
┌──────────────────────────────────▼──────────────┐
│  Iframe (This Application)                      │
│  http://localhost:3000/admin                    │
│                                                  │
│  Query Parameters:                               │
│  - organizationId                                │
│  - marketplaceAppTenantId                        │
│                                                  │
│  Reads from parent:                              │
│  - tenantName ─────► Preview Host derivation    │
└─────────────────────────────────────────────────┘
```

## Implementation Details

### URL Parser (`lib/url-parser.ts`)

```typescript
export function getAdminUrlParams(): SitecoreQueryParams {
  if (typeof window === 'undefined') {
    return {};
  }

  // Get params from current iframe URL
  const iframeParams = new URLSearchParams(window.location.search);
  
  // Get params from parent window URL
  let parentParams: URLSearchParams | null = null;
  try {
    if (window.parent && window.parent !== window) {
      parentParams = new URLSearchParams(window.parent.location.search);
    }
  } catch (error) {
    console.warn('Cannot access parent window URL (cross-origin):', error);
  }
  
  return {
    organizationId: iframeParams.get('organizationId') || undefined,
    tenantName: parentParams?.get('tenantName') || undefined,
    marketplaceAppTenantId: iframeParams.get('marketplaceAppTenantId') || undefined,
  };
}
```

### Preview Host Derivation

```typescript
export function derivePreviewHost(tenantName?: string): string {
  if (!tenantName) {
    return 'https://';
  }

  // Check if tenantName already starts with "xmc-"
  const prefix = tenantName.startsWith('xmc-') ? '' : 'xmc-';
  
  return `https://${prefix}${tenantName}.sitecorecloud.io/`;
}
```

## Testing

### Local Development

**Test Scenarios:**

1. **Direct Access (Not in Iframe)**
   ```
   http://localhost:3000/admin?organizationId=...&marketplaceAppTenantId=...
   ```
   - `tenantName` will be `undefined`
   - Preview Host defaults to `https://`
   - User must manually enter Preview Host

2. **In Iframe (Same Origin)**
   ```
   Parent: https://xmapps.sitecorecloud.io/mkp-app/...?tenantName=...
   Iframe: https://xmapps.sitecorecloud.io/your-app/admin?...
   ```
   - `tenantName` successfully read from parent
   - Preview Host auto-derived

3. **In Iframe (Cross Origin - Development)**
   ```
   Parent: https://xmapps.sitecorecloud.io/mkp-app/...?tenantName=...
   Iframe: http://localhost:3000/admin?...
   ```
   - May fail due to cross-origin restrictions
   - Fallback to manual entry

### Production

In production, the iframe should be on the same origin as the parent:
```
Parent: https://xmapps.sitecorecloud.io/mkp-app/...
Iframe: https://xmapps.sitecorecloud.io/your-deployed-app/admin?...
```

Cross-origin issues should not occur in production if properly configured.

## Best Practices

1. **Always Check for Parent Window**
   ```typescript
   if (window.parent && window.parent !== window) {
     // We're in an iframe
   }
   ```

2. **Use Try-Catch for Cross-Origin Access**
   ```typescript
   try {
     const parentUrl = window.parent.location.href;
   } catch (error) {
     // Handle gracefully
   }
   ```

3. **Provide Fallback Defaults**
   - If `tenantName` is not available, allow manual entry
   - Show helpful error messages to users

4. **Log Warnings, Not Errors**
   - Cross-origin access failures are expected in some scenarios
   - Use `console.warn()` instead of `console.error()`

## Alternative Approaches

If cross-origin issues persist, consider:

### Option 1: Pass tenantName to Iframe URL
Modify the parent window to pass `tenantName` to the iframe:
```
http://localhost:3000/admin?organizationId=...&marketplaceAppTenantId=...&tenantName=...
```

### Option 2: Use postMessage API
Parent sends data to iframe:
```javascript
// Parent window
iframe.contentWindow.postMessage({
  tenantName: 'canadianlif38a5-clhiaa22e-dev232a'
}, '*');

// Iframe
window.addEventListener('message', (event) => {
  if (event.data.tenantName) {
    // Use the tenantName
  }
});
```

### Option 3: Server-Side Configuration
Store tenant configuration on the server and fetch based on `organizationId`.

## Security Considerations

1. **Validate Origin**: When using `postMessage`, always validate the message origin
2. **Sanitize Input**: Never trust data from parent window without validation
3. **HTTPS Only**: Ensure both parent and iframe use HTTPS in production
4. **Content Security Policy**: Configure CSP headers to allow iframe embedding

## Troubleshooting

### Issue: tenantName is undefined
**Cause:** Cannot access parent window URL (cross-origin)

**Solutions:**
1. Ensure parent and iframe are on the same origin in production
2. Check browser console for security errors
3. Manually enter Preview Host in the form
4. Use alternative approaches listed above

### Issue: Security error in console
**Cause:** Cross-origin access attempt

**Solutions:**
1. Expected in development with localhost
2. Should not occur in production if properly deployed
3. Use try-catch to handle gracefully
4. Consider alternative communication methods

### Issue: Preview Host not auto-filling
**Cause:** tenantName not available from parent

**Debug Steps:**
1. Check if `window.parent !== window` (are we in an iframe?)
2. Log `window.parent.location.search` (check for cross-origin error)
3. Verify parent URL contains `tenantName` parameter
4. Check browser console for warnings/errors

## Conclusion

The iframe architecture requires careful handling of cross-window communication. The current implementation:
- ✅ Attempts to read from parent window
- ✅ Handles cross-origin failures gracefully
- ✅ Provides fallback behavior
- ✅ Logs warnings for debugging
- ✅ Allows manual entry when auto-detection fails

This ensures the application works in both development and production environments.

