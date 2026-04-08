import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class SyncPlotEvidenceDto {
  @ApiProperty({
    description: 'Evidence category being synced',
    enum: ['fpic_repository', 'protected_area_permit', 'labor_evidence', 'tenure_evidence'],
  })
  @IsString()
  @IsIn(['fpic_repository', 'protected_area_permit', 'labor_evidence', 'tenure_evidence'])
  kind!: 'fpic_repository' | 'protected_area_permit' | 'labor_evidence' | 'tenure_evidence';

  @ApiProperty({
    description: 'Array of evidence metadata objects (uri, label, mimeType, takenAt, etc.)',
    type: 'array',
    items: { type: 'object' },
  })
  @IsArray()
  items!: any[];

  @ApiProperty({ description: 'Human-readable reason for this evidence sync (audit trail)' })
  @IsString()
  reason!: string;

  @ApiProperty({ required: false, description: 'Optional free-form note about this sync batch' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    required: false,
    description: 'Hybrid Logical Clock timestamp from offline client (format: <ms>:<logical>)',
    example: '1712524800000:000001',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,16}:\d{1,6}$/, { message: 'hlcTimestamp must be in <ms>:<logical> format' })
  hlcTimestamp?: string;

  @ApiProperty({
    required: false,
    description: 'Client idempotency key for replay-safe sync operations',
  })
  @IsOptional()
  @IsString()
  clientEventId?: string;
}

