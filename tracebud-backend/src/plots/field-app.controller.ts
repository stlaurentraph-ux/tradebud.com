import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FieldAccountService } from '../auth/field-account.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { PlotsService } from './plots.service';

@ApiTags('Field app')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller()
export class FieldAppController {
  constructor(
    private readonly plotsService: PlotsService,
    private readonly fieldAccountService: FieldAccountService,
  ) {}

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

  @Post('v1/me/account-password')
  @ApiOperation({
    summary: 'Set or change the signed-in user password (field app)',
  })
  async setAccountPassword(@Body() body: { password?: string }, @Req() req: any) {
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    const password = body.password?.trim();
    if (!password) {
      throw new BadRequestException('password is required');
    }
    await this.fieldAccountService.ensureEmailIdentityForAuthUser(userId);
    await this.fieldAccountService.setPasswordForAuthUser(userId, password);
    return { ok: true };
  }
}
