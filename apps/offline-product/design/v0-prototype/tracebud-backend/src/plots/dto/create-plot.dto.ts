import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePlotDto {
  @ApiProperty()
  @IsUUID()
  farmerId!: string;

  @ApiProperty()
  @IsString()
  clientPlotId!: string;

  @ApiProperty({
    description:
      'GeoJSON Point or Polygon in WGS84. Example: { "type": "Point", "coordinates": [-87.123456, 14.123456] }',
  })
  geometry!: any;

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
    description: 'Local-only cadastral reference, e.g. Clave Catastral',
  })
  @IsOptional()
  @IsString()
  cadastralKey?: string;

  @ApiProperty({
    required: false,
    description: 'Optional land title photo metadata array from the device',
    type: 'array',
    items: { type: 'object' },
  })
  @IsOptional()
  @IsArray()
  landTitlePhotos?: any[];
}

