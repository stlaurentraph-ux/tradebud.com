export const DEMO_DATA_STORAGE_KEY = 'tracebud_demo_data_enabled';
export const DEMO_DATA_CHANGED_EVENT = 'tracebud:demo-data-changed';

export function isDemoDataToggleAvailable(): boolean {
  const flag = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA_TOGGLE;
  if (flag === '0' || flag?.toLowerCase() === 'false') return false;
  if (flag === '1' || flag?.toLowerCase() === 'true') return true;
  return process.env.NODE_ENV === 'development';
}

export function readDemoDataEnabled(): boolean {
  if (typeof window === 'undefined' || !isDemoDataToggleAvailable()) return false;
  return window.sessionStorage.getItem(DEMO_DATA_STORAGE_KEY) === '1';
}

export function writeDemoDataEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  if (enabled) {
    window.sessionStorage.setItem(DEMO_DATA_STORAGE_KEY, '1');
  } else {
    window.sessionStorage.removeItem(DEMO_DATA_STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent(DEMO_DATA_CHANGED_EVENT, { detail: { enabled } }));
}
