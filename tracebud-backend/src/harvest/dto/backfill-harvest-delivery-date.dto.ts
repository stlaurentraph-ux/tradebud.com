import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class BackfillHarvestDeliveryDateDto {
  @ApiProperty({ example: '2026-06-19' })
  @IsDateString()
  harvestDate!: string;

  @ApiProperty({
    required: false,
    description: 'Original field-app client event id (harvest-{plotId}-{recordedAtMs})',
  })
  @IsOptional()
  @IsString()
  clientEventId?: string;
}

export class BackfillHarvestDeliveryDateParamsDto {
  @ApiProperty()
  @IsUUID()
  voucherId!: string;
}
