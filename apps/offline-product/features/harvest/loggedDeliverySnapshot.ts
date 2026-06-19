import type { DeliveryRecipientSelection } from '@/features/harvest/DeliveryRecipientFields';

export type LoggedDeliverySnapshot = {
  /** Local SQLite receipt row id (`clientEventId` from submit). */
  receiptId?: string;
  plotId: string;
  plotName: string;
  kg: number;
  recordedAt: number;
  deliveryRecipient: DeliveryRecipientSelection | null;
  qrCodeRef: string | null;
  mode: 'synced' | 'queued';
  queuedMessageKey?: string | null;
  seasonTotalKg?: number | null;
};
