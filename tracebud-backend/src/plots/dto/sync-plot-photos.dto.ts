import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class SyncPlotPhotosDto {
  @ApiProperty({
    description: 'What kind of photos are being synced',
    enum: ['ground_truth', 'land_title'],
  })
  @IsString()
  @IsIn(['ground_truth', 'land_title'])
  kind!: 'ground_truth' | 'land_title';

  @ApiProperty({
    description:
      'Array of photo metadata objects as captured on the device (URI, takenAt, optional coordinates, etc.)',
    type: 'array',
    items: { type: 'object' },
  })
  @IsArray()
  photos!: any[];

  @ApiProperty({
    required: false,
    description: 'Optional free-form notes from the device about this sync batch',
  })
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

