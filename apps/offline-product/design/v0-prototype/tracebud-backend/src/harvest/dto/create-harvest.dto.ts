import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateHarvestDto {
  @ApiProperty()
  @IsUUID()
  farmerId!: string;

  @ApiProperty()
  @IsUUID()
  plotId!: string;

  @ApiProperty()
  @IsNumber()
  kg!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  harvestDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

