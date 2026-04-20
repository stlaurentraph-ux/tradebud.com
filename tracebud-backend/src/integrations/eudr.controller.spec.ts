import { BadGatewayException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EudrController } from './eudr.controller';

describe('EudrController', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.EUDR_API_KEY = 'test_key';
    process.env.EUDR_API_VERSION = '2';
    process.env.EUDR_BASE_URL = 'https://www.eudr-api.eu';
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('rejects missing tenant claim', async () => {
    const controller = new EudrController({ query: jest.fn() } as any);
    await expect(controller.echo(undefined, { user: { email: 'exporter+ops@tracebud.com' } })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects farmer role for connectivity checks', async () => {
    const controller = new EudrController({ query: jest.fn() } as any);
    await expect(
      controller.echo(undefined, {
        user: {
          id: 'user_1',
          email: 'farmer@example.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      }),
    ).rejects.toThrow('Only exporters or agents can perform EUDR connectivity checks');
  });

  it('rejects when EUDR API key is not configured', async () => {
    delete process.env.EUDR_API_KEY;
    const controller = new EudrController({ query: jest.fn() } as any);
    await expect(
      controller.echo(undefined, {
        user: {
          id: 'user_1',
          email: 'exporter+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns provider health result and logs audit event', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('ok'),
    } as any);

    const controller = new EudrController(pool as any);
    const result = await controller.echo('health-check', {
      user: {
        id: 'user_1',
        email: 'exporter+ops@tracebud.com',
        app_metadata: { tenant_id: 'tenant_1' },
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        provider: 'eudr_api_service',
        endpoint: '/api/eudr/echo',
        statusCode: 200,
        version: '2',
        message: 'health-check',
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/eudr/echo?message=health-check'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'x-api-key': 'test_key',
          'x-api-eudr-version': '2',
        }),
      }),
    );
    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['user_1', 'dashboard-web', 'integration_eudr_echo_checked']),
    );
  });

  it('throws bad gateway for non-2xx responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: jest.fn().mockResolvedValue('forbidden'),
    } as any);
    const controller = new EudrController({ query: jest.fn().mockResolvedValue({ rows: [] }) } as any);

    await expect(
      controller.echo(undefined, {
        user: {
          id: 'user_1',
          email: 'agent+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      }),
    ).rejects.toThrow(BadGatewayException);
  });

  it('rejects DDS submit for non-exporter role', async () => {
    const controller = new EudrController({ query: jest.fn() } as any);
    await expect(
      controller.submitDds(
        { statement: { foo: 'bar' }, idempotencyKey: 'idem_1' },
        {
          user: {
            id: 'user_1',
            email: 'agent+ops@tracebud.com',
            app_metadata: { tenant_id: 'tenant_1' },
          },
        },
      ),
    ).rejects.toThrow('Only exporters can submit EUDR DDS payloads');
  });

  it('rejects DDS submit when idempotency key is missing', async () => {
    const controller = new EudrController({ query: jest.fn() } as any);
    await expect(
      controller.submitDds(
        { statement: { foo: 'bar' } },
        {
          user: {
            id: 'user_1',
            email: 'exporter+ops@tracebud.com',
            app_metadata: { tenant_id: 'tenant_1' },
          },
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('submits DDS and logs audit evidence', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('ok'),
    } as any);
    const controller = new EudrController(pool as any);

    const result = await controller.submitDds(
      {
        statement: { declarationType: 'import', referenceNumber: 'TB-REF-001' },
        idempotencyKey: 'idem_123',
      },
      {
        user: {
          id: 'user_1',
          email: 'exporter+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      },
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        provider: 'eudr_api_service',
        endpoint: '/api/eudr/dds',
        idempotencyKey: 'idem_123',
        statusCode: 200,
        version: '2',
        replayed: false,
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/eudr/dds'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'test_key',
          'x-api-eudr-version': '2',
          'content-type': 'application/json',
        }),
        body: expect.stringContaining('"idempotencyKey":"idem_123"'),
      }),
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['user_1', 'dashboard-web', 'integration_eudr_dds_submitted']),
    );
  });

  it('treats 409 DDS submit responses as idempotent replay success', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      text: jest.fn().mockResolvedValue('duplicate idempotency key'),
    } as any);
    const controller = new EudrController(pool as any);

    const result = await controller.submitDds(
      {
        statement: { declarationType: 'import', referenceNumber: 'TB-REF-009' },
        idempotencyKey: 'idem_replay_1',
      },
      {
        user: {
          id: 'user_1',
          email: 'exporter+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      },
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        statusCode: 409,
        idempotencyKey: 'idem_replay_1',
        replayed: true,
      }),
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['user_1', 'dashboard-web', 'integration_eudr_dds_submitted']),
    );
    expect(pool.query.mock.calls[0][1][3]).toContain('"phase":"replayed"');
    expect(pool.query.mock.calls[0][1][3]).toContain('"replayed":true');
  });

  it('maps non-2xx DDS submit responses to bad gateway', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('provider error'),
    } as any);
    const controller = new EudrController({ query: jest.fn().mockResolvedValue({ rows: [] }) } as any);

    await expect(
      controller.submitDds(
        {
          statement: { declarationType: 'import', referenceNumber: 'TB-REF-002' },
          idempotencyKey: 'idem_456',
        },
        {
          user: {
            id: 'user_1',
            email: 'exporter+ops@tracebud.com',
            app_metadata: { tenant_id: 'tenant_1' },
          },
        },
      ),
    ).rejects.toThrow(BadGatewayException);
  });

  it('rejects DDS status read for non-exporter/agent roles', async () => {
    const controller = new EudrController({ query: jest.fn() } as any);
    await expect(
      controller.getDdsStatus('TB-REF-001', {
        user: {
          id: 'user_1',
          email: 'farmer@example.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      }),
    ).rejects.toThrow('Only exporters or agents can read EUDR DDS status');
  });

  it('rejects DDS status read when reference number is missing', async () => {
    const controller = new EudrController({ query: jest.fn() } as any);
    await expect(
      controller.getDdsStatus(undefined, {
        user: {
          id: 'user_1',
          email: 'agent+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('reads DDS status and logs audit event', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('{"status":"accepted"}'),
    } as any);
    const controller = new EudrController(pool as any);

    const result = await controller.getDdsStatus('TB-REF-STATUS-001', {
      user: {
        id: 'user_1',
        email: 'agent+ops@tracebud.com',
        app_metadata: { tenant_id: 'tenant_1' },
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        provider: 'eudr_api_service',
        endpoint: '/api/eudr/dds',
        referenceNumber: 'TB-REF-STATUS-001',
        statusCode: 200,
        payload: { status: 'accepted' },
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/eudr/dds?referenceNumber=TB-REF-STATUS-001'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'x-api-key': 'test_key',
          'x-api-eudr-version': '2',
        }),
      }),
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['user_1', 'dashboard-web', 'integration_eudr_dds_status_checked']),
    );
  });

  it('maps non-2xx DDS status responses to bad gateway', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('provider error'),
    } as any);
    const controller = new EudrController({ query: jest.fn().mockResolvedValue({ rows: [] }) } as any);

    await expect(
      controller.getDdsStatus('TB-REF-STATUS-002', {
        user: {
          id: 'user_1',
          email: 'exporter+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      }),
    ).rejects.toThrow(BadGatewayException);
  });

  it('maps malformed JSON DDS status payloads to bad gateway with deterministic message', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('not-json'),
    } as any);
    const controller = new EudrController({ query: jest.fn().mockResolvedValue({ rows: [] }) } as any);

    await expect(
      controller.getDdsStatus('TB-REF-STATUS-003', {
        user: {
          id: 'user_1',
          email: 'exporter+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      }),
    ).rejects.toThrow('EUDR DDS status response was not valid JSON');
  });
});

