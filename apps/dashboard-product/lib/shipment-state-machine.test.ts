import { describe, expect, it } from 'vitest';
import { getShipmentFlowIndex, isTerminalShipmentStatus } from './shipment-state-machine';

describe('shipment-state-machine', () => {
  it('maps primary statuses to flow index', () => {
    expect(getShipmentFlowIndex('DRAFT')).toBe(0);
    expect(getShipmentFlowIndex('READY')).toBe(1);
    expect(getShipmentFlowIndex('SEALED')).toBe(2);
    expect(getShipmentFlowIndex('SUBMITTED')).toBe(3);
    expect(getShipmentFlowIndex('ACCEPTED')).toBe(4);
  });

  it('treats hold and rejection as terminal-adjacent states', () => {
    expect(isTerminalShipmentStatus('ON_HOLD')).toBe(true);
    expect(isTerminalShipmentStatus('REJECTED')).toBe(true);
    expect(getShipmentFlowIndex('ON_HOLD')).toBe(1);
    expect(getShipmentFlowIndex('REJECTED')).toBe(3);
  });
});
