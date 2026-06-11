import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class PlotReviewDecisionDto {
  @ApiProperty({
    description: 'Auditable reason for the review decision',
    example: 'Ground-truth photos confirm agroforestry canopy on registered plot.',
  })
  @IsString()
  @MinLength(8)
  reason!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
