import { ApiProperty } from '@nestjs/swagger';

export class PlotTenureVerificationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  plot_id!: string;

  @ApiProperty()
  storage_path!: string;

  @ApiProperty({ nullable: true })
  mime_type!: string | null;

  @ApiProperty({ nullable: true })
  evidence_label!: string | null;

  @ApiProperty({
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'MANUAL_REQUIRED'],
  })
  parse_status!: string;

  @ApiProperty({ nullable: true, type: 'object', additionalProperties: true })
  parse_result!: Record<string, unknown> | null;

  @ApiProperty({ nullable: true, example: 0.82 })
  parse_confidence!: number | null;

  @ApiProperty({ nullable: true })
  parse_reviewed_by!: string | null;

  @ApiProperty({ nullable: true })
  parse_reviewed_at!: string | null;

  @ApiProperty()
  created_at!: string;

  @ApiProperty()
  updated_at!: string;
}
