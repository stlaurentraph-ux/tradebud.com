import { describe, expect, it } from 'vitest';
import { t } from './i18n';
import { NAV_ITEM_LABEL_KEYS, buildAppBreadcrumbs, translateNavItemName, translatePageHeader } from './nav-labels';

describe('nav-labels', () => {
  it('maps all RBAC nav names to locale keys', () => {
    expect(NAV_ITEM_LABEL_KEYS.Shipments).toBe('nav.shipments');
    expect(NAV_ITEM_LABEL_KEYS['Lots & Batches']).toBe('nav.lots_batches');
    expect(NAV_ITEM_LABEL_KEYS['DDS Packages']).toBe('nav.dds_packages');
  });

  it('translates nav labels for supported locales', () => {
    expect(translateNavItemName('Shipments', (key) => t(key, 'en'))).toBe('Shipments');
    expect(translateNavItemName('Shipments', (key) => t(key, 'fr'))).toBe('Expéditions');
    expect(translateNavItemName('Compliance', (key) => t(key, 'es'))).toBe('Cumplimiento');
  });

  it('falls back to the nav name when no key exists', () => {
    expect(translateNavItemName('Unknown Item', (key) => t(key, 'en'))).toBe('Unknown Item');
  });

  it('builds localized dashboard breadcrumbs with tail segments', () => {
    const translate = (key: string) => t(key, 'fr');
    expect(buildAppBreadcrumbs(translate, { name: 'Governance' })).toEqual([
      { label: 'Tableau de bord', href: '/' },
      { label: 'Gouvernance' },
    ]);
    expect(buildAppBreadcrumbs(translate, { name: 'Admin', href: '/admin' }, { name: 'User Management' })).toEqual([
      { label: 'Tableau de bord', href: '/' },
      { label: 'Administration', href: '/admin' },
      { label: 'User Management' },
    ]);
  });

  it('translates page headers with locale fallbacks', () => {
    const translate = (key: string) => t(key, 'de');
    expect(
      translatePageHeader(translate, 'activity', {
        title: 'Activity Feed',
        subtitle: 'Cross-workflow events',
      }),
    ).toEqual({
      title: 'Aktivitätsfeed',
      subtitle: 'Ereignisse und operative Änderungen über alle Workflows',
    });
    expect(translatePageHeader(undefined, 'unknown', { title: 'Fallback' })).toEqual({ title: 'Fallback' });
  });
});
