// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  getCurrentLocale,
  getCurrentTimezone,
  setLocale,
  setTimezone,
  t,
} from './index';

describe('dashboard i18n', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists locale and returns translated labels', () => {
    setLocale('es');
    expect(getCurrentLocale()).toBe('es');
    expect(t('nav.settings', 'es')).toBe('Configuración');
  });

  it('merges locale overlays on top of English', () => {
    expect(t('nav.settings', 'de')).toBe('Einstellungen');
    expect(t('nav.settings', 'sw')).toBe('Mipangilio');
    expect(t('status.shipment.handed_off', 'de')).toBe('Übergeben');
    expect(t('nav.settings', 'rw')).toBe('Igenamiterere');
    expect(t('nav.settings', 'it')).toBe('Impostazioni');
    expect(t('nav.dashboard', 'vi')).toBe('Dashboard');
  });

  it('persists timezone preference', () => {
    setTimezone('Europe/Paris');
    expect(getCurrentTimezone()).toBe('Europe/Paris');
  });
});
