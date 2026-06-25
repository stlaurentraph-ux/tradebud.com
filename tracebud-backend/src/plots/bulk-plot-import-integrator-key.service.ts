import { Injectable, Inject } from '@nestjs/common';
import { createPublicKey } from 'crypto';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';

export type IntegratorImportSigningKeyRow = {
  id: string;
  integrator_id: string;
  kid: string;
  algorithm: 'ed25519';
  public_key_pem: string;
  label: string;
  allowed_source_systems: string[] | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type IntegratorImportSigningKeyResponse = {
  id: string;
  integratorId: string;
  kid: string;
  algorithm: 'ed25519';
  label: string;
  allowedSourceSystems: string[];
  publicKeyFingerprint: string;
  revokedAt: string | null;
};

@Injectable()
export class BulkPlotImportIntegratorKeyService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listActiveKeys(): Promise<IntegratorImportSigningKeyResponse[]> {
    const res = await this.pool.query<IntegratorImportSigningKeyRow>(
      `
        SELECT
          id::text,
          integrator_id,
          kid,
          algorithm,
          public_key_pem,
          label,
          allowed_source_systems,
          revoked_at::text,
          created_at::text,
          updated_at::text
        FROM integrator_import_signing_keys
        WHERE revoked_at IS NULL
        ORDER BY integrator_id ASC, kid ASC
      `,
    );
    return res.rows.map((row) => this.toResponse(row));
  }

  async resolveActiveKey(params: {
    kid: string;
    sourceSystem?: string | null;
  }): Promise<IntegratorImportSigningKeyRow | null> {
    const res = await this.pool.query<IntegratorImportSigningKeyRow>(
      `
        SELECT
          id::text,
          integrator_id,
          kid,
          algorithm,
          public_key_pem,
          label,
          allowed_source_systems,
          revoked_at::text,
          created_at::text,
          updated_at::text
        FROM integrator_import_signing_keys
        WHERE kid = $1
          AND revoked_at IS NULL
        LIMIT 1
      `,
      [params.kid],
    );
    const row = res.rows[0];
    if (!row) {
      return null;
    }
    const sourceSystem = params.sourceSystem?.trim();
    if (
      sourceSystem &&
      Array.isArray(row.allowed_source_systems) &&
      row.allowed_source_systems.length > 0 &&
      !row.allowed_source_systems.includes(sourceSystem)
    ) {
      return null;
    }
    return row;
  }

  private toResponse(row: IntegratorImportSigningKeyRow): IntegratorImportSigningKeyResponse {
    const fingerprint = createPublicKey(row.public_key_pem)
      .export({ type: 'spki', format: 'der' })
      .subarray(-8)
      .toString('hex');
    return {
      id: row.id,
      integratorId: row.integrator_id,
      kid: row.kid,
      algorithm: 'ed25519',
      label: row.label,
      allowedSourceSystems: row.allowed_source_systems ?? [],
      publicKeyFingerprint: fingerprint,
      revokedAt: row.revoked_at,
    };
  }
}
