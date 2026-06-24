import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { createPublicKey, verify } from 'crypto';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { BulkPlotImportIntegratorKeyService } from './bulk-plot-import-integrator-key.service';
import { BulkPlotImportPolicyService } from './bulk-plot-import-policy.service';
import { BulkPlotImportSigningKeyService } from './bulk-plot-import-signing-key.service';
import {
  assertTracebudImportV1PackageShape,
  computeTracebudImportV1ContentHash,
  getTracebudImportV1CanonicalMessage,
  parseTracebudImportV1PackageSignature,
  type TracebudImportV1PackageInput,
} from './bulk-plot-import-package.util';

export type BulkPlotImportPackageSignatureStatus = 'unsigned' | 'verified' | 'failed';
export type BulkPlotImportPackageSignerType = 'tenant' | 'integrator';

export type BulkPlotImportPackageVerificationResponse = {
  signatureStatus: BulkPlotImportPackageSignatureStatus;
  contentHashValid: boolean;
  kid?: string;
  signingKeyLabel?: string;
  signerType?: BulkPlotImportPackageSignerType;
  integratorId?: string;
  message?: string;
};

type ResolvedSigningKey = {
  kid: string;
  label: string;
  public_key_pem: string;
  signerType: BulkPlotImportPackageSignerType;
  integratorId?: string;
};

@Injectable()
export class BulkPlotImportPackageService {
  constructor(
    private readonly signingKeys: BulkPlotImportSigningKeyService,
    private readonly integratorKeys: BulkPlotImportIntegratorKeyService,
    private readonly policy: BulkPlotImportPolicyService,
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

    const resolvedKey = await this.resolveSigningKey({
      tenantId: params.tenantId,
      kid: signature.kid,
      sourceSystem: params.pkg.source_system,
    });
    if (!resolvedKey) {
      return {
        signatureStatus: 'failed',
        contentHashValid: true,
        kid: signature.kid,
        message: `Unknown or revoked signing key "${signature.kid}".`,
      };
    }

    const verified = this.verifyEd25519Signature({
      publicKeyPem: resolvedKey.public_key_pem,
      message: getTracebudImportV1CanonicalMessage(params.pkg),
      signatureBase64: signature.value,
    });

    const response: BulkPlotImportPackageVerificationResponse = verified
      ? {
          signatureStatus: 'verified',
          contentHashValid: true,
          kid: signature.kid,
          signingKeyLabel: resolvedKey.label,
          signerType: resolvedKey.signerType,
          integratorId: resolvedKey.integratorId,
          message:
            resolvedKey.signerType === 'integrator'
              ? `Verified integrator signer: ${resolvedKey.label} (${signature.kid}).`
              : `Verified signer: ${resolvedKey.label} (${signature.kid}).`,
        }
      : {
          signatureStatus: 'failed',
          contentHashValid: true,
          kid: signature.kid,
          signingKeyLabel: resolvedKey.label,
          signerType: resolvedKey.signerType,
          integratorId: resolvedKey.integratorId,
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
            signerType: resolvedKey.signerType,
            integratorId: resolvedKey.integratorId ?? null,
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
    await this.policy.assertSignedPackagesRequired({
      tenantId: params.tenantId,
      importPackagePresent: true,
      signatureStatus: verification.signatureStatus,
    });
    return verification;
  }

  private async resolveSigningKey(params: {
    tenantId: string;
    kid: string;
    sourceSystem?: string | null;
  }): Promise<ResolvedSigningKey | null> {
    const tenantKey = await this.signingKeys.resolveActiveKey({
      tenantId: params.tenantId,
      kid: params.kid,
    });
    if (tenantKey) {
      return {
        kid: tenantKey.kid,
        label: tenantKey.label,
        public_key_pem: tenantKey.public_key_pem,
        signerType: 'tenant',
      };
    }

    const tenantPolicy = await this.policy.getPolicy(params.tenantId);
    if (!tenantPolicy.acceptIntegratorSignatures) {
      return null;
    }

    const integratorKey = await this.integratorKeys.resolveActiveKey({
      kid: params.kid,
      sourceSystem: params.sourceSystem,
    });
    if (!integratorKey) {
      return null;
    }

    return {
      kid: integratorKey.kid,
      label: integratorKey.label,
      public_key_pem: integratorKey.public_key_pem,
      signerType: 'integrator',
      integratorId: integratorKey.integrator_id,
    };
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
