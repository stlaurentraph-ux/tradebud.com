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
    if (farmerId) {
      const res = await this.pool.query(
        `
          SELECT id, timestamp, user_id, device_id, event_type, payload
          FROM audit_log
          WHERE payload ->> 'farmerId' = $1
          ORDER BY timestamp DESC
          LIMIT 100
        `,
        [farmerId],
      );
      return res.rows;
    }

    const res = await this.pool.query(
      `
        SELECT id, timestamp, user_id, device_id, event_type, payload
        FROM audit_log
        ORDER BY timestamp DESC
        LIMIT 100
      `,
    );
    return res.rows;
  }
}

