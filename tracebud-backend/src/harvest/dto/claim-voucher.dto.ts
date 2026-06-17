import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ClaimVoucherDto {
  @ApiProperty({ description: 'Voucher qr_code_ref (e.g. V-ABC12345)' })
  @IsString()
  @MinLength(3)
  qrRef!: string;
}
