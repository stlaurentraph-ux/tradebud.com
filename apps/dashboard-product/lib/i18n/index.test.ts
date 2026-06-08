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

  it('persists timezone preference', () => {
    setTimezone('Europe/Paris');
    expect(getCurrentTimezone()).toBe('Europe/Paris');
  });
});
