import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class ConfirmDeliveryHandoffDto {
  @ApiProperty({ description: 'Voucher qr_code_ref or trip ref (T-…)' })
  @IsString()
  @MinLength(3)
  intakeRef!: string;

  @ApiProperty({ description: 'Weight physically received at handoff (kg)' })
  @IsNumber()
  @Min(0.01)
  receivedKg!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
