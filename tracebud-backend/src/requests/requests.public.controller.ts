import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequestsService } from './requests.service';

@ApiTags('Requests Public')
@Controller('v1/public/requests')
export class RequestsPublicController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post('campaigns/decision-intent')
  async recordDecisionIntent(
    @Body()
    body: {
      campaignId?: string;
      recipientEmail?: string;
      decision?: 'accept' | 'refuse';
      token?: string;
    },
  ) {
    const campaignId = body?.campaignId?.trim();
    const recipientEmail = body?.recipientEmail?.trim();
    const token = body?.token?.trim();
    if (!campaignId || !recipientEmail || !token) {
      throw new BadRequestException('campaignId, recipientEmail, and token are required.');
    }
    const decision = body?.decision;
    if (decision !== 'accept' && decision !== 'refuse') {
      throw new BadRequestException('decision must be either "accept" or "refuse".');
    }
    return this.requestsService.recordDecisionIntentPublic({
      campaignId,
      recipientEmail,
      decision,
      token,
    });
  }
}

