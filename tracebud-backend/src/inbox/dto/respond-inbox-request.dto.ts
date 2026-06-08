import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class RespondInboxRequestDto {
  @ApiPropertyOptional({ description: 'Optional fulfillment notes for the sender organization.' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Plot evidence references attached to this fulfillment response.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  evidencePlotIds?: string[];

  @ApiPropertyOptional({
    description: 'DDS package / shipment references attached to this fulfillment response.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  evidencePackageIds?: string[];
}
