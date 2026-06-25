import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAuditEventDto {
  @ApiProperty({ example: 'offline_declaration_bundle' })
  @IsString()
  @MaxLength(120)
  eventType!: string;

  @ApiProperty({
    description: 'JSON-serializable payload; include farmerId for list filtering.',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  payload!: Record<string, unknown>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  deviceId?: string;

  @ApiProperty({
    required: false,
    description: 'Stable idempotency key from the field app (also stored in payload.clientEventId).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  clientEventId?: string;
}
