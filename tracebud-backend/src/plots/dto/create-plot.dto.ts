import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

const PRODUCTION_SYSTEMS = ['monoculture', 'agroforestry', 'shade_grown', 'silvopasture'] as const;

export class CreatePlotDto {
  @ApiProperty()
  @IsUUID()
  farmerId!: string;

  @ApiProperty()
  @IsString()
  clientPlotId!: string;

  @ApiProperty({
    required: false,
    description: 'Human-readable plot label shown in the workspace inventory.',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    required: false,
    description: 'CRM contact to link when an exporter registers a plot on behalf of a producer.',
  })
  @IsOptional()
  @IsString()
  producerContactId?: string;

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

  @ApiProperty({
    required: false,
    enum: PRODUCTION_SYSTEMS,
    description: 'How the plot is farmed (context for deforestation review).',
  })
  @IsOptional()
  @IsString()
  @IsIn([...PRODUCTION_SYSTEMS])
  productionSystem?: (typeof PRODUCTION_SYSTEMS)[number];

  @ApiProperty({
    required: false,
    description:
      'Advisory field-capture metadata (confidence tier, capture method, optional offline imagery pack).',
  })
  @IsOptional()
  geometryCapture?: Record<string, unknown>;

  @ApiProperty({
    required: false,
    description: 'Active cooperative assignment id when an agent maps on behalf of a roster member.',
  })
  @IsOptional()
  @IsString()
  assignmentId?: string;
}

