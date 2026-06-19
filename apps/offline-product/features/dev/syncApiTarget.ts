/** True when the field app targets a LAN/localhost API (Metro dev .env), not production. */
export function isLocalLanSyncApi(apiBaseUrl: string): boolean {
  const raw = apiBaseUrl.trim();
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (host.startsWith('10.')) return true;
    if (host.startsWith('192.168.')) return true;
    if (host.startsWith('172.')) return true;
    return false;
  } catch {
    return false;
  }
}

export function isProductionSyncApi(apiBaseUrl: string): boolean {
  return apiBaseUrl.trim().includes('api.tracebud.com');
}
