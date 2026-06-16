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
import { PlotsService } from './plots.service';

@ApiTags('Field app')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller()
export class FieldAppController {
  constructor(private readonly plotsService: PlotsService) {}

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
    await this.plotsService.bootstrapFieldAppProducer({
      farmerId,
      userId,
      countryCode: body.countryCode?.trim() || 'HN',
      fullName: body.fullName?.trim() || null,
    });
    return { ok: true, farmer_id: farmerId };
  }
}
