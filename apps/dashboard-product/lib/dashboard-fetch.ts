import { backendApiUrl } from '@/lib/backend-api-url';

export async function fetchBackendJson(path: string, authHeader: string | null): Promise<unknown> {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    throw new Error('TRACEBUD_BACKEND_URL is required for dashboard APIs.');
  }
  const response = await fetch(`${backendApiUrl(backendBase, path)}`, {
    method: 'GET',
    headers: authHeader ? { Authorization: authHeader } : undefined,
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Backend request failed (${response.status}) for ${path}`);
  }
  return response.json().catch(() => []);
}
