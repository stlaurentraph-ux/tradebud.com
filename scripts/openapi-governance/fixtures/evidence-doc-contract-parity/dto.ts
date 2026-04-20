import { ApiProperty } from '@nestjs/swagger';

export enum DdsPackageEvidenceDocumentType {
  TENURE_EVIDENCE = 'tenure_evidence',
  LABOR_EVIDENCE = 'labor_evidence',
  FPIC_REPOSITORY = 'fpic_repository',
  PROTECTED_AREA_PERMIT = 'protected_area_permit',
}

export enum DdsPackageEvidenceDocumentReviewStatus {
  VERIFIED = 'verified',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

export class DdsPackageEvidenceDocumentDto {
  @ApiProperty({ example: 'evidence_v_1' })
  evidenceId!: string;

  @ApiProperty({ format: 'uuid', example: '8d09c964-f95b-4a7a-8bd1-e7f3006a3f77' })
  packageId!: string;

  @ApiProperty({ format: 'uuid', nullable: true, example: '9afad390-c0fd-4c46-bded-f4076144f7b5' })
  plotId!: string | null;

  @ApiProperty({ example: 'South Field B document packet' })
  title!: string;

  @ApiProperty({ enum: DdsPackageEvidenceDocumentType, example: DdsPackageEvidenceDocumentType.TENURE_EVIDENCE })
  type!: DdsPackageEvidenceDocumentType;

  @ApiProperty({ enum: DdsPackageEvidenceDocumentReviewStatus, example: DdsPackageEvidenceDocumentReviewStatus.PENDING })
  reviewStatus!: DdsPackageEvidenceDocumentReviewStatus;

  @ApiProperty({ example: 'South Field B' })
  source!: string;

  @ApiProperty({ nullable: true, example: '2026-04-16' })
  capturedAt!: string | null;
}
