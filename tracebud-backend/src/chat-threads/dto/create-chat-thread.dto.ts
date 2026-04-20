import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateChatThreadDto {
  @ApiProperty({ description: 'Record identifier this thread is linked to' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  recordId!: string;

  @ApiProperty({ description: 'Initial thread message body' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message!: string;

  @ApiProperty({ required: false, description: 'Client idempotency key for replay-safe initial message create' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  idempotencyKey?: string;
}
