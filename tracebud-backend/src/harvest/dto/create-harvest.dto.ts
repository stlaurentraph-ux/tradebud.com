import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsNumber, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateHarvestDto {
  @ApiProperty()
  @IsUUID()
  farmerId!: string;

  @ApiProperty()
  @IsUUID()
  plotId!: string;

  @ApiProperty()
  @IsNumber()
  kg!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  harvestDate?: string;

  @ApiProperty({ required: false })
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
    description: 'Client idempotency key for replay-safe harvest creation',
  })
  @IsOptional()
  @IsString()
  clientEventId?: string;

  @ApiProperty({
    required: false,
    description: 'Buyer tenant id when farmer picks a registered buyer from consent list',
  })
  @IsOptional()
  @IsString()
  deliverToTenantId?: string;

  @ApiProperty({
    required: false,
    description: 'Buyer contact email when farmer directs delivery (resolved to tenant at sync)',
  })
  @IsOptional()
  @IsEmail()
  deliverToEmail?: string;

  @ApiProperty({
    required: false,
    description: 'Shared trip reference when multiple plot lines are submitted in one visit (T-…)',
  })
  @IsOptional()
  @IsString()
  deliveryTripRef?: string;
}

