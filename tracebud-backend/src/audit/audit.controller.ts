import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { CreateAuditEventDto } from './dto/create-audit-event.dto';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/audit')
export class AuditController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Post()
  @ApiOperation({
    summary: 'Append immutable audit event',
    description:
      'Field app and agents can record declaration snapshots, device metadata, and other events into the central audit_log.',
  })
  async create(@Body() dto: CreateAuditEventDto, @Req() req: any) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'farmer' && role !== 'agent' && role !== 'exporter') {
      throw new ForbiddenException('Only farmers, agents, or exporters can append audit events');
    }
    if (!dto.eventType?.trim() || typeof dto.payload !== 'object' || dto.payload === null) {
      throw new BadRequestException('eventType and payload are required');
    }
    const userId = req.user?.id as string | undefined;
    try {
      const res = await this.pool.query(
        `
          INSERT INTO audit_log (user_id, device_id, event_type, payload)
          VALUES ($1, $2, $3, $4::jsonb)
          RETURNING id, timestamp
        `,
        [
          userId ?? null,
          dto.deviceId?.trim() || null,
          dto.eventType.trim(),
          JSON.stringify(dto.payload),
        ],
      );
      return res.rows[0] ?? { ok: true };
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException('audit_log table is not available on this server');
      }
      throw e;
    }
  }

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

