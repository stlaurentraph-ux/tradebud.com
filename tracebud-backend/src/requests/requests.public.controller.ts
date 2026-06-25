import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { observePublicPreviewLookup } from '../observability/public-preview-observability';
import { RequestsService } from './requests.service';

@ApiTags('Requests Public')
@Controller('v1/public/requests')
export class RequestsPublicController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get('campaigns/:campaignId/invite')
  @ApiOperation({
    summary: 'Validate campaign invite token for field-auth landing',
  })
  async getCampaignInvitePreview(
    @Param('campaignId') campaignId: string,
    @Query('token') token?: string,
  ) {
    if (!token?.trim()) {
      throw new BadRequestException('token is required.');
    }
    try {
      const preview = await this.requestsService.getCampaignInvitePublicPreview(campaignId, token);
      return { preview };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Campaign invite not found');
    }
  }

  @Get('campaigns/:campaignId/preview')
  @ApiOperation({
    summary: 'Public campaign invite preview for field-app smart links',
    description:
      'Returns org name, request title, and due date for a sent campaign. Used before farmer sign-in.',
  })
  async getCampaignPreview(@Param('campaignId') campaignId: string) {
    const startedAt = Date.now();
    const normalized = campaignId.trim();
    try {
      const preview = await this.requestsService.getCampaignPublicPreview(normalized);
      observePublicPreviewLookup({
        surface: 'campaign_invite',
        ref: normalized,
        outcome: 'found',
        durationMs: Date.now() - startedAt,
      });
      return { preview };
    } catch (error) {
      observePublicPreviewLookup({
        surface: 'campaign_invite',
        ref: normalized,
        outcome: 'not_found',
        durationMs: Date.now() - startedAt,
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Campaign not found');
    }
  }

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
