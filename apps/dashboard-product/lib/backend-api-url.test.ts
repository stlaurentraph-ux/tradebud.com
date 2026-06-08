import { describe, expect, it } from 'vitest';
import { backendApiUrl } from '@/lib/backend-api-url';

describe('backendApiUrl', () => {
  it('appends v1 paths when backend base already includes /api', () => {
    expect(backendApiUrl('https://api.tracebud.com/api', '/v1/inbox-requests')).toBe(
      'https://api.tracebud.com/api/v1/inbox-requests',
    );
  });

  it('inserts /api when backend base does not include it', () => {
    expect(backendApiUrl('https://backend.tracebud.test', '/v1/inbox-requests')).toBe(
      'https://backend.tracebud.test/api/v1/inbox-requests',
    );
  });
});
