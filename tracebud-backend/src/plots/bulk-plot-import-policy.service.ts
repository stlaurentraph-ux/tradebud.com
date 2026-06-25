import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';

export type TenantBulkImportPolicy = {
  tenantId: string;
  requireSignedPackages: boolean;
  acceptIntegratorSignatures: boolean;
  updatedAt: string | null;
};

type PolicyRow = {
  tenant_id: string;
  require_signed_packages: boolean;
  accept_integrator_signatures: boolean;
  updated_at: string | null;
};

@Injectable()
export class BulkPlotImportPolicyService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getPolicy(tenantId: string): Promise<TenantBulkImportPolicy> {
    const res = await this.pool.query<PolicyRow>(
      `
        SELECT
          tenant_id,
          require_signed_packages,
          accept_integrator_signatures,
          updated_at::text
        FROM tenant_bulk_import_policy
        WHERE tenant_id = $1
        LIMIT 1
      `,
      [tenantId],
    );
    const row = res.rows[0];
    if (!row) {
      return {
        tenantId,
        requireSignedPackages: false,
        acceptIntegratorSignatures: false,
        updatedAt: null,
      };
    }
    return this.toResponse(row);
  }

  async updatePolicy(params: {
    tenantId: string;
    userId: string;
    requireSignedPackages?: boolean;
    acceptIntegratorSignatures?: boolean;
  }): Promise<TenantBulkImportPolicy> {
    const current = await this.getPolicy(params.tenantId);
    const requireSignedPackages =
      params.requireSignedPackages ?? current.requireSignedPackages;
    const acceptIntegratorSignatures =
      params.acceptIntegratorSignatures ?? current.acceptIntegratorSignatures;

    const res = await this.pool.query<PolicyRow>(
      `
        INSERT INTO tenant_bulk_import_policy (
          tenant_id,
          require_signed_packages,
          accept_integrator_signatures,
          updated_by_id
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (tenant_id) DO UPDATE SET
          require_signed_packages = EXCLUDED.require_signed_packages,
          accept_integrator_signatures = EXCLUDED.accept_integrator_signatures,
          updated_by_id = EXCLUDED.updated_by_id,
          updated_at = NOW()
        RETURNING
          tenant_id,
          require_signed_packages,
          accept_integrator_signatures,
          updated_at::text
      `,
      [params.tenantId, requireSignedPackages, acceptIntegratorSignatures, params.userId],
    );

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, 'bulk_import_policy_updated', $2::jsonb)
      `,
      [
        params.userId,
        JSON.stringify({
          tenantId: params.tenantId,
          requireSignedPackages,
          acceptIntegratorSignatures,
        }),
      ],
    );

    return this.toResponse(res.rows[0]);
  }

  async assertSignedPackagesRequired(params: {
    tenantId: string;
    importPackagePresent: boolean;
    signatureStatus: 'unsigned' | 'verified' | 'failed';
  }): Promise<void> {
    if (!params.importPackagePresent || params.signatureStatus !== 'unsigned') {
      return;
    }
    const policy = await this.getPolicy(params.tenantId);
    if (!policy.requireSignedPackages) {
      return;
    }
    throw new BadRequestException(
      'This organisation requires cryptographically signed import packages. Register a signing key and export a signed tracebud_import_v1 package.',
    );
  }

  private toResponse(row: PolicyRow): TenantBulkImportPolicy {
    return {
      tenantId: row.tenant_id,
      requireSignedPackages: row.require_signed_packages,
      acceptIntegratorSignatures: row.accept_integrator_signatures,
      updatedAt: row.updated_at,
    };
  }
}
