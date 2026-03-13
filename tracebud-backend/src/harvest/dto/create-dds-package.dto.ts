import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, ArrayNotEmpty, ArrayMaxSize } from 'class-validator';

export class CreateDdsPackageDto {
  @ApiProperty({
    description: 'Voucher IDs to include in this DDS package (max 100)',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  voucherIds!: string[];

  @ApiProperty({
    required: false,
    description: 'Optional human-readable label for this package',
  })
  @IsOptional()
  @IsString()
  label?: string;
}

