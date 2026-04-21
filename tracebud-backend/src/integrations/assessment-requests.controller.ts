import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pool } from 'pg';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { PG_POOL } from '../db/db.module';

type AssessmentPathway = 'annuals' | 'rice';
type AssessmentRequestStatus =
  | 'sent'
  | 'opened'
  | 'in_progress'
  | 'submitted'
  | 'reviewed'
  | 'needs_changes'
  | 'cancelled';

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/integrations/assessments/requests')
export class AssessmentRequestsController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private readonly statuses: AssessmentRequestStatus[] = [
    'sent',
    'opened',
    'in_progress',
    'submitted',
    'reviewed',
    'needs_changes',
    'cancelled',
  ];

  private getTenantClaim(req: any): string {
    const tenantId = req?.user?.app_metadata?.tenant_id ?? req?.user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    return tenantId;
  }

  private ensureCanManage(req: any) {
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role !== 'exporter' && role !== 'admin' && role !== 'compliance_manager') {
      throw new ForbiddenException('Only exporter, admin, or compliance manager can manage assessment requests');
    }
  }

  private ensureCanView(req: any) {
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role === 'farmer' || role === 'agent' || role === 'exporter' || role === 'admin' || role === 'compliance_manager') {
      return role;
    }
    throw new ForbiddenException('Role not permitted to view assessment requests');
  }

  private async assertQuestionnaireSubmissionReady(params: {
    tenantId: string;
    requestId: string;
    farmerUserId: string | null;
  }): Promise<void> {
    const res = await this.pool.query<{ questionnaire_status: string | null }>(
      `
        SELECT q.status AS questionnaire_status
        FROM integration_assessment_requests r
        LEFT JOIN integration_questionnaire_v2 q
          ON q.id = r.questionnaire_id
         AND q.tenant_id = r.tenant_id
        WHERE r.id = $1::uuid
          AND r.tenant_id = $2
          AND r.farmer_user_id = $3::uuid
        LIMIT 1
      `,
      [params.requestId, params.tenantId, params.farmerUserId],
    );
    if ((res.rowCount ?? 0) === 0) {
      throw new BadRequestException('Assessment request not found or not submittable');
    }
    const questionnaireStatus = res.rows[0].questionnaire_status;
    if (!questionnaireStatus) {
      throw new BadRequestException(
        'Assessment request is not linked to a questionnaire draft. Link questionnaire_id first.',
      );
    }
    if (!['submitted', 'validated', 'scored', 'reviewed'].includes(questionnaireStatus)) {
      throw new BadRequestException(
        'Linked questionnaire draft must be submitted before assessment request can be submitted.',
      );
    }
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update assessment request status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status?: AssessmentRequestStatus },
    @Req() req: any,
  ) {
    const tenantId = this.getTenantClaim(req);
    this.ensureCanManage(req);
    const status = body?.status;
    if (!status || !this.statuses.includes(status)) {
      throw new BadRequestException(`status must be one of: ${this.statuses.join(', ')}`);
    }
    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    try {
      const res = await this.pool.query<{ id: string; status: string }>(
        `
          UPDATE integration_assessment_requests
          SET status = $2, updated_at = NOW()
          WHERE id = $1::uuid
            AND tenant_id = $3
          RETURNING id, status
        `,
        [id, status, tenantId],
      );
      if ((res.rowCount ?? 0) === 0) {
        throw new BadRequestException('Assessment request not found');
      }
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, device_id, event_type, payload)
          VALUES ($1, $2, $3, $4::jsonb)
        `,
        [
          actorUserId,
          'dashboard-web',
          'integration_assessment_request_status_updated',
          JSON.stringify({ tenantId, requestId: id, status }),
        ],
      );
      return { id: res.rows[0].id, status: res.rows[0].status };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'Assessment request tables are not available. Apply TB-V16-021 and TB-V16-022 migrations first.',
        );
      }
      throw error;
    }
  }

  @Get()
  @ApiQuery({ name: 'assignedToMe', required: false, type: Boolean })
  @ApiOperation({ summary: 'List assessment requests' })
  async list(@Query('assignedToMe') assignedToMeRaw: string | undefined, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    const role = this.ensureCanView(req);
    const assignedToMe = assignedToMeRaw === 'true';
    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    try {
      if (assignedToMe || role === 'farmer') {
        const rows = await this.pool.query(
          `
            SELECT id, pathway, farmer_user_id, questionnaire_id, status, title, instructions, due_at, metadata, created_at, updated_at
            FROM integration_assessment_requests
            WHERE tenant_id = $1
              AND farmer_user_id = $2::uuid
            ORDER BY updated_at DESC
          `,
          [tenantId, actorUserId],
        );
        return { items: rows.rows };
      }

      const rows = await this.pool.query(
        `
          SELECT id, pathway, farmer_user_id, questionnaire_id, status, title, instructions, due_at, metadata, created_at, updated_at
          FROM integration_assessment_requests
          WHERE tenant_id = $1
          ORDER BY updated_at DESC
        `,
        [tenantId],
      );
      return { items: rows.rows };
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'Assessment request table is not available. Apply TB-V16-019 migration first.',
        );
      }
      throw error;
    }
  }

  @Patch(':id/opened')
  @ApiOperation({ summary: 'Mark request as opened by farmer' })
  async markOpened(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    const role = this.ensureCanView(req);
    if (role !== 'farmer' && role !== 'agent') {
      throw new ForbiddenException('Only farmer or agent can mark request as opened');
    }
    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    try {
      const res = await this.pool.query<{ id: string; status: string }>(
        `
          UPDATE integration_assessment_requests
          SET status = CASE WHEN status = 'sent' THEN 'opened' ELSE status END,
              updated_at = NOW()
          WHERE id = $1::uuid
            AND tenant_id = $2
            AND farmer_user_id = $3::uuid
          RETURNING id, status
        `,
        [id, tenantId, actorUserId],
      );
      if ((res.rowCount ?? 0) === 0) {
        throw new BadRequestException('Assessment request not found');
      }
      return { id: res.rows[0].id, status: res.rows[0].status };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'Assessment request table is not available. Apply TB-V16-019 migration first.',
        );
      }
      throw error;
    }
  }

  @Patch(':id/submitted')
  @ApiOperation({ summary: 'Mark request as submitted by farmer' })
  async markSubmitted(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    const role = this.ensureCanView(req);
    if (role !== 'farmer' && role !== 'agent') {
      throw new ForbiddenException('Only farmer or agent can submit assessment request');
    }
    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    try {
      await this.assertQuestionnaireSubmissionReady({
        tenantId,
        requestId: id,
        farmerUserId: actorUserId,
      });
      const res = await this.pool.query<{ id: string; status: string }>(
        `
          UPDATE integration_assessment_requests
          SET status = 'submitted',
              updated_at = NOW()
          WHERE id = $1::uuid
            AND tenant_id = $2
            AND farmer_user_id = $3::uuid
            AND status IN ('opened', 'in_progress', 'needs_changes')
          RETURNING id, status
        `,
        [id, tenantId, actorUserId],
      );
      if ((res.rowCount ?? 0) === 0) {
        throw new BadRequestException('Assessment request not found or not submittable');
      }
      return { id: res.rows[0].id, status: res.rows[0].status };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'Assessment request table is not available. Apply TB-V16-019 migration first.',
        );
      }
      throw error;
    }
  }

  @Patch(':id/in-progress')
  @ApiOperation({ summary: 'Mark request as in progress by farmer' })
  async markInProgress(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    const role = this.ensureCanView(req);
    if (role !== 'farmer' && role !== 'agent') {
      throw new ForbiddenException('Only farmer or agent can move request in progress');
    }
    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    try {
      const res = await this.pool.query<{ id: string; status: string }>(
        `
          UPDATE integration_assessment_requests
          SET status = 'in_progress',
              updated_at = NOW()
          WHERE id = $1::uuid
            AND tenant_id = $2
            AND farmer_user_id = $3::uuid
            AND status IN ('opened', 'needs_changes')
          RETURNING id, status
        `,
        [id, tenantId, actorUserId],
      );
      if ((res.rowCount ?? 0) === 0) {
        throw new BadRequestException('Assessment request not found or not transitionable');
      }
      return { id: res.rows[0].id, status: res.rows[0].status };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'Assessment request table is not available. Apply TB-V16-019 migration first.',
        );
      }
      throw error;
    }
  }

  @Patch(':id/reviewed')
  @ApiOperation({ summary: 'Mark request as reviewed in dashboard' })
  async markReviewed(@Param('id') id: string, @Req() req: any) {
    return this.updateStatus(id, { status: 'reviewed' }, req);
  }

  @Patch(':id/needs-changes')
  @ApiOperation({ summary: 'Mark request as needs changes in dashboard' })
  async markNeedsChanges(@Param('id') id: string, @Req() req: any) {
    return this.updateStatus(id, { status: 'needs_changes' }, req);
  }

  @Patch(':id/cancelled')
  @ApiOperation({ summary: 'Cancel request in dashboard' })
  async markCancelled(@Param('id') id: string, @Req() req: any) {
    return this.updateStatus(id, { status: 'cancelled' }, req);
  }

  @Patch(':id/sent')
  @ApiOperation({ summary: 'Reset request to sent in dashboard' })
  async markSent(@Param('id') id: string, @Req() req: any) {
    return this.updateStatus(id, { status: 'sent' }, req);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assessment request by id' })
  async getById(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    const role = this.ensureCanView(req);
    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    try {
      const res = await this.pool.query(
        `
          SELECT id, pathway, farmer_user_id, questionnaire_id, status, title, instructions, due_at, metadata, created_at, updated_at
          FROM integration_assessment_requests
          WHERE id = $1::uuid
            AND tenant_id = $2
          LIMIT 1
        `,
        [id, tenantId],
      );
      if ((res.rowCount ?? 0) === 0) {
        throw new BadRequestException('Assessment request not found');
      }
      const row = res.rows[0];
      if (role === 'farmer' && row.farmer_user_id !== actorUserId) {
        throw new ForbiddenException('Farmer cannot access another farmer assessment request');
      }
      return row;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'Assessment request table is not available. Apply TB-V16-019 migration first.',
        );
      }
      throw error;
    }
  }

  @Patch(':id/title')
  @ApiOperation({ summary: 'Update title/instructions for request' })
  async updateMeta(
    @Param('id') id: string,
    @Body() body: { title?: string; instructions?: string; dueAt?: string | null },
    @Req() req: any,
  ) {
    const tenantId = this.getTenantClaim(req);
    this.ensureCanManage(req);
    const title = (body?.title ?? '').trim();
    const instructions = (body?.instructions ?? '').trim();
    if (!title) {
      throw new BadRequestException('title is required');
    }
    const dueAt = body?.dueAt?.trim() || null;
    try {
      const res = await this.pool.query<{ id: string }>(
        `
          UPDATE integration_assessment_requests
          SET title = $2, instructions = $3, due_at = NULLIF($4, '')::timestamptz, updated_at = NOW()
          WHERE id = $1::uuid
            AND tenant_id = $5
          RETURNING id
        `,
        [id, title, instructions, dueAt, tenantId],
      );
      if ((res.rowCount ?? 0) === 0) {
        throw new BadRequestException('Assessment request not found');
      }
      return { id: res.rows[0].id, title, instructions, dueAt };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'Assessment request table is not available. Apply TB-V16-019 migration first.',
        );
      }
      throw error;
    }
  }

  @Patch(':id/farmer')
  @ApiOperation({ summary: 'Reassign farmer for request' })
  async reassignFarmer(@Param('id') id: string, @Body() body: { farmerUserId?: string }, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    this.ensureCanManage(req);
    const farmerUserId = (body?.farmerUserId ?? '').trim();
    if (!farmerUserId) {
      throw new BadRequestException('farmerUserId is required');
    }
    try {
      const res = await this.pool.query<{ id: string }>(
        `
          UPDATE integration_assessment_requests
          SET farmer_user_id = $2::uuid, updated_at = NOW()
          WHERE id = $1::uuid
            AND tenant_id = $3
          RETURNING id
        `,
        [id, farmerUserId, tenantId],
      );
      if ((res.rowCount ?? 0) === 0) {
        throw new BadRequestException('Assessment request not found');
      }
      return { id: res.rows[0].id, farmerUserId };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'Assessment request table is not available. Apply TB-V16-019 migration first.',
        );
      }
      throw error;
    }
  }

  @Patch(':id/pathway')
  @ApiOperation({ summary: 'Update pathway for request' })
  async updatePathway(@Param('id') id: string, @Body() body: { pathway?: AssessmentPathway }, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    this.ensureCanManage(req);
    const pathway = body?.pathway === 'rice' ? 'rice' : body?.pathway === 'annuals' ? 'annuals' : null;
    if (!pathway) {
      throw new BadRequestException('pathway must be annuals or rice');
    }
    try {
      const res = await this.pool.query<{ id: string }>(
        `
          UPDATE integration_assessment_requests
          SET pathway = $2, updated_at = NOW()
          WHERE id = $1::uuid
            AND tenant_id = $3
          RETURNING id
        `,
        [id, pathway, tenantId],
      );
      if ((res.rowCount ?? 0) === 0) {
        throw new BadRequestException('Assessment request not found');
      }
      return { id: res.rows[0].id, pathway };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'Assessment request table is not available. Apply TB-V16-019 migration first.',
        );
      }
      throw error;
    }
  }

  @Patch(':id/metadata')
  @ApiOperation({ summary: 'Update metadata for request' })
  async updateMetadata(
    @Param('id') id: string,
    @Body() body: { metadata?: Record<string, unknown> },
    @Req() req: any,
  ) {
    const tenantId = this.getTenantClaim(req);
    this.ensureCanManage(req);
    const metadata = body?.metadata ?? {};
    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      throw new BadRequestException('metadata must be an object');
    }
    try {
      const res = await this.pool.query<{ id: string }>(
        `
          UPDATE integration_assessment_requests
          SET metadata = $2::jsonb, updated_at = NOW()
          WHERE id = $1::uuid
            AND tenant_id = $3
          RETURNING id
        `,
        [id, JSON.stringify(metadata), tenantId],
      );
      if ((res.rowCount ?? 0) === 0) {
        throw new BadRequestException('Assessment request not found');
      }
      return { id: res.rows[0].id, metadata };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'Assessment request table is not available. Apply TB-V16-019 migration first.',
        );
      }
      throw error;
    }
  }

  @Patch(':id/touch')
  @ApiOperation({ summary: 'Touch request updated timestamp' })
  async touch(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    this.ensureCanView(req);
    try {
      const res = await this.pool.query<{ id: string }>(
        `
          UPDATE integration_assessment_requests
          SET updated_at = NOW()
          WHERE id = $1::uuid
            AND tenant_id = $2
          RETURNING id
        `,
        [id, tenantId],
      );
      if ((res.rowCount ?? 0) === 0) {
        throw new BadRequestException('Assessment request not found');
      }
      return { id: res.rows[0].id, touched: true };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'Assessment request table is not available. Apply TB-V16-019 migration first.',
        );
      }
      throw error;
    }
  }

  @Patch(':id/reopen')
  @ApiOperation({ summary: 'Reopen request for farmer work' })
  async reopen(@Param('id') id: string, @Req() req: any) {
    return this.updateStatus(id, { status: 'needs_changes' }, req);
  }

  @Patch(':id/review')
  @ApiOperation({ summary: 'Mark review done' })
  async review(@Param('id') id: string, @Req() req: any) {
    return this.updateStatus(id, { status: 'reviewed' }, req);
  }

  @Patch(':id/send')
  @ApiOperation({ summary: 'Send request again' })
  async resend(@Param('id') id: string, @Req() req: any) {
    return this.updateStatus(id, { status: 'sent' }, req);
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: 'Mark in progress (alias)' })
  async progress(@Param('id') id: string, @Req() req: any) {
    return this.markInProgress(id, req);
  }

  @Patch(':id/open')
  @ApiOperation({ summary: 'Mark opened (alias)' })
  async open(@Param('id') id: string, @Req() req: any) {
    return this.markOpened(id, req);
  }

  @Patch(':id/submit')
  @ApiOperation({ summary: 'Mark submitted (alias)' })
  async submit(@Param('id') id: string, @Req() req: any) {
    return this.markSubmitted(id, req);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Mark cancelled (alias)' })
  async cancel(@Param('id') id: string, @Req() req: any) {
    return this.markCancelled(id, req);
  }

  @Patch(':id/changes')
  @ApiOperation({ summary: 'Mark needs changes (alias)' })
  async changes(@Param('id') id: string, @Req() req: any) {
    return this.markNeedsChanges(id, req);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Mark reviewed (alias)' })
  async approve(@Param('id') id: string, @Req() req: any) {
    return this.markReviewed(id, req);
  }

  @Patch(':id/reset')
  @ApiOperation({ summary: 'Reset to sent (alias)' })
  async reset(@Param('id') id: string, @Req() req: any) {
    return this.markSent(id, req);
  }

  @Patch(':id/reassign')
  @ApiOperation({ summary: 'Reassign farmer (alias)' })
  async reassign(@Param('id') id: string, @Body() body: { farmerUserId?: string }, @Req() req: any) {
    return this.reassignFarmer(id, body, req);
  }

  @Patch(':id/meta')
  @ApiOperation({ summary: 'Update metadata (alias)' })
  async meta(@Param('id') id: string, @Body() body: { metadata?: Record<string, unknown> }, @Req() req: any) {
    return this.updateMetadata(id, body, req);
  }

  @Patch(':id/path')
  @ApiOperation({ summary: 'Update pathway (alias)' })
  async path(@Param('id') id: string, @Body() body: { pathway?: AssessmentPathway }, @Req() req: any) {
    return this.updatePathway(id, body, req);
  }

  @Patch(':id/details')
  @ApiOperation({ summary: 'Update title/instructions (alias)' })
  async details(
    @Param('id') id: string,
    @Body() body: { title?: string; instructions?: string; dueAt?: string | null },
    @Req() req: any,
  ) {
    return this.updateMeta(id, body, req);
  }

  @Patch(':id/refresh')
  @ApiOperation({ summary: 'Touch updated timestamp (alias)' })
  async refresh(@Param('id') id: string, @Req() req: any) {
    return this.touch(id, req);
  }

  @Patch(':id/reopen-for-farmer')
  @ApiOperation({ summary: 'Reopen for farmer (alias)' })
  async reopenForFarmer(@Param('id') id: string, @Req() req: any) {
    return this.reopen(id, req);
  }

  @Patch(':id/review-complete')
  @ApiOperation({ summary: 'Mark review complete (alias)' })
  async reviewComplete(@Param('id') id: string, @Req() req: any) {
    return this.review(id, req);
  }

  @Patch(':id/send-again')
  @ApiOperation({ summary: 'Send again (alias)' })
  async sendAgain(@Param('id') id: string, @Req() req: any) {
    return this.resend(id, req);
  }

  @Patch(':id/work')
  @ApiOperation({ summary: 'Mark in progress (alias2)' })
  async work(@Param('id') id: string, @Req() req: any) {
    return this.progress(id, req);
  }

  @Patch(':id/viewed')
  @ApiOperation({ summary: 'Mark opened (alias2)' })
  async viewed(@Param('id') id: string, @Req() req: any) {
    return this.open(id, req);
  }

  @Patch(':id/finalize')
  @ApiOperation({ summary: 'Mark submitted (alias2)' })
  async finalize(@Param('id') id: string, @Req() req: any) {
    return this.submit(id, req);
  }

  @Patch(':id/abort')
  @ApiOperation({ summary: 'Mark cancelled (alias2)' })
  async abort(@Param('id') id: string, @Req() req: any) {
    return this.cancel(id, req);
  }

  @Patch(':id/request-changes')
  @ApiOperation({ summary: 'Mark needs changes (alias2)' })
  async requestChanges(@Param('id') id: string, @Req() req: any) {
    return this.changes(id, req);
  }

  @Patch(':id/approve-review')
  @ApiOperation({ summary: 'Mark reviewed (alias2)' })
  async approveReview(@Param('id') id: string, @Req() req: any) {
    return this.approve(id, req);
  }

  @Patch(':id/restart')
  @ApiOperation({ summary: 'Reset to sent (alias2)' })
  async restart(@Param('id') id: string, @Req() req: any) {
    return this.reset(id, req);
  }

  @Patch(':id/reassign-farmer')
  @ApiOperation({ summary: 'Reassign farmer (alias2)' })
  async reassignFarmerAlias(@Param('id') id: string, @Body() body: { farmerUserId?: string }, @Req() req: any) {
    return this.reassign(id, body, req);
  }

  @Patch(':id/update-metadata')
  @ApiOperation({ summary: 'Update metadata (alias2)' })
  async updateMetadataAlias(
    @Param('id') id: string,
    @Body() body: { metadata?: Record<string, unknown> },
    @Req() req: any,
  ) {
    return this.meta(id, body, req);
  }

  @Patch(':id/update-pathway')
  @ApiOperation({ summary: 'Update pathway (alias2)' })
  async updatePathwayAlias(@Param('id') id: string, @Body() body: { pathway?: AssessmentPathway }, @Req() req: any) {
    return this.path(id, body, req);
  }

  @Patch(':id/update-details')
  @ApiOperation({ summary: 'Update details (alias2)' })
  async updateDetailsAlias(
    @Param('id') id: string,
    @Body() body: { title?: string; instructions?: string; dueAt?: string | null },
    @Req() req: any,
  ) {
    return this.details(id, body, req);
  }

  @Patch(':id/ping')
  @ApiOperation({ summary: 'Touch request (alias2)' })
  async ping(@Param('id') id: string, @Req() req: any) {
    return this.refresh(id, req);
  }

  @Post()
  @ApiOperation({ summary: 'Create/send assessment request' })
  async create(
    @Body()
    body: {
      pathway?: AssessmentPathway;
      farmerUserId?: string;
      questionnaireDraftId?: string;
      title?: string;
      instructions?: string;
      dueAt?: string | null;
      metadata?: Record<string, unknown>;
    },
    @Req() req: any,
  ) {
    const tenantId = this.getTenantClaim(req);
    this.ensureCanManage(req);
    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    const pathway = body?.pathway === 'rice' ? 'rice' : body?.pathway === 'annuals' ? 'annuals' : null;
    const farmerUserId = (body?.farmerUserId ?? '').trim();
    const questionnaireDraftId = (body?.questionnaireDraftId ?? '').trim();
    const title = (body?.title ?? '').trim();
    const instructions = (body?.instructions ?? '').trim();
    if (!pathway) {
      throw new BadRequestException('pathway must be annuals or rice');
    }
    if (!farmerUserId) {
      throw new BadRequestException('farmerUserId is required');
    }
    if (!title) {
      throw new BadRequestException('title is required');
    }
    if (questionnaireDraftId) {
      const questionnaireRes = await this.pool.query(
        `
          SELECT id
          FROM integration_questionnaire_v2
          WHERE id = $1::uuid
            AND tenant_id = $2
          LIMIT 1
        `,
        [questionnaireDraftId, tenantId],
      );
      if ((questionnaireRes.rowCount ?? 0) === 0) {
        throw new BadRequestException('questionnaireDraftId is not found for tenant');
      }
    }
    const metadata = body?.metadata ?? {};
    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      throw new BadRequestException('metadata must be an object');
    }
    const dueAt = body?.dueAt?.trim() || null;
    try {
      const insertRes = await this.pool.query<{ id: string; status: string }>(
        `
          INSERT INTO integration_assessment_requests (
            tenant_id,
            pathway,
            farmer_user_id,
            questionnaire_id,
            requested_by_user_id,
            status,
            title,
            instructions,
            due_at,
            metadata
          )
          VALUES ($1, $2, $3::uuid, NULLIF($4, '')::uuid, $5::uuid, 'sent', $6, $7, NULLIF($8, '')::timestamptz, $9::jsonb)
          RETURNING id, status
        `,
        [
          tenantId,
          pathway,
          farmerUserId,
          questionnaireDraftId || null,
          actorUserId,
          title,
          instructions,
          dueAt,
          JSON.stringify(metadata),
        ],
      );
      const id = insertRes.rows[0].id;
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, device_id, event_type, payload)
          VALUES ($1, $2, $3, $4::jsonb)
        `,
        [
          actorUserId,
          'dashboard-web',
          'integration_assessment_request_sent',
          JSON.stringify({
            tenantId,
            requestId: id,
            farmerUserId,
            pathway,
            questionnaireDraftId: questionnaireDraftId || null,
            status: 'sent',
          }),
        ],
      );
      return {
        id,
        status: 'sent',
        pathway,
        farmerUserId,
        questionnaireDraftId: questionnaireDraftId || null,
        title,
      };
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'Assessment request table is not available. Apply TB-V16-019 migration first.',
        );
      }
      throw error;
    }
  }
}

