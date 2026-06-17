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

  it('creates processing_facility contacts with washing_station subtype', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'contact_wash',
              tenant_id: 'tenant_1',
              full_name: 'Grace Nakato',
              email: 'grace@wash.test',
              phone: null,
              organization: 'Lake Victoria Washing Station',
              contact_type: 'processing_facility',
              processing_subtype: 'washing_station',
              status: 'new',
              country: 'UG',
              tags: ['coffee'],
              consent_status: 'unknown',
              farmer_profile_id: null,
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
      full_name: 'Grace Nakato',
      email: 'grace@wash.test',
      contact_type: 'washing_station',
      country: 'UG',
    });

    expect(created.contact_type).toBe('processing_facility');
    expect(created.processing_subtype).toBe('washing_station');
  });

  it('maps contact_type check violations to actionable errors', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce({
          code: '23514',
          constraint: 'crm_contacts_contact_type_check',
          message: 'new row for relation "crm_contacts" violates check constraint "crm_contacts_contact_type_check"',
        }),
    };
    const service = makeContactsService(pool);

    await expect(
      service.create('tenant_1', {
        full_name: 'Grace Nakato',
        email: 'grace@wash.test',
        contact_type: 'processing_facility',
        processing_subtype: 'washing_station',
      }),
    ).rejects.toThrow('Apply migrations TB-V16-041 and TB-V16-047');
  });

  it('updates contact profile fields', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'contact_1',
              tenant_id: 'tenant_1',
              full_name: 'Amina Mwangi',
              email: 'amina@test.com',
              phone: null,
              organization: 'Kilimanjaro Coop',
              contact_type: 'cooperative',
              processing_subtype: null,
              status: 'new',
              country: 'TZ',
              tags: ['coffee'],
              consent_status: 'unknown',
              farmer_profile_id: null,
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
              full_name: 'Amina Mwangi Updated',
              email: 'amina@test.com',
              phone: '+255 700 000',
              organization: 'Kilimanjaro Coop',
              contact_type: 'cooperative',
              processing_subtype: null,
              status: 'new',
              country: 'TZ',
              tags: ['coffee', 'arabica'],
              consent_status: 'granted',
              farmer_profile_id: null,
              last_activity_at: null,
              created_at: '2026-04-22T10:00:00.000Z',
              updated_at: '2026-04-22T12:00:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const service = makeContactsService(pool);

    const updated = await service.update('tenant_1', 'contact_1', {
      full_name: 'Amina Mwangi Updated',
      phone: '+255 700 000',
      tags: ['coffee', 'arabica'],
      consent_status: 'granted',
    });

    expect(updated.full_name).toBe('Amina Mwangi Updated');
    expect(updated.consent_status).toBe('granted');
  });

  it('deletes a contact from the directory', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ id: 'contact_1' }] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const service = makeContactsService(pool);

    await expect(service.remove('tenant_1', 'contact_1')).resolves.toEqual({
      id: 'contact_1',
      deleted: true,
    });
  });
});

