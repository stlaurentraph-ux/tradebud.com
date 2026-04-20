import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as submitDds } from './route';

describe('EUDR DDS submit proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('fails with 400 when statement is missing', async () => {
    const res = await submitDds(
      new Request('http://localhost/api/integrations/eudr/dds', {
        method: 'POST',
        body: JSON.stringify({ idempotencyKey: 'idem_1' }),
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'statement object is required.' });
  });

  it('fails with 400 when idempotency key is missing', async () => {
    const res = await submitDds(
      new Request('http://localhost/api/integrations/eudr/dds', {
        method: 'POST',
        body: JSON.stringify({ statement: { declarationType: 'import' } }),
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'idempotencyKey is required.' });
  });

  it('fails with 503 when backend url is not configured', async () => {
    const res = await submitDds(
      new Request('http://localhost/api/integrations/eudr/dds', {
        method: 'POST',
        body: JSON.stringify({
          statement: {
            declarationType: 'import',
            referenceNumber: 'TB-001',
            operator: { name: 'Tracebud Operator' },
            product: { commodity: 'coffee' },
          },
          idempotencyKey: 'idem_1',
        }),
      }),
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'TRACEBUD_BACKEND_URL is required for EUDR DDS submission.',
    });
  });

  it('forwards submit request to backend with auth', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, statusCode: 200 }),
    } as Response);

    const res = await submitDds(
      new Request('http://localhost/api/integrations/eudr/dds', {
        method: 'POST',
        headers: { Authorization: 'Bearer demo_token' },
        body: JSON.stringify({
          statement: {
            declarationType: 'import',
            referenceNumber: 'TB-001',
            operator: { name: 'Tracebud Operator' },
            product: { commodity: 'coffee' },
          },
          idempotencyKey: 'idem_123',
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/integrations/eudr/dds',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer demo_token',
          'content-type': 'application/json',
        }),
        body: JSON.stringify({
          statement: {
            declarationType: 'import',
            referenceNumber: 'TB-001',
            operator: { name: 'Tracebud Operator' },
            product: { commodity: 'coffee' },
          },
          idempotencyKey: 'idem_123',
        }),
      }),
    );
  });

  it('passes replayed submit payload through unchanged', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, statusCode: 409, replayed: true, idempotencyKey: 'idem_replay_1' }),
    } as Response);

    const res = await submitDds(
      new Request('http://localhost/api/integrations/eudr/dds', {
        method: 'POST',
        body: JSON.stringify({
          statement: {
            declarationType: 'import',
            referenceNumber: 'TB-001',
            operator: { name: 'Tracebud Operator' },
            product: { commodity: 'coffee' },
          },
          idempotencyKey: 'idem_replay_1',
        }),
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      statusCode: 409,
      replayed: true,
      idempotencyKey: 'idem_replay_1',
    });
  });
});

