import {
  BadRequestException,
  InternalServerErrorException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';

export type ContactStatus = 'new' | 'invited' | 'engaged' | 'submitted' | 'inactive' | 'blocked';
export type ContactType = 'exporter' | 'cooperative' | 'farmer' | 'other';

export interface ContactRecord {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  contact_type: ContactType;
  status: ContactStatus;
  country: string | null;
  tags: string[];
  consent_status: 'unknown' | 'granted' | 'revoked';
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class ContactsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private mapDatabaseError(error: unknown): never {
    const pgError = error as { code?: string; message?: string } | null;
    const message = pgError?.message ?? '';
    if (pgError?.code === '42P01' && message.includes('crm_contacts')) {
      throw new BadRequestException(
        'Contacts tables are not available. Apply TB-V16-024 migration first.',
      );
    }
    throw new InternalServerErrorException('Failed to process contacts request.');
  }

  private mapRow(row: ContactRecord): ContactRecord {
    return {
      ...row,
      last_activity_at: row.last_activity_at ? new Date(row.last_activity_at).toISOString() : null,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
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
      return result.rows.map((row) => this.mapRow(row));
    } catch (error) {
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
      contact_type?: ContactType;
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
      const result = await this.pool.query<ContactRecord>(
        `
          INSERT INTO crm_contacts (
            id, tenant_id, full_name, email, phone, organization, contact_type, status, country, tags, consent_status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'new', $8, $9::text[], $10)
          ON CONFLICT (tenant_id, email)
          DO UPDATE SET
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            organization = EXCLUDED.organization,
            contact_type = EXCLUDED.contact_type,
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
          input.contact_type ?? 'other',
          input.country?.trim().toUpperCase() || null,
          (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
          input.consent_status ?? 'unknown',
        ],
      );
      const contact = this.mapRow(result.rows[0]);
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

