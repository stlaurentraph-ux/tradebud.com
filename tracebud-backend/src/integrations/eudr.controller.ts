import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pool } from 'pg';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { AppRole } from '../auth/roles';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { PG_POOL } from '../db/db.module';
import { LaunchService } from '../launch/launch.service';

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/integrations/eudr')
export class EudrController {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly launchService: LaunchService,
  ) {}

  private readonly defaultBaseUrl = 'https://www.eudr-api.eu';
  private readonly defaultApiVersion = '2';

  private getTenantClaim(req: any): string {
    const tenantId = req?.user?.app_metadata?.tenant_id ?? req?.user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    return tenantId;
  }

  private requireRole(req: any, allowed: AppRole[], errorMessage: string) {
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (!allowed.includes(role)) {
      throw new ForbiddenException(errorMessage);
    }
    return role;
  }

  private getEudrRuntimeConfig() {
    const apiKey = process.env.EUDR_API_KEY?.trim();
    if (!apiKey) {
      throw new BadRequestException('EUDR_API_KEY is not configured');
    }

    return {
      apiKey,
      version: process.env.EUDR_API_VERSION?.trim() || this.defaultApiVersion,
      baseUrl: (process.env.EUDR_BASE_URL?.trim() || this.defaultBaseUrl).replace(/\/$/, ''),
    };
  }

  private async appendAuditEvent(
    actorUserId: string | null,
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    try {
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, device_id, event_type, payload)
          VALUES ($1, $2, $3, $4::jsonb)
        `,
        [actorUserId, 'dashboard-web', eventType, JSON.stringify(payload)],
      );
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code !== '42P01') {
        throw error;
      }
    }
  }

  private async performEudrRequest(input: {
    method: 'GET' | 'POST';
    path: string;
    query?: Record<string, string>;
    body?: unknown;
    timeoutMessage: string;
  }) {
    const { apiKey, version, baseUrl } = this.getEudrRuntimeConfig();
    const url = new URL(input.path, baseUrl);
    if (input.query) {
      for (const [key, value] of Object.entries(input.query)) {
        url.searchParams.set(key, value);
      }
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const startedAtMs = Date.now();

    try {
      const response = await fetch(url.toString(), {
        method: input.method,
        headers: {
          'x-api-key': apiKey,
          'x-api-eudr-version': version,
          ...(input.body ? { 'content-type': 'application/json' } : {}),
        },
        body: input.body ? JSON.stringify(input.body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const responseText = await response.text();
      return {
        ok: response.ok,
        status: response.status,
        responseText,
        latencyMs: Date.now() - startedAtMs,
        version,
      };
    } catch (error) {
      clearTimeout(timeout);
      const messageText =
        error instanceof Error && error.name === 'AbortError'
          ? input.timeoutMessage
          : error instanceof Error
            ? error.message
            : 'EUDR request failed';
      throw new BadGatewayException(messageText);
    }
  }

  @Get('echo')
  @ApiQuery({ name: 'message', required: false, type: String })
  @ApiOperation({
    summary: 'Check EUDR API connectivity',
    description:
      'Performs a tenant-safe server-side connectivity check against the EUDR echo endpoint using backend-managed credentials.',
  })
  async echo(@Query('message') messageRaw: string | undefined, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_compliance');
    const role = this.requireRole(req, ['exporter', 'agent'], 'Only exporters or agents can perform EUDR connectivity checks');
    const message = (messageRaw?.trim() || 'Tracebud EUDR connectivity check').slice(0, 200);
    const actorUserId = (req?.user?.id as string | undefined) ?? null;

    try {
      const requestResult = await this.performEudrRequest({
        method: 'GET',
        path: '/api/eudr/echo',
        query: { message },
        timeoutMessage: 'EUDR echo request timed out',
      });
      const capturedAt = new Date().toISOString();
      await this.appendAuditEvent(actorUserId, 'integration_eudr_echo_checked', {
        tenantId,
        actorRole: role,
        actorUserId,
        phase: requestResult.ok ? 'succeeded' : 'failed',
        provider: 'eudr_api_service',
        endpoint: '/api/eudr/echo',
        statusCode: requestResult.status,
        ok: requestResult.ok,
        latencyMs: requestResult.latencyMs,
        capturedAt,
      });

      if (!requestResult.ok) {
        throw new BadGatewayException(
          `EUDR echo request failed with status ${requestResult.status}${
            requestResult.responseText ? `: ${requestResult.responseText.slice(0, 200)}` : ''
          }`,
        );
      }

      return {
        ok: true,
        provider: 'eudr_api_service',
        endpoint: '/api/eudr/echo',
        statusCode: requestResult.status,
        version: requestResult.version,
        latencyMs: requestResult.latencyMs,
        message,
      };
    } catch (error) {
      if (
        error instanceof BadGatewayException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadGatewayException(error instanceof Error ? error.message : 'EUDR echo request failed');
    }
  }

  @Post('dds')
  @ApiOperation({
    summary: 'Submit DDS to EUDR',
    description:
      'Submits a tenant-scoped DDS payload to EUDR using backend-managed credentials and appends immutable audit telemetry for submission outcomes.',
  })
  async submitDds(
    @Body() body: { statement?: Record<string, unknown>; idempotencyKey?: string },
    @Req() req: any,
  ) {
    const tenantId = this.getTenantClaim(req);
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_compliance');
    const role = this.requireRole(req, ['exporter'], 'Only exporters can submit EUDR DDS payloads');
    const statement = body?.statement;
    const idempotencyKey = body?.idempotencyKey?.trim();

    if (!statement || typeof statement !== 'object' || Array.isArray(statement)) {
      throw new BadRequestException('statement object is required');
    }
    if (!idempotencyKey) {
      throw new BadRequestException('idempotencyKey is required');
    }

    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    const requestPayload = {
      ...statement,
      idempotencyKey,
    };

    try {
      const requestResult = await this.performEudrRequest({
        method: 'POST',
        path: '/api/eudr/dds',
        body: requestPayload,
        timeoutMessage: 'EUDR DDS submit request timed out',
      });
      const replayed = requestResult.status === 409;
      const submissionOk = requestResult.ok || replayed;
      const capturedAt = new Date().toISOString();
      await this.appendAuditEvent(actorUserId, 'integration_eudr_dds_submitted', {
        tenantId,
        actorRole: role,
        actorUserId,
        phase: requestResult.ok ? 'succeeded' : replayed ? 'replayed' : 'failed',
        provider: 'eudr_api_service',
        endpoint: '/api/eudr/dds',
        idempotencyKey,
        statusCode: requestResult.status,
        ok: submissionOk,
        replayed,
        latencyMs: requestResult.latencyMs,
        capturedAt,
      });

      if (!submissionOk) {
        throw new BadGatewayException(
          `EUDR DDS submit failed with status ${requestResult.status}${
            requestResult.responseText ? `: ${requestResult.responseText.slice(0, 200)}` : ''
          }`,
        );
      }

      return {
        ok: true,
        provider: 'eudr_api_service',
        endpoint: '/api/eudr/dds',
        idempotencyKey,
        statusCode: requestResult.status,
        version: requestResult.version,
        latencyMs: requestResult.latencyMs,
        replayed,
      };
    } catch (error) {
      if (
        error instanceof BadGatewayException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadGatewayException(error instanceof Error ? error.message : 'EUDR DDS submit failed');
    }
  }

  @Get('dds/status')
  @ApiQuery({ name: 'referenceNumber', required: true, type: String })
  @ApiOperation({
    summary: 'Read DDS status from EUDR',
    description:
      'Reads tenant-scoped DDS status from EUDR using backend-managed credentials and appends immutable audit telemetry for status checks.',
  })
  async getDdsStatus(@Query('referenceNumber') referenceNumberRaw: string | undefined, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_compliance');
    const role = this.requireRole(req, ['exporter', 'agent'], 'Only exporters or agents can read EUDR DDS status');
    const referenceNumber = referenceNumberRaw?.trim();
    if (!referenceNumber) {
      throw new BadRequestException('referenceNumber is required');
    }

    const actorUserId = (req?.user?.id as string | undefined) ?? null;

    try {
      const requestResult = await this.performEudrRequest({
        method: 'GET',
        path: '/api/eudr/dds',
        query: { referenceNumber },
        timeoutMessage: 'EUDR DDS status request timed out',
      });
      const capturedAt = new Date().toISOString();
      await this.appendAuditEvent(actorUserId, 'integration_eudr_dds_status_checked', {
        tenantId,
        actorRole: role,
        actorUserId,
        phase: requestResult.ok ? 'succeeded' : 'failed',
        provider: 'eudr_api_service',
        endpoint: '/api/eudr/dds',
        referenceNumber,
        statusCode: requestResult.status,
        ok: requestResult.ok,
        latencyMs: requestResult.latencyMs,
        capturedAt,
      });

      if (!requestResult.ok) {
        throw new BadGatewayException(
          `EUDR DDS status request failed with status ${requestResult.status}${
            requestResult.responseText ? `: ${requestResult.responseText.slice(0, 200)}` : ''
          }`,
        );
      }

      let payload: unknown = null;
      if (requestResult.responseText) {
        try {
          payload = JSON.parse(requestResult.responseText);
        } catch {
          throw new BadGatewayException('EUDR DDS status response was not valid JSON');
        }
      }

      return {
        ok: true,
        provider: 'eudr_api_service',
        endpoint: '/api/eudr/dds',
        referenceNumber,
        statusCode: requestResult.status,
        version: requestResult.version,
        latencyMs: requestResult.latencyMs,
        payload,
      };
    } catch (error) {
      if (
        error instanceof BadGatewayException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadGatewayException(error instanceof Error ? error.message : 'EUDR DDS status request failed');
    }
  }
}

