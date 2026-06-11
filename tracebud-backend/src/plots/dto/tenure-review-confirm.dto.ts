import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class TenureReviewConfirmDto {
  @ApiProperty({ description: 'Human adjudication reason (min 8 characters)' })
  @IsString()
  @MinLength(8)
  reason!: string;

  @ApiPropertyOptional({ description: 'Optional reviewer note stored on parse result' })
  @IsOptional()
  @IsString()
  note?: string | null;
}
