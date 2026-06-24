import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { createPublicKey, verify } from 'crypto';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { BulkPlotImportSigningKeyService } from './bulk-plot-import-signing-key.service';
import {
  assertTracebudImportV1PackageShape,
  computeTracebudImportV1ContentHash,
  getTracebudImportV1CanonicalMessage,
  parseTracebudImportV1PackageSignature,
  type TracebudImportV1PackageInput,
} from './bulk-plot-import-package.util';

export type BulkPlotImportPackageSignatureStatus = 'unsigned' | 'verified' | 'failed';

export type BulkPlotImportPackageVerificationResponse = {
  signatureStatus: BulkPlotImportPackageSignatureStatus;
  contentHashValid: boolean;
  kid?: string;
  signingKeyLabel?: string;
  message?: string;
};

@Injectable()
export class BulkPlotImportPackageService {
  constructor(
    private readonly signingKeys: BulkPlotImportSigningKeyService,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  assertPackageShape(parsed: unknown): TracebudImportV1PackageInput {
    return assertTracebudImportV1PackageShape(parsed);
  }

  verifyContentHash(pkg: TracebudImportV1PackageInput): boolean {
    const expected = pkg.content_hash_sha256?.trim().toLowerCase();
    if (!expected) return true;
    return computeTracebudImportV1ContentHash(pkg) === expected;
  }

  async verifyPackage(params: {
    tenantId: string;
    userId?: string;
    pkg: TracebudImportV1PackageInput;
    audit?: boolean;
  }): Promise<BulkPlotImportPackageVerificationResponse> {
    const contentHashValid = this.verifyContentHash(params.pkg);
    if (!contentHashValid) {
      return {
        signatureStatus: 'failed',
        contentHashValid: false,
        message: 'content_hash_sha256 does not match the package payload.',
      };
    }

    let signature;
    try {
      signature = parseTracebudImportV1PackageSignature(params.pkg);
    } catch (error) {
      return {
        signatureStatus: 'failed',
        contentHashValid: true,
        message: error instanceof Error ? error.message : 'Invalid package signature format.',
      };
    }

    if (!signature) {
      return {
        signatureStatus: 'unsigned',
        contentHashValid: true,
        message: 'Package is not cryptographically signed.',
      };
    }

    const key = await this.signingKeys.resolveActiveKey({
      tenantId: params.tenantId,
      kid: signature.kid,
    });
    if (!key) {
      return {
        signatureStatus: 'failed',
        contentHashValid: true,
        kid: signature.kid,
        message: `Unknown or revoked signing key "${signature.kid}".`,
      };
    }

    const verified = this.verifyEd25519Signature({
      publicKeyPem: key.public_key_pem,
      message: getTracebudImportV1CanonicalMessage(params.pkg),
      signatureBase64: signature.value,
    });

    const response: BulkPlotImportPackageVerificationResponse = verified
      ? {
          signatureStatus: 'verified',
          contentHashValid: true,
          kid: signature.kid,
          signingKeyLabel: key.label,
          message: `Verified signer: ${key.label} (${signature.kid}).`,
        }
      : {
          signatureStatus: 'failed',
          contentHashValid: true,
          kid: signature.kid,
          signingKeyLabel: key.label,
          message: `Signature verification failed for key "${signature.kid}".`,
        };

    if (params.audit && params.userId) {
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, event_type, payload)
          VALUES ($1, $2, $3::jsonb)
        `,
        [
          params.userId,
          verified ? 'bulk_import_package_signature_verified' : 'bulk_import_package_signature_failed',
          JSON.stringify({
            tenantId: params.tenantId,
            kid: signature.kid,
            sourceSystem: params.pkg.source_system,
          }),
        ],
      );
    }

    return response;
  }

  async assertPackageImportable(params: {
    tenantId: string;
    userId?: string;
    importPackage?: TracebudImportV1PackageInput | null;
  }): Promise<BulkPlotImportPackageVerificationResponse | null> {
    if (!params.importPackage) return null;
    const verification = await this.verifyPackage({
      tenantId: params.tenantId,
      userId: params.userId,
      pkg: params.importPackage,
      audit: true,
    });
    if (verification.signatureStatus === 'failed' || !verification.contentHashValid) {
      throw new BadRequestException(verification.message ?? 'Import package verification failed.');
    }
    return verification;
  }

  private verifyEd25519Signature(params: {
    publicKeyPem: string;
    message: string;
    signatureBase64: string;
  }): boolean {
    try {
      return verify(
        null,
        Buffer.from(params.message, 'utf8'),
        createPublicKey(params.publicKeyPem),
        Buffer.from(params.signatureBase64, 'base64'),
      );
    } catch {
      return false;
    }
  }
}
