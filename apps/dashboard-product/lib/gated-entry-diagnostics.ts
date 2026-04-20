import type { GatedEntryEvent, UseGatedEntryOptions } from './use-gated-entry';

export type DiagnosticsPresetId = 'latest_blocks' | 'weekly_volume' | 'campaign_focus' | 'reporting_focus';

export interface DiagnosticsPreset {
  id: DiagnosticsPresetId;
  label: string;
  options: Required<Pick<UseGatedEntryOptions, 'gate' | 'fromHours' | 'sort'>>;
}

export const DIAGNOSTICS_PRESETS: readonly DiagnosticsPreset[] = [
  {
    id: 'latest_blocks',
    label: 'Latest blocks (24h)',
    options: { gate: 'all', fromHours: 24, sort: 'desc' },
  },
  {
    id: 'weekly_volume',
    label: 'Weekly volume',
    options: { gate: 'all', fromHours: 24 * 7, sort: 'desc' },
  },
  {
    id: 'campaign_focus',
    label: 'Campaigns oldest first',
    options: { gate: 'request_campaigns', fromHours: 24 * 7, sort: 'asc' },
  },
  {
    id: 'reporting_focus',
    label: 'Reporting oldest first',
    options: { gate: 'annual_reporting', fromHours: 24 * 7, sort: 'asc' },
  },
] as const;

function escapeCsvCell(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildTelemetryCsv(events: GatedEntryEvent[]): string {
  const header = ['captured_at', 'gate', 'role', 'feature', 'redirected_path'];
  const rows = events.map((event) => {
    const capturedAt = event.timestamp ? new Date(event.timestamp).toISOString() : '';
    return [
      capturedAt,
      event.payload.gate ?? '',
      event.payload.role ?? '',
      event.payload.feature ?? '',
      event.payload.redirectedPath ?? '/',
    ]
      .map((cell) => escapeCsvCell(cell))
      .join(',');
  });

  return [header.join(','), ...rows].join('\n');
}
