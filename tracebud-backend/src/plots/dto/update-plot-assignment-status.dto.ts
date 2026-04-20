import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePlotAssignmentStatusDto {
  @ApiProperty({ required: false, description: 'Optional reason for assignment transition' })
  @IsOptional()
  @IsString()
  reason?: string;
}
