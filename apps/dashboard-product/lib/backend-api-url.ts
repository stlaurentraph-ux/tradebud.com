/**
 * Builds a backend API URL whether TRACEBUD_BACKEND_URL ends with `/api` or not.
 */
export function backendApiUrl(backendBase: string, apiPath: string): string {
  const normalizedBase = backendBase.replace(/\/$/, '');
  const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  if (normalizedBase.endsWith('/api')) {
    return `${normalizedBase}${normalizedPath}`;
  }
  return `${normalizedBase}/api${normalizedPath}`;
}
