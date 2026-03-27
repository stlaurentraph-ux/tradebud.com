import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePlotDto {
  @ApiProperty({
    required: false,
    description: 'New human-readable name for the plot.',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Reason for the edit, for immutable audit history.',
  })
  @IsString()
  reason!: string;

  @ApiProperty({
    required: false,
    description: 'Optional device identifier from the mobile app.',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

