import { describe, expect, it } from 'vitest';
import { t } from './i18n';
import {
  formatShipmentLifecycleBlockers,
  getComplianceStatusLabel,
  getShipmentLifecycleCurrentPrefix,
  getShipmentLifecycleTitle,
  getShipmentRejectedMessage,
  getShipmentStatusLabel,
  getShipmentStatusLabelKey,
  getStatusChipLabel,
} from './status-labels';

describe('status-labels', () => {
  it('uses handoff language for exporter submitted status', () => {
    expect(getShipmentStatusLabel('SUBMITTED', 'exporter')).toBe('Handed off');
    expect(getShipmentStatusLabelKey('SUBMITTED', 'exporter')).toBe('status.shipment.handed_off');
  });

  it('uses TRACES language for importer submitted and accepted status', () => {
    expect(getShipmentStatusLabel('SUBMITTED', 'importer')).toBe('Submitted to TRACES');
    expect(getShipmentStatusLabel('ACCEPTED', 'importer')).toBe('TRACES accepted');
  });

  it('translates compliance labels via locale keys', () => {
    expect(getComplianceStatusLabel('BLOCKED', (key) => t(key, 'fr'))).toBe('Bloqué');
  });

  it('maps shipment chip statuses through role-aware shipment labels', () => {
    expect(getStatusChipLabel('SUBMITTED', 'exporter')).toBe('Handed off');
    expect(getStatusChipLabel('SUBMITTED', 'importer')).toBe('Submitted to TRACES');
  });

  it('uses DDS-specific labels for ready-to-submit states', () => {
    expect(getStatusChipLabel('READY_TO_SUBMIT', 'importer')).toBe('Ready for TRACES filing');
    expect(getStatusChipLabel('READY_TO_SUBMIT', 'exporter')).toBe('Ready for handoff');
  });

  it('localizes shipment lifecycle timeline copy', () => {
    expect(getShipmentLifecycleTitle('importer')).toContain('filing');
    expect(getShipmentLifecycleCurrentPrefix()).toBe('Current status:');
    expect(formatShipmentLifecycleBlockers(2)).toContain('2');
    expect(getShipmentRejectedMessage('importer')).toContain('TRACES');
  });
});
