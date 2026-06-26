import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RecordPublicDecisionIntentDto {
  @ApiProperty({ example: 'camp_abc123' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  campaignId!: string;

  @ApiProperty({ example: 'farmer@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  @MaxLength(320)
  recipientEmail!: string;

  @ApiProperty({ enum: ['accept', 'refuse'] })
  @IsIn(['accept', 'refuse'])
  decision!: 'accept' | 'refuse';

  @ApiProperty({ description: 'HMAC decision token from campaign email CTA' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  token!: string;
}
