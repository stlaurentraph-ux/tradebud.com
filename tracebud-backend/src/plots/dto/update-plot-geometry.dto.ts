import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePlotGeometryDto {
  @ApiProperty({
    description:
      'GeoJSON Point or Polygon in WGS84. Example: { "type": "Polygon", "coordinates": [[[-86.1,14.1],[-86.2,14.1],[-86.2,14.2],[-86.1,14.2],[-86.1,14.1]]] }',
  })
  geometry!: any;

  @ApiProperty({
    description: 'Reason for the geometry revision (immutable audit chain).',
  })
  @IsString()
  reason!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  declaredAreaHa?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  precisionMeters?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  hdop?: number;

  @ApiProperty({
    required: false,
    description: 'Optional device identifier from the mobile app.',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
