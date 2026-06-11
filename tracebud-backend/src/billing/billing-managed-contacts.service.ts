import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { MANAGED_CONTACT_ACTIVE_STATUSES } from './billing-subscription-pricing';

@Injectable()
export class BillingManagedContactsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async countManagedContacts(tenantId: string): Promise<number> {
    try {
      const result = await this.pool.query<{ count: string }>(
        `
          SELECT COUNT(*)::int AS count
          FROM crm_contacts
          WHERE tenant_id = $1
            AND status = ANY($2::text[])
        `,
        [tenantId, [...MANAGED_CONTACT_ACTIVE_STATUSES]],
      );
      return Number(result.rows[0]?.count ?? 0);
    } catch (error) {
      if ((error as { code?: string } | null)?.code === '42P01') {
        return 0;
      }
      throw error;
    }
  }
}
