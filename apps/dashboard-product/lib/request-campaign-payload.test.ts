import { describe, expect, it } from 'vitest';
import {
  extractCampaignIdFromResponse,
  parseBackendErrorMessage,
  resolveCampaignDueDateIso,
} from './request-campaign-payload';

describe('request-campaign-payload', () => {
  it('defaults due date to 30 days ahead when unset', () => {
    const expected = new Date();
    expected.setDate(expected.getDate() + 30);
    expect(resolveCampaignDueDateIso(null)).toBe(expected.toISOString().slice(0, 10));
  });

  it('uses explicit due date when provided', () => {
    const due = new Date();
    due.setFullYear(2026, 11, 1);
    expect(resolveCampaignDueDateIso(due)).toBe('2026-12-01');
  });

  it('extracts campaign_id from backend create response', () => {
    expect(extractCampaignIdFromResponse({ campaign_id: 'req_123', campaign: { id: 'req_456' } })).toBe(
      'req_123',
    );
    expect(extractCampaignIdFromResponse({ campaign: { id: 'req_456' } })).toBe('req_456');
  });

  it('prefers NestJS message over generic Bad Request label', () => {
    expect(
      parseBackendErrorMessage(
        { statusCode: 400, message: 'campaign_name and due_date are required', error: 'Bad Request' },
        'Failed',
      ),
    ).toBe('campaign_name and due_date are required');
  });
});
