import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { OnboardingEmailService } from '../launch/onboarding-email.service';
import { PlotsService } from './plots.service';

@ApiTags('Field app')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller()
export class FieldAppController {
  constructor(
    private readonly plotsService: PlotsService,
    private readonly onboardingEmail: OnboardingEmailService,
  ) {}

  @Post('v1/me/field-app-bootstrap')
  @ApiOperation({
    summary: 'Link local field-app farmer id to the signed-in Supabase user',
  })
  async bootstrapFieldApp(
    @Body() body: { farmerId?: string; fullName?: string; countryCode?: string },
    @Req() req: any,
  ) {
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    const farmerId = body.farmerId?.trim();
    if (!farmerId) {
      throw new BadRequestException('farmerId is required');
    }
    const email = typeof req.user?.email === 'string' ? req.user.email : '';
    const fullName =
      body.fullName?.trim() ||
      (typeof req.user?.user_metadata?.full_name === 'string'
        ? req.user.user_metadata.full_name
        : typeof req.user?.user_metadata?.fullName === 'string'
          ? req.user.user_metadata.fullName
          : null);
    const { created } = await this.plotsService.bootstrapFieldAppProducer({
      farmerId,
      userId,
      countryCode: body.countryCode?.trim() || 'HN',
      fullName,
    });
    if (created && email) {
      void this.onboardingEmail
        .sendFarmerWelcomeAfterFieldSignup({
          userId,
          farmerId,
          email,
          fullName,
        })
        .catch(() => undefined);
    }
    const ownedFarmerIds = await this.plotsService.listFarmerProfileIdsForAuthUser(userId);
    return { ok: true, farmer_id: farmerId, owned_farmer_ids: ownedFarmerIds };
  }
}
