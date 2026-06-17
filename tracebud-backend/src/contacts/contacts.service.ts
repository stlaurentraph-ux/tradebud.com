import {
  BadRequestException,
  InternalServerErrorException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { BillingSubscriptionBandService } from '../billing/billing-subscription-band.service';
import { MANAGED_CONTACT_ACTIVE_STATUSES } from '../billing/billing-subscription-pricing';
import { PG_POOL } from '../db/db.module';

export type ContactStatus = 'new' | 'invited' | 'engaged' | 'submitted' | 'inactive' | 'blocked';
export type ContactType =
  | 'exporter'
  | 'cooperative'
  | 'farmer'
  | 'processing_facility'
  | 'trader'
  | 'other';

/** @deprecated Legacy CSV/API value — coerced to processing_facility + washing_station */
export type LegacyContactTypeInput = ContactType | 'washing_station';

export type ProcessingFacilitySubtype =
  | 'washing_station'
  | 'dry_mill'
  | 'hulling_sorting'
  | 'transformation_plant'
  | 'other';

export interface ContactRecord {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  contact_type: ContactType;
  processing_subtype: ProcessingFacilitySubtype | null;
  status: ContactStatus;
  country: string | null;
  tags: string[];
  consent_status: 'unknown' | 'granted' | 'revoked';
  farmer_profile_id: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class ContactsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly subscriptionBandService: BillingSubscriptionBandService,
  ) {}

  private mapDatabaseError(error: unknown): never {
    const pgError = error as { code?: string; message?: string; constraint?: string } | null;
    const message = pgError?.message ?? '';

    if (pgError?.code === '42P01' && message.includes('crm_contacts')) {
      throw new BadRequestException(
        'Contacts tables are not available. Apply TB-V16-024 migration first.',
      );
    }
    if (pgError?.code === '23514') {
      if (
        message.includes('contact_type') ||
        message.includes('processing_subtype') ||
        pgError.constraint?.includes('contact_type') ||
        pgError.constraint?.includes('processing_subtype')
      ) {
        throw new BadRequestException(
          'Activity type is not supported by the database. Apply migrations TB-V16-041 and TB-V16-047 (processing facility subtypes), then retry the import.',
        );
      }
      throw new BadRequestException(`Contact data failed validation: ${message}`);
    }
    if (pgError?.code === '23505') {
      throw new BadRequestException('A contact with this email already exists in your directory.');
    }

    throw new InternalServerErrorException(
      message ? `Failed to save contact: ${message}` : 'Failed to process contacts request.',
    );
  }

  private assertContactType(contactType?: LegacyContactTypeInput): ContactType {
    const allowed: ContactType[] = [
      'exporter',
      'cooperative',
      'farmer',
      'processing_facility',
      'trader',
      'other',
    ];
    if (!contactType) {
      return 'other';
    }
    if (contactType === 'washing_station') {
      return 'processing_facility';
    }
    if (!allowed.includes(contactType)) {
      throw new BadRequestException(
        `Unsupported activity type "${contactType}". Allowed values: ${allowed.join(', ')}.`,
      );
    }
    return contactType;
  }

  private assertProcessingSubtype(
    subtype?: ProcessingFacilitySubtype | null,
  ): ProcessingFacilitySubtype | null {
    if (!subtype) {
      return null;
    }
    const allowed: ProcessingFacilitySubtype[] = [
      'washing_station',
      'dry_mill',
      'hulling_sorting',
      'transformation_plant',
      'other',
    ];
    if (!allowed.includes(subtype)) {
      throw new BadRequestException(
        `Unsupported processing subtype "${subtype}". Allowed values: ${allowed.join(', ')}.`,
      );
    }
    return subtype;
  }

  private resolveContactClassification(
    contactType?: LegacyContactTypeInput,
    processingSubtype?: ProcessingFacilitySubtype | null,
  ): { contact_type: ContactType; processing_subtype: ProcessingFacilitySubtype | null } {
    if (contactType === 'washing_station') {
      return {
        contact_type: 'processing_facility',
        processing_subtype: this.assertProcessingSubtype(processingSubtype) ?? 'washing_station',
      };
    }
    const resolvedType = this.assertContactType(contactType);
    if (resolvedType === 'processing_facility') {
      return {
        contact_type: resolvedType,
        processing_subtype: this.assertProcessingSubtype(processingSubtype),
      };
    }
    if (processingSubtype) {
      throw new BadRequestException(
        'processing_subtype is only valid when contact_type is processing_facility.',
      );
    }
    return { contact_type: resolvedType, processing_subtype: null };
  }

  private mapRow(row: ContactRecord): ContactRecord {
    return {
      ...row,
      processing_subtype: row.processing_subtype ?? null,
      farmer_profile_id: row.farmer_profile_id ?? null,
      last_activity_at: row.last_activity_at ? new Date(row.last_activity_at).toISOString() : null,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  private async resolveFarmerProfileId(tenantId: string, email: string): Promise<string | null> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      return null;
    }
    try {
      const res = await this.pool.query<{ id: string }>(
        `
          SELECT fp.id
          FROM farmer_profile fp
          INNER JOIN tenant_signup_contacts tsc
            ON NULLIF(tsc.user_id, '')::uuid = fp.user_id
          WHERE tsc.tenant_id = $1
            AND lower(tsc.email) = $2
          LIMIT 1
        `,
        [tenantId, normalized],
      );
      return res.rows[0]?.id ?? null;
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return null;
      }
      throw error;
    }
  }

  private async ensureFarmerProfileLink(
    tenantId: string,
    contact: ContactRecord,
  ): Promise<ContactRecord> {
    if (contact.contact_type !== 'farmer') {
      return contact;
    }
    if (contact.farmer_profile_id) {
      return contact;
    }
    const farmerProfileId = await this.resolveFarmerProfileId(tenantId, contact.email);
    if (!farmerProfileId) {
      return contact;
    }
    try {
      const updated = await this.pool.query<ContactRecord>(
        `
          UPDATE crm_contacts
          SET farmer_profile_id = $1, updated_at = NOW()
          WHERE tenant_id = $2 AND id = $3
          RETURNING *
        `,
        [farmerProfileId, tenantId, contact.id],
      );
      return updated.rows[0] ? this.mapRow(updated.rows[0]) : { ...contact, farmer_profile_id: farmerProfileId };
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42703') {
        return { ...contact, farmer_profile_id: farmerProfileId };
      }
      throw error;
    }
  }

  private async emitAudit(eventType: string, payload: Record<string, unknown>): Promise<void> {
    await this.pool.query(
      `INSERT INTO audit_log (event_type, payload) VALUES ($1, $2::jsonb)`,
      [eventType, JSON.stringify(payload)],
    );
  }

  async list(tenantId: string): Promise<ContactRecord[]> {
    try {
      const result = await this.pool.query<ContactRecord>(
        `
          SELECT *
          FROM crm_contacts
          WHERE tenant_id = $1
          ORDER BY updated_at DESC, created_at DESC
        `,
        [tenantId],
      );
      const rows = await Promise.all(
        result.rows.map(async (row) => this.ensureFarmerProfileLink(tenantId, this.mapRow(row))),
      );
      return rows;
    } catch (error) {
      this.mapDatabaseError(error);
    }
  }

  async getById(tenantId: string, contactId: string): Promise<ContactRecord> {
    try {
      const result = await this.pool.query<ContactRecord>(
        `SELECT * FROM crm_contacts WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
        [tenantId, contactId],
      );
      const row = result.rows[0];
      if (!row) {
        throw new NotFoundException('Contact not found.');
      }
      return this.ensureFarmerProfileLink(tenantId, this.mapRow(row));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.mapDatabaseError(error);
    }
  }

  async create(
    tenantId: string,
    input: {
      full_name?: string;
      email?: string;
      phone?: string | null;
      organization?: string | null;
      contact_type?: LegacyContactTypeInput;
      processing_subtype?: ProcessingFacilitySubtype | null;
      country?: string | null;
      tags?: string[];
      consent_status?: 'unknown' | 'granted' | 'revoked';
    },
  ): Promise<ContactRecord> {
    const fullName = input.full_name?.trim();
    const email = input.email?.trim().toLowerCase();
    if (!fullName || !email) {
      throw new BadRequestException('full_name and email are required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    try {
      const existingRes = await this.pool.query<Pick<ContactRecord, 'status'>>(
        `
          SELECT status
          FROM crm_contacts
          WHERE tenant_id = $1
            AND email = $2
          LIMIT 1
        `,
        [tenantId, email],
      );
      const existingStatus = existingRes.rows[0]?.status;
      const existingCounts =
        existingStatus != null &&
        (MANAGED_CONTACT_ACTIVE_STATUSES as readonly string[]).includes(existingStatus);
      if (!existingCounts) {
        await this.subscriptionBandService.assertCanAddContacts(tenantId, 1);
      }

      const classification = this.resolveContactClassification(
        input.contact_type,
        input.processing_subtype,
      );

      const result = await this.pool.query<ContactRecord>(
        `
          INSERT INTO crm_contacts (
            id, tenant_id, full_name, email, phone, organization, contact_type, processing_subtype, status, country, tags, consent_status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new', $9, $10::text[], $11)
          ON CONFLICT (tenant_id, email)
          DO UPDATE SET
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            organization = EXCLUDED.organization,
            contact_type = EXCLUDED.contact_type,
            processing_subtype = EXCLUDED.processing_subtype,
            country = EXCLUDED.country,
            tags = EXCLUDED.tags,
            consent_status = EXCLUDED.consent_status,
            updated_at = NOW()
          RETURNING *
        `,
        [
          `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          tenantId,
          fullName,
          email,
          input.phone?.trim() || null,
          input.organization?.trim() || null,
          classification.contact_type,
          classification.processing_subtype,
          input.country?.trim().toUpperCase() || null,
          (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
          input.consent_status ?? 'unknown',
        ],
      );
      let contact = this.mapRow(result.rows[0]);
      contact = await this.ensureFarmerProfileLink(tenantId, contact);
      await this.emitAudit('contact_created_or_updated', {
        tenantId,
        contactId: contact.id,
        email: contact.email,
        status: contact.status,
      });
      return contact;
    } catch (error) {
      this.mapDatabaseError(error);
    }
  }

  async update(
    tenantId: string,
    contactId: string,
    input: {
      full_name?: string;
      email?: string;
      phone?: string | null;
      organization?: string | null;
      contact_type?: LegacyContactTypeInput;
      processing_subtype?: ProcessingFacilitySubtype | null;
      country?: string | null;
      tags?: string[];
      consent_status?: 'unknown' | 'granted' | 'revoked';
    },
  ): Promise<ContactRecord> {
    try {
      const currentRes = await this.pool.query<ContactRecord>(
        `SELECT * FROM crm_contacts WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
        [tenantId, contactId],
      );
      const current = currentRes.rows[0];
      if (!current) {
        throw new NotFoundException('Contact not found.');
      }

      const fullName = input.full_name !== undefined ? input.full_name.trim() : current.full_name;
      const email =
        input.email !== undefined ? input.email.trim().toLowerCase() : current.email.toLowerCase();
      if (!fullName) {
        throw new BadRequestException('full_name cannot be empty.');
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new BadRequestException('Invalid email format');
      }

      if (email !== current.email.toLowerCase()) {
        const duplicateRes = await this.pool.query<{ id: string }>(
          `SELECT id FROM crm_contacts WHERE tenant_id = $1 AND lower(email) = $2 AND id <> $3 LIMIT 1`,
          [tenantId, email, contactId],
        );
        if (duplicateRes.rows[0]) {
          throw new BadRequestException('A contact with this email already exists in your directory.');
        }
      }

      const contactTypeInput =
        input.contact_type !== undefined ? input.contact_type : current.contact_type;
      const processingSubtypeInput =
        input.processing_subtype !== undefined
          ? input.processing_subtype
          : current.processing_subtype;
      const classification = this.resolveContactClassification(contactTypeInput, processingSubtypeInput);

      const phone =
        input.phone !== undefined ? input.phone?.trim() || null : current.phone;
      const organization =
        input.organization !== undefined ? input.organization?.trim() || null : current.organization;
      const country =
        input.country !== undefined
          ? input.country?.trim().toUpperCase() || null
          : current.country;
      const tags =
        input.tags !== undefined
          ? input.tags.map((tag) => tag.trim()).filter(Boolean)
          : current.tags;
      const consentStatus = input.consent_status ?? current.consent_status;

      const result = await this.pool.query<ContactRecord>(
        `
          UPDATE crm_contacts
          SET
            full_name = $1,
            email = $2,
            phone = $3,
            organization = $4,
            contact_type = $5,
            processing_subtype = $6,
            country = $7,
            tags = $8::text[],
            consent_status = $9,
            updated_at = NOW()
          WHERE tenant_id = $10 AND id = $11
          RETURNING *
        `,
        [
          fullName,
          email,
          phone,
          organization,
          classification.contact_type,
          classification.processing_subtype,
          country,
          tags,
          consentStatus,
          tenantId,
          contactId,
        ],
      );
      let updated = this.mapRow(result.rows[0]);
      updated = await this.ensureFarmerProfileLink(tenantId, updated);
      await this.emitAudit('contact_updated', {
        tenantId,
        contactId: updated.id,
        email: updated.email,
      });
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.mapDatabaseError(error);
    }
  }

  async remove(tenantId: string, contactId: string): Promise<{ id: string; deleted: true }> {
    try {
      const result = await this.pool.query<{ id: string }>(
        `DELETE FROM crm_contacts WHERE tenant_id = $1 AND id = $2 RETURNING id`,
        [tenantId, contactId],
      );
      const removed = result.rows[0];
      if (!removed) {
        throw new NotFoundException('Contact not found.');
      }
      await this.emitAudit('contact_deleted', {
        tenantId,
        contactId: removed.id,
      });
      return { id: removed.id, deleted: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.mapDatabaseError(error);
    }
  }

  async updateStatus(tenantId: string, contactId: string, nextStatus: ContactStatus): Promise<ContactRecord> {
    const transitions: Record<ContactStatus, ContactStatus[]> = {
      new: ['invited', 'inactive', 'blocked'],
      invited: ['engaged', 'inactive', 'blocked'],
      engaged: ['submitted', 'inactive', 'blocked'],
      submitted: ['engaged', 'inactive', 'blocked'],
      inactive: ['engaged', 'blocked'],
      blocked: ['inactive'],
    };

    try {
      const currentRes = await this.pool.query<ContactRecord>(
        `SELECT * FROM crm_contacts WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
        [tenantId, contactId],
      );
      const current = currentRes.rows[0];
      if (!current) {
        throw new NotFoundException('Contact not found.');
      }
      if (!transitions[current.status].includes(nextStatus)) {
        throw new BadRequestException(`Invalid status transition from ${current.status} to ${nextStatus}.`);
      }

      const activatingManagedContact =
        !(MANAGED_CONTACT_ACTIVE_STATUSES as readonly string[]).includes(current.status) &&
        (MANAGED_CONTACT_ACTIVE_STATUSES as readonly string[]).includes(nextStatus);
      if (activatingManagedContact) {
        await this.subscriptionBandService.assertCanAddContacts(tenantId, 1);
      }

      const result = await this.pool.query<ContactRecord>(
        `
          UPDATE crm_contacts
          SET status = $1, updated_at = NOW(), last_activity_at = NOW()
          WHERE tenant_id = $2 AND id = $3
          RETURNING *
        `,
        [nextStatus, tenantId, contactId],
      );
      const updated = this.mapRow(result.rows[0]);
      await this.emitAudit('contact_status_changed', {
        tenantId,
        contactId,
        from: current.status,
        to: nextStatus,
      });
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.mapDatabaseError(error);
    }
  }
}

