import { BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { StripeBillingService } from './stripe-billing.service';

describe('StripeBillingService.constructWebhookEvent', () => {
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  afterEach(() => {
    if (originalSecret) process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
    else delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it('verifies a signed webhook payload', () => {
    const service = new StripeBillingService();
    const payload = JSON.stringify({
      id: 'evt_1',
      type: 'invoice.paid',
      data: { object: { id: 'in_1' } },
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac('sha256', 'whsec_test_secret')
      .update(`${timestamp}.${payload}`, 'utf8')
      .digest('hex');

    const event = service.constructWebhookEvent(
      payload,
      `t=${timestamp},v1=${signature}`,
    );

    expect(event.type).toBe('invoice.paid');
    expect(event.data.object.id).toBe('in_1');
  });

  it('rejects invalid signatures', () => {
    const service = new StripeBillingService();
    const payload = '{"id":"evt_1","type":"invoice.paid","data":{"object":{"id":"in_1"}}}';
    const timestamp = Math.floor(Date.now() / 1000);

    expect(() =>
      service.constructWebhookEvent(payload, `t=${timestamp},v1=deadbeef`),
    ).toThrow(BadRequestException);
  });
});
