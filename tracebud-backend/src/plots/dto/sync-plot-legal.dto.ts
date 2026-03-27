import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

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
}

