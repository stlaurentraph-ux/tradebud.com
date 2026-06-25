import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { createPublicKey } from 'crypto';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';

export type TenantImportSigningKeyRow = {
  id: string;
  tenant_id: string;
  kid: string;
  algorithm: 'ed25519';
  public_key_pem: string;
  label: string;
  created_by_id: string;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TenantImportSigningKeyResponse = {
  id: string;
  kid: string;
  algorithm: 'ed25519';
  label: string;
  publicKeyFingerprint: string;
  revokedAt: string | null;
  createdAt: string;
};

const SIGNING_KEY_ADMIN_ROLES = new Set(['admin', 'compliance_manager']);

@Injectable()
export class BulkPlotImportSigningKeyService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  assertSigningKeyAdminRole(role: string | null | undefined): void {
    if (!role || !SIGNING_KEY_ADMIN_ROLES.has(role)) {
      throw new ForbiddenException('Only tenant admins can manage import signing keys.');
    }
  }

  async listKeys(tenantId: string): Promise<TenantImportSigningKeyResponse[]> {
    const res = await this.pool.query<TenantImportSigningKeyRow>(
      `
        SELECT
          id::text,
          tenant_id,
          kid,
          algorithm,
          public_key_pem,
          label,
          created_by_id,
          revoked_at::text,
          created_at::text,
          updated_at::text
        FROM tenant_import_signing_keys
        WHERE tenant_id = $1
        ORDER BY revoked_at NULLS FIRST, created_at DESC
      `,
      [tenantId],
    );
    return res.rows.map((row) => this.toResponse(row));
  }

  async registerKey(params: {
    tenantId: string;
    userId: string;
    kid: string;
    label: string;
    publicKeyPem: string;
  }): Promise<TenantImportSigningKeyResponse> {
    const kid = params.kid.trim();
    const label = params.label.trim();
    const publicKeyPem = this.normalizePublicKeyPem(params.publicKeyPem);

    if (!kid) {
      throw new BadRequestException('kid is required.');
    }
    if (!label) {
      throw new BadRequestException('label is required.');
    }

    const res = await this.pool.query<TenantImportSigningKeyRow>(
      `
        INSERT INTO tenant_import_signing_keys (
          tenant_id,
          kid,
          algorithm,
          public_key_pem,
          label,
          created_by_id
        )
        VALUES ($1, $2, 'ed25519', $3, $4, $5)
        RETURNING
          id::text,
          tenant_id,
          kid,
          algorithm,
          public_key_pem,
          label,
          created_by_id,
          revoked_at::text,
          created_at::text,
          updated_at::text
      `,
      [params.tenantId, kid, publicKeyPem, label, params.userId],
    );

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, 'bulk_import_signing_key_registered', $2::jsonb)
      `,
      [
        params.userId,
        JSON.stringify({
          tenantId: params.tenantId,
          kid,
          label,
        }),
      ],
    );

    return this.toResponse(res.rows[0]);
  }

  async revokeKey(params: {
    tenantId: string;
    userId: string;
    keyId: string;
  }): Promise<TenantImportSigningKeyResponse> {
    const res = await this.pool.query<TenantImportSigningKeyRow>(
      `
        UPDATE tenant_import_signing_keys
        SET revoked_at = COALESCE(revoked_at, NOW()),
            updated_at = NOW()
        WHERE tenant_id = $1
          AND id = $2::uuid
        RETURNING
          id::text,
          tenant_id,
          kid,
          algorithm,
          public_key_pem,
          label,
          created_by_id,
          revoked_at::text,
          created_at::text,
          updated_at::text
      `,
      [params.tenantId, params.keyId],
    );

    const row = res.rows[0];
    if (!row) {
      throw new NotFoundException('Signing key not found.');
    }

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, 'bulk_import_signing_key_revoked', $2::jsonb)
      `,
      [
        params.userId,
        JSON.stringify({
          tenantId: params.tenantId,
          keyId: params.keyId,
          kid: row.kid,
        }),
      ],
    );

    return this.toResponse(row);
  }

  async resolveActiveKey(params: {
    tenantId: string;
    kid: string;
  }): Promise<TenantImportSigningKeyRow | null> {
    const res = await this.pool.query<TenantImportSigningKeyRow>(
      `
        SELECT
          id::text,
          tenant_id,
          kid,
          algorithm,
          public_key_pem,
          label,
          created_by_id,
          revoked_at::text,
          created_at::text,
          updated_at::text
        FROM tenant_import_signing_keys
        WHERE tenant_id = $1
          AND kid = $2
          AND revoked_at IS NULL
        LIMIT 1
      `,
      [params.tenantId, params.kid],
    );
    return res.rows[0] ?? null;
  }

  normalizePublicKeyPem(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new BadRequestException('publicKeyPem is required.');
    }
    try {
      const key = createPublicKey(trimmed);
      return key.export({ type: 'spki', format: 'pem' }).toString();
    } catch {
      throw new BadRequestException('publicKeyPem must be a valid Ed25519 public key in PEM format.');
    }
  }

  private toResponse(row: TenantImportSigningKeyRow): TenantImportSigningKeyResponse {
    const fingerprint = createPublicKey(row.public_key_pem)
      .export({ type: 'spki', format: 'der' })
      .subarray(-8)
      .toString('hex');
    return {
      id: row.id,
      kid: row.kid,
      algorithm: 'ed25519',
      label: row.label,
      publicKeyFingerprint: fingerprint,
      revokedAt: row.revoked_at,
      createdAt: row.created_at,
    };
  }
}
