import type { ShipmentStatus } from '@/types';
import { getShipmentStatusLabel as resolveShipmentStatusLabel } from '@/lib/status-labels';

export interface ShipmentStateStep {
  status: ShipmentStatus;
  label: string;
  color: string;
}

/** Primary happy-path states shown in the shipment detail timeline. */
export const SHIPMENT_STATE_FLOW: readonly ShipmentStateStep[] = [
  { status: 'DRAFT', label: 'Draft', color: 'bg-gray-400' },
  { status: 'READY', label: 'Ready', color: 'bg-blue-500' },
  { status: 'SEALED', label: 'Sealed', color: 'bg-purple-500' },
  { status: 'SUBMITTED', label: 'Submitted', color: 'bg-cyan-500' },
  { status: 'ACCEPTED', label: 'Accepted', color: 'bg-emerald-500' },
] as const;

export function getShipmentStateFlowSteps(role?: Parameters<typeof resolveShipmentStatusLabel>[1]): ShipmentStateStep[] {
  return SHIPMENT_STATE_FLOW.map((step) => ({
    ...step,
    label: resolveShipmentStatusLabel(step.status, role),
  }));
}

const TERMINAL_STATUSES = new Set<ShipmentStatus>(['REJECTED', 'ON_HOLD', 'ARCHIVED']);

export function getShipmentFlowIndex(status: ShipmentStatus): number {
  const primaryIndex = SHIPMENT_STATE_FLOW.findIndex((step) => step.status === status);
  if (primaryIndex >= 0) return primaryIndex;
  if (status === 'REJECTED') return SHIPMENT_STATE_FLOW.findIndex((step) => step.status === 'SUBMITTED');
  if (status === 'ON_HOLD') return SHIPMENT_STATE_FLOW.findIndex((step) => step.status === 'READY');
  if (status === 'ARCHIVED') return SHIPMENT_STATE_FLOW.length - 1;
  return 0;
}

export function isTerminalShipmentStatus(status: ShipmentStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function getShipmentStatusLabel(
  status: ShipmentStatus,
  role?: Parameters<typeof resolveShipmentStatusLabel>[1],
): string {
  return resolveShipmentStatusLabel(status, role);
}
