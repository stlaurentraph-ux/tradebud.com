import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class SyncPlotLegalDto {
  @ApiProperty({ required: false, description: 'Clave Catastral for the plot' })
  @IsOptional()
  @IsString()
  cadastralKey?: string;

  @ApiProperty({
    required: false,
    description: 'Whether the producer declared informal tenure (Productor en Posesión)',
  })
  @IsOptional()
  @IsBoolean()
  informalTenure?: boolean;

  @ApiProperty({ required: false, description: 'Optional note for informal tenure' })
  @IsOptional()
  @IsString()
  informalTenureNote?: string;

  @ApiProperty({
    description: 'Human-readable reason for this legality update (immutable audit trail)',
  })
  @IsString()
  reason!: string;

  @ApiProperty({ required: false, description: 'Device identifier (optional)' })
  @IsOptional()
  @IsString()
  deviceId?: string;

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

  @ApiProperty({
    required: false,
    description: 'Optional assignment identifier used to enforce agent sync scope',
  })
  @IsOptional()
  @IsString()
  assignmentId?: string;
}

