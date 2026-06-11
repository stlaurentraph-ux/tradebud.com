import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BillingSubscriptionBandService } from '../billing/billing-subscription-band.service';
import { ContactsService } from './contacts.service';

function createBandServiceMock(): BillingSubscriptionBandService {
  return {
    assertCanAddContacts: jest.fn().mockResolvedValue(undefined),
  } as unknown as BillingSubscriptionBandService;
}

function makeContactsService(pool: unknown): ContactsService {
  return new ContactsService(pool as any, createBandServiceMock());
}

describe('ContactsService', () => {
  it('returns actionable migration error when crm_contacts table is missing', async () => {
    const pool = {
      query: jest.fn().mockRejectedValue({ code: '42P01', message: 'relation "crm_contacts" does not exist' }),
    };
    const service = makeContactsService(pool);

    await expect(service.list('tenant_1')).rejects.toThrow(
      'Contacts tables are not available. Apply TB-V16-024 migration first.',
    );
  });

  it('creates a contact and writes immutable audit evidence', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'contact_1',
              tenant_id: 'tenant_1',
              full_name: 'Jane Doe',
              email: 'jane@example.com',
              phone: null,
              organization: 'Coop North',
              contact_type: 'cooperative',
              status: 'new',
              country: 'BR',
              tags: [],
              consent_status: 'unknown',
              last_activity_at: null,
              created_at: '2026-04-22T10:00:00.000Z',
              updated_at: '2026-04-22T10:00:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const service = makeContactsService(pool);

    const created = await service.create('tenant_1', {
      full_name: 'Jane Doe',
      email: 'Jane@Example.com',
      contact_type: 'cooperative',
      country: 'br',
    });

    expect(created).toMatchObject({
      id: 'contact_1',
      tenant_id: 'tenant_1',
      email: 'jane@example.com',
      status: 'new',
      country: 'BR',
    });
    expect(pool.query).toHaveBeenCalledTimes(3);
    expect(pool.query).toHaveBeenLastCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining(['contact_created_or_updated']),
    );
  });

  it('rejects invalid status transition', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            id: 'contact_1',
            tenant_id: 'tenant_1',
            full_name: 'Jane Doe',
            email: 'jane@example.com',
            status: 'new',
          },
        ],
      }),
    };
    const service = makeContactsService(pool);

    await expect(service.updateStatus('tenant_1', 'contact_1', 'submitted')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('updates status on valid transition and emits audit event', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'contact_1',
              tenant_id: 'tenant_1',
              full_name: 'Jane Doe',
              email: 'jane@example.com',
              phone: null,
              organization: null,
              contact_type: 'other',
              status: 'invited',
              country: null,
              tags: [],
              consent_status: 'unknown',
              last_activity_at: null,
              created_at: '2026-04-22T10:00:00.000Z',
              updated_at: '2026-04-22T10:00:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'contact_1',
              tenant_id: 'tenant_1',
              full_name: 'Jane Doe',
              email: 'jane@example.com',
              phone: null,
              organization: null,
              contact_type: 'other',
              status: 'engaged',
              country: null,
              tags: [],
              consent_status: 'unknown',
              last_activity_at: '2026-04-22T12:00:00.000Z',
              created_at: '2026-04-22T10:00:00.000Z',
              updated_at: '2026-04-22T12:00:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const service = makeContactsService(pool);

    const updated = await service.updateStatus('tenant_1', 'contact_1', 'engaged');

    expect(updated.status).toBe('engaged');
    expect(pool.query).toHaveBeenCalledTimes(3);
    expect(pool.query).toHaveBeenLastCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining(['contact_status_changed']),
    );
  });

  it('returns not found when contact is missing during status update', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };
    const service = makeContactsService(pool);

    await expect(service.updateStatus('tenant_1', 'contact_missing', 'invited')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

