import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SubmitDdsPackageDto {
  @ApiProperty({
    description: 'Client idempotency key used for replay-safe submission requests',
    example: 'subm-20260416-tenant1-pkg1-attempt1',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  idempotencyKey!: string;
}
