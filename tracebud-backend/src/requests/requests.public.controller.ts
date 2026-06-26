import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RecordPublicDecisionIntentDto } from './dto/record-public-decision-intent.dto';
import { RequestsService } from './requests.service';

@ApiTags('Requests Public')
@Controller('v1/public/requests')
export class RequestsPublicController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post('campaigns/decision-intent')
  async recordDecisionIntent(@Body() body: RecordPublicDecisionIntentDto) {
    return this.requestsService.recordDecisionIntentPublic({
      campaignId: body.campaignId,
      recipientEmail: body.recipientEmail,
      decision: body.decision,
      token: body.token,
    });
  }
}

