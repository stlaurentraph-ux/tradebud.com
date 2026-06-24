import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateAuditEventDto } from './create-audit-event.dto';

export class CreateAuditBatchDto {
  @ApiProperty({ type: [CreateAuditEventDto], maxItems: 20 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateAuditEventDto)
  events!: CreateAuditEventDto[];
}
