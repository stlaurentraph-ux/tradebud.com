import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { PlotsService } from './plots.service';

@ApiTags('Field app')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller()
export class FieldAppController {
  constructor(private readonly plotsService: PlotsService) {}

  @Get('v1/me/field-farmer-ids')
  @ApiOperation({
    summary: 'List farmer profile ids owned by the signed-in Supabase user',
  })
  async listFieldFarmerIds(@Req() req: any) {
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    const farmerIds = await this.plotsService.listFarmerProfileIdsForAuthUser(userId);
    return { farmerIds };
  }

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
      email,
    });
    const ownedFarmerIds = await this.plotsService.listFarmerProfileIdsForAuthUser(userId);
    return { ok: true, farmer_id: farmerId, owned_farmer_ids: ownedFarmerIds };
  }

  @Get('v1/me/field-sync-delta')
  @ApiOperation({
    summary: 'Compact field restore cursor (plots, vouchers, audit watermarks)',
    description:
      'Optional `since` epoch-ms filters plot updates; vouchers and audit watermarks are always included for linked farmers.',
  })
  @ApiQuery({
    name: 'since',
    required: false,
    description: 'Epoch milliseconds — return plots updated on/after this instant',
  })
  async fieldSyncDelta(@Query('since') sinceRaw: string | undefined, @Req() req: any) {
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    return this.plotsService.buildFieldSyncDeltaForAuthUser(userId, sinceRaw);
  }
}
