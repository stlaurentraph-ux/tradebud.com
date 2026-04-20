import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class PostChatMessageDto {
  @ApiProperty({ description: 'Thread message body' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message!: string;

  @ApiProperty({ required: false, description: 'Client idempotency key for replay-safe message post' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  idempotencyKey?: string;
}
