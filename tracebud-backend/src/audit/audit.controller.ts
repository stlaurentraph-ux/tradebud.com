import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/audit')
export class AuditController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Get()
  @ApiQuery({ name: 'farmerId', required: false })
  async list(@Query('farmerId') farmerId?: string) {
    const query = (params?: string[]) => {
      if (params) {
        return this.pool.query(
          `
            SELECT id, timestamp, user_id, device_id, event_type, payload
            FROM audit_log
            WHERE payload ->> 'farmerId' = $1
            ORDER BY timestamp DESC
            LIMIT 100
          `,
          params,
        );
      }

      return this.pool.query(
        `
          SELECT id, timestamp, user_id, device_id, event_type, payload
          FROM audit_log
          ORDER BY timestamp DESC
          LIMIT 100
        `,
      );
    };

    try {
      if (farmerId) {
        const res = await query([farmerId]);
        return res.rows;
      }

      const res = await query();
      return res.rows;
    } catch (e) {
      const err = e as { code?: string; message?: string };
      // Early in development the DB may not have the audit table yet.
      if (err?.code === '42P01') {
        return [];
      }
      throw e;
    }
  }
}

