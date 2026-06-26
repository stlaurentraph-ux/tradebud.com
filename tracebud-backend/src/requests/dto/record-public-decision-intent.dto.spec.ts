import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { RecordPublicDecisionIntentDto } from './record-public-decision-intent.dto';

describe('RecordPublicDecisionIntentDto', () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  async function validate(payload: Record<string, unknown>) {
    return pipe.transform(payload, {
      type: 'body',
      metatype: RecordPublicDecisionIntentDto,
    });
  }

  it('accepts a valid decision-intent payload', async () => {
    const result = (await validate({
      campaignId: ' camp_1 ',
      recipientEmail: ' farmer@example.com ',
      decision: 'accept',
      token: 'abc123',
    })) as RecordPublicDecisionIntentDto;

    expect(result.campaignId).toBe('camp_1');
    expect(result.recipientEmail).toBe('farmer@example.com');
    expect(result.decision).toBe('accept');
    expect(result.token).toBe('abc123');
  });

  it('rejects unknown fields', async () => {
    await expect(
      validate({
        campaignId: 'camp_1',
        recipientEmail: 'farmer@example.com',
        decision: 'accept',
        token: 'abc123',
        senderTenantId: 'tenant_leak',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid email and decision', async () => {
    await expect(
      validate({
        campaignId: 'camp_1',
        recipientEmail: 'not-an-email',
        decision: 'maybe',
        token: 'abc123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
