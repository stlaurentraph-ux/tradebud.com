import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { isFarmerInTenant } from '../common/tenant-farmer-scope';
import { PG_POOL } from '../db/db.module';
import {
  hasSoldLineageForTenant,
  isPlotInSoldLineageForTenant,
  isVoucherInSoldLineage,
  resolveTenantConsentGate,
  type TenantConsentGate,
} from './consent-lineage-access';
import { SOLD_LINEAGE_RETENTION_YEARS, soldLineageRetentionUntil } from './consent-retention';
import { PushNotificationService } from './push-notification.service';
import { markCrmContactSubmittedOnFulfill } from '../contacts/mark-crm-contact-submitted-on-fulfill';
import { reconcileCampaignOnFarmerConsentFulfill } from '../requests/reconcile-campaign-on-farmer-consent-fulfill';

export type ConsentGrantStatus = 'pending' | 'active' | 'revoked' | 'denied';
export type ConsentPurposeCode =
  | 'COMPLIANCE_COLLECTION'
  | 'SHIPMENT_PREPARATION'
  | 'DDS_SUBMISSION'
  | 'DOWNSTREAM_REFERENCE_SHARING'
  | 'AUDIT_RESPONSE'
  | 'PORTABILITY_TRANSFER';

export interface ConsentGrantRow {
  id: string;
  farmer_id: string;
  grantee_tenant_id: string;
  grantee_org_name: string | null;
  requester_user_id: string | null;
  purpose_code: ConsentPurposeCode;
  data_scope: string[];
  status: ConsentGrantStatus;
  consent_mechanism: string | null;
  granted_at: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_DATA_SCOPE = ['identity', 'plots', 'evidence'];

@Injectable()
export class ConsentService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly pushNotifications: PushNotificationService,
  ) {}

  private mapDatabaseError(error: unknown): never {
    const pgError = error as { code?: string; message?: string } | null;
    const message = pgError?.message ?? '';
    if (pgError?.code === '42P01' && message.includes('consent_grants')) {
      throw new BadRequestException(
        'Consent grants table is not available. Apply TB-V16-033 migration first.',
      );
    }
    throw new InternalServerErrorException('Failed to process consent request.');
  }

  private mapRow(row: ConsentGrantRow): ConsentGrantRow {
    return {
      ...row,
      data_scope: Array.isArray(row.data_scope) ? row.data_scope : DEFAULT_DATA_SCOPE,
      granted_at: row.granted_at ? new Date(row.granted_at).toISOString() : null,
      revoked_at: row.revoked_at ? new Date(row.revoked_at).toISOString() : null,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  private async emitAudit(eventType: string, payload: Record<string, unknown>): Promise<void> {
    await this.pool.query(`INSERT INTO audit_log (event_type, payload) VALUES ($1, $2::jsonb)`, [
      eventType,
      JSON.stringify(payload),
    ]);
  }

  async resolveFarmerIdForTenantEmail(tenantId: string, email: string): Promise<string | null> {
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

  async resolveFarmerIdForUser(userId: string): Promise<string | null> {
    const res = await this.pool.query<{ id: string }>(
      `SELECT id FROM farmer_profile WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    return res.rows[0]?.id ?? null;
  }

  async listForFarmerUser(userId: string): Promise<ConsentGrantRow[]> {
    const farmerId = await this.resolveFarmerIdForUser(userId);
    if (!farmerId) {
      return [];
    }
    return this.listForFarmerId(farmerId);
  }

  async listForFarmerId(farmerId: string): Promise<ConsentGrantRow[]> {
    try {
      const res = await this.pool.query<ConsentGrantRow>(
        `
          SELECT *
          FROM consent_grants
          WHERE farmer_id = $1
          ORDER BY
            CASE status
              WHEN 'pending' THEN 0
              WHEN 'active' THEN 1
              WHEN 'revoked' THEN 2
              ELSE 3
            END,
            updated_at DESC
        `,
        [farmerId],
      );
      return res.rows.map((row) => this.mapRow(row));
    } catch (error) {
      this.mapDatabaseError(error);
    }
  }

  async listForTenantAndFarmer(tenantId: string, farmerId: string): Promise<ConsentGrantRow[]> {
    try {
      const res = await this.pool.query<ConsentGrantRow>(
        `
          SELECT *
          FROM consent_grants
          WHERE farmer_id = $1
            AND grantee_tenant_id = $2
          ORDER BY updated_at DESC
        `,
        [farmerId, tenantId],
      );
      return res.rows.map((row) => this.mapRow(row));
    } catch (error) {
      this.mapDatabaseError(error);
    }
  }

  private async getGrantForFarmer(grantId: string, farmerId: string): Promise<ConsentGrantRow> {
    const res = await this.pool.query<ConsentGrantRow>(
      `SELECT * FROM consent_grants WHERE id = $1 AND farmer_id = $2 LIMIT 1`,
      [grantId, farmerId],
    );
    const row = res.rows[0];
    if (!row) {
      throw new NotFoundException('Consent grant not found');
    }
    return this.mapRow(row);
  }

  async approveGrant(grantId: string, userId: string): Promise<ConsentGrantRow> {
    const farmerId = await this.resolveFarmerIdForUser(userId);
    if (!farmerId) {
      throw new ForbiddenException('No producer profile linked to this account');
    }
    const existing = await this.getGrantForFarmer(grantId, farmerId);
    if (existing.status !== 'pending') {
      throw new BadRequestException(`Cannot approve grant in status ${existing.status}`);
    }

    try {
      const res = await this.pool.query<ConsentGrantRow>(
        `
          UPDATE consent_grants
          SET
            status = 'active',
            consent_mechanism = 'DIGITAL',
            granted_at = NOW(),
            updated_at = NOW()
          WHERE id = $1 AND farmer_id = $2 AND status = 'pending'
          RETURNING *
        `,
        [grantId, farmerId],
      );
      const row = res.rows[0];
      if (!row) {
        throw new NotFoundException('Consent grant not found');
      }
      await this.emitAudit('consent_grant_approved', {
        consent_grant_id: row.id,
        farmer_id: farmerId,
        grantee_tenant_id: row.grantee_tenant_id,
        approved_by_user_id: userId,
      });
      const crmResult = await markCrmContactSubmittedOnFulfill(this.pool, {
        senderTenantId: row.grantee_tenant_id,
        farmerProfileId: farmerId,
        source: 'consent_grant_approved',
        consentGrantId: row.id,
      });
      await reconcileCampaignOnFarmerConsentFulfill(this.pool, {
        senderTenantId: row.grantee_tenant_id,
        farmerProfileId: farmerId,
        consentGrantId: row.id,
        contactId: crmResult.contactId,
      });
      return this.mapRow(row);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.mapDatabaseError(error);
    }
  }

  async denyGrant(grantId: string, userId: string): Promise<ConsentGrantRow> {
    const farmerId = await this.resolveFarmerIdForUser(userId);
    if (!farmerId) {
      throw new ForbiddenException('No producer profile linked to this account');
    }
    const existing = await this.getGrantForFarmer(grantId, farmerId);
    if (existing.status !== 'pending') {
      throw new BadRequestException(`Cannot deny grant in status ${existing.status}`);
    }

    try {
      const res = await this.pool.query<ConsentGrantRow>(
        `
          UPDATE consent_grants
          SET status = 'denied', updated_at = NOW()
          WHERE id = $1 AND farmer_id = $2 AND status = 'pending'
          RETURNING *
        `,
        [grantId, farmerId],
      );
      const row = res.rows[0];
      if (!row) {
        throw new NotFoundException('Consent grant not found');
      }
      await this.emitAudit('consent_grant_denied', {
        consent_grant_id: row.id,
        farmer_id: farmerId,
        grantee_tenant_id: row.grantee_tenant_id,
        denied_by_user_id: userId,
      });
      return this.mapRow(row);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.mapDatabaseError(error);
    }
  }

  async revokeGrant(
    grantId: string,
    userId: string,
    revocationReason: string,
  ): Promise<ConsentGrantRow> {
    const reason = revocationReason?.trim();
    if (!reason) {
      throw new BadRequestException('revocation_reason is required');
    }
    const farmerId = await this.resolveFarmerIdForUser(userId);
    if (!farmerId) {
      throw new ForbiddenException('No producer profile linked to this account');
    }
    const existing = await this.getGrantForFarmer(grantId, farmerId);
    if (existing.status !== 'active') {
      throw new BadRequestException(`Cannot revoke grant in status ${existing.status}`);
    }

    try {
      const res = await this.pool.query<ConsentGrantRow>(
        `
          UPDATE consent_grants
          SET
            status = 'revoked',
            revoked_at = NOW(),
            revocation_reason = $3,
            updated_at = NOW()
          WHERE id = $1 AND farmer_id = $2 AND status = 'active'
          RETURNING *
        `,
        [grantId, farmerId, reason],
      );
      const row = res.rows[0];
      if (!row) {
        throw new NotFoundException('Consent grant not found');
      }
      await this.emitAudit('consent_grant_revoked', {
        consent_grant_id: row.id,
        farmer_id: farmerId,
        grantee_tenant_id: row.grantee_tenant_id,
        revoked_by_user_id: userId,
        revocation_reason: reason,
      });
      return this.mapRow(row);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.mapDatabaseError(error);
    }
  }

  async createConsentRequest(params: {
    tenantId: string;
    requesterUserId: string;
    farmerId: string;
    granteeOrgName?: string | null;
    purposeCode?: ConsentPurposeCode;
    dataScope?: string[];
  }): Promise<ConsentGrantRow> {
    const farmerId = params.farmerId?.trim();
    if (!farmerId) {
      throw new BadRequestException('farmerId is required');
    }

    const farmerCheck = await this.pool.query(`SELECT 1 FROM farmer_profile WHERE id = $1 LIMIT 1`, [
      farmerId,
    ]);
    if ((farmerCheck.rowCount ?? 0) === 0) {
      throw new NotFoundException('Producer not found');
    }

    const dataScope =
      params.dataScope && params.dataScope.length > 0 ? params.dataScope : DEFAULT_DATA_SCOPE;
    const purposeCode = params.purposeCode ?? 'COMPLIANCE_COLLECTION';

    try {
      const pending = await this.pool.query<ConsentGrantRow>(
        `
          SELECT *
          FROM consent_grants
          WHERE farmer_id = $1
            AND grantee_tenant_id = $2
            AND status = 'pending'
          LIMIT 1
        `,
        [farmerId, params.tenantId],
      );
      if (pending.rows[0]) {
        return this.mapRow(pending.rows[0]);
      }

      const active = await this.pool.query<ConsentGrantRow>(
        `
          SELECT *
          FROM consent_grants
          WHERE farmer_id = $1
            AND grantee_tenant_id = $2
            AND status = 'active'
          LIMIT 1
        `,
        [farmerId, params.tenantId],
      );
      if (active.rows[0]) {
        return this.mapRow(active.rows[0]);
      }

      const res = await this.pool.query<ConsentGrantRow>(
        `
          INSERT INTO consent_grants (
            farmer_id,
            grantee_tenant_id,
            grantee_org_name,
            requester_user_id,
            purpose_code,
            data_scope,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6::text[], 'pending')
          RETURNING *
        `,
        [
          farmerId,
          params.tenantId,
          params.granteeOrgName?.trim() || null,
          params.requesterUserId,
          purposeCode,
          dataScope,
        ],
      );
      const row = res.rows[0];
      await this.emitAudit('consent_grant_requested', {
        consent_grant_id: row.id,
        farmer_id: farmerId,
        grantee_tenant_id: params.tenantId,
        requester_user_id: params.requesterUserId,
        purpose_code: purposeCode,
        data_scope: dataScope,
      });
      void this.pushNotifications.notifyFarmerConsentRequest({
        farmerId,
        granteeOrgName: params.granteeOrgName ?? null,
        grantId: row.id,
      });
      return this.mapRow(row);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.mapDatabaseError(error);
    }
  }

  enrichGrantWithRetention<T extends ConsentGrantRow>(grant: T): T & {
    sold_lineage_retention_years: number;
    sold_lineage_retention_until: string | null;
  } {
    const anchor = grant.revoked_at ?? grant.granted_at ?? grant.created_at;
    return {
      ...grant,
      sold_lineage_retention_years: SOLD_LINEAGE_RETENTION_YEARS,
      sold_lineage_retention_until:
        grant.status === 'revoked' && anchor ? soldLineageRetentionUntil(anchor) : null,
    };
  }

  async recordGdprErasureRequest(
    userId: string,
    details: string,
  ): Promise<{
    recorded: true;
    sold_lineage_retention_years: number;
    message: string;
  }> {
    const reason = details?.trim();
    if (!reason) {
      throw new BadRequestException('details is required');
    }
    const farmerId = await this.resolveFarmerIdForUser(userId);
    if (!farmerId) {
      throw new ForbiddenException('No producer profile linked to this account');
    }
    await this.emitAudit('gdpr_erasure_requested', {
      farmer_id: farmerId,
      requested_by_user_id: userId,
      details: reason,
      sold_lineage_retention_years: SOLD_LINEAGE_RETENTION_YEARS,
      policy: 'sold_batch_lineage_retained_for_legal_window',
    });
    return {
      recorded: true,
      sold_lineage_retention_years: SOLD_LINEAGE_RETENTION_YEARS,
      message:
        'Your erasure request is recorded. Data already sold in batches or shipments may be retained for up to 5 years for EU compliance and cannot be withdrawn retrospectively.',
    };
  }

  async getTenantConsentGate(farmerId: string, tenantId: string): Promise<TenantConsentGate> {
    return resolveTenantConsentGate(this.pool, farmerId, tenantId);
  }

  /** Ongoing sharing — new plots, harvests, and evidence requests (spec §11.4 prospective). */
  async canTenantAccessFarmerNewData(farmerId: string, tenantId: string): Promise<boolean> {
    const gate = await this.getTenantConsentGate(farmerId, tenantId);
    if (gate.status === 'active') {
      return true;
    }
    if (gate.status === 'pending' || gate.status === 'revoked' || gate.status === 'denied') {
      return false;
    }
    return isFarmerInTenant(this.pool, farmerId, tenantId);
  }

  /** Plot read — allowed for new sharing or when plot is in a sold batch before revoked_at. */
  async canTenantAccessPlot(plotId: string, tenantId: string): Promise<boolean> {
    const scope = await this.pool.query<{ farmer_id: string }>(
      `SELECT farmer_id FROM plot WHERE id = $1 LIMIT 1`,
      [plotId],
    );
    const farmerId = scope.rows[0]?.farmer_id;
    if (!farmerId) {
      return false;
    }
    if (await this.canTenantAccessFarmerNewData(farmerId, tenantId)) {
      return true;
    }
    const gate = await this.getTenantConsentGate(farmerId, tenantId);
    if (gate.status !== 'revoked' && gate.status !== 'denied') {
      return false;
    }
    if (!(await isFarmerInTenant(this.pool, farmerId, tenantId))) {
      return false;
    }
    return isPlotInSoldLineageForTenant(this.pool, plotId, farmerId, gate.revokedAt);
  }

  /** Voucher read — unsold vouchers blocked after revoke; batch-allocated vouchers remain. */
  async canTenantAccessVoucher(voucherId: string, tenantId: string): Promise<boolean> {
    const scope = await this.pool.query<{ farmer_id: string }>(
      `SELECT farmer_id FROM voucher WHERE id = $1 LIMIT 1`,
      [voucherId],
    );
    const farmerId = scope.rows[0]?.farmer_id;
    if (!farmerId) {
      return false;
    }
    if (await this.canTenantAccessFarmerNewData(farmerId, tenantId)) {
      return true;
    }
    const gate = await this.getTenantConsentGate(farmerId, tenantId);
    if (gate.status !== 'revoked' && gate.status !== 'denied') {
      return false;
    }
    if (!(await isFarmerInTenant(this.pool, farmerId, tenantId))) {
      return false;
    }
    return isVoucherInSoldLineage(this.pool, voucherId, farmerId, gate.revokedAt);
  }

  /** Whether a tenant may read uploaded evidence files for a producer. */
  async canTenantAccessFarmerEvidence(farmerId: string, tenantId: string): Promise<boolean> {
    const gate = await this.getTenantConsentGate(farmerId, tenantId);
    if (gate.status === 'pending') {
      return false;
    }
    if (gate.status === 'revoked' || gate.status === 'denied') {
      if (!(await isFarmerInTenant(this.pool, farmerId, tenantId))) {
        return false;
      }
      return hasSoldLineageForTenant(this.pool, farmerId, gate.revokedAt);
    }
    if (gate.status === 'active') {
      try {
        const res = await this.pool.query<{ data_scope: string[] }>(
          `
            SELECT data_scope
            FROM consent_grants
            WHERE farmer_id = $1
              AND grantee_tenant_id = $2
              AND status = 'active'
            ORDER BY updated_at DESC
            LIMIT 1
          `,
          [farmerId, tenantId],
        );
        const scope = res.rows[0]?.data_scope;
        if (Array.isArray(scope) && !scope.includes('evidence')) {
          return false;
        }
      } catch (error) {
        const code = (error as { code?: string } | null)?.code;
        if (code !== '42P01') {
          throw error;
        }
      }
      return true;
    }
    return isFarmerInTenant(this.pool, farmerId, tenantId);
  }

  /**
   * Whether a tenant has any readable relationship with a producer
   * (ongoing sharing or sold-batch lineage only).
   */
  async canTenantAccessFarmer(farmerId: string, tenantId: string): Promise<boolean> {
    if (await this.canTenantAccessFarmerNewData(farmerId, tenantId)) {
      return true;
    }
    const gate = await this.getTenantConsentGate(farmerId, tenantId);
    if (gate.status !== 'revoked' && gate.status !== 'denied') {
      return false;
    }
    if (!(await isFarmerInTenant(this.pool, farmerId, tenantId))) {
      return false;
    }
    return hasSoldLineageForTenant(this.pool, farmerId, gate.revokedAt);
  }
}
