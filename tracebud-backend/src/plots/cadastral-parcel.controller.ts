import { Controller, ForbiddenException, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CadastralParcelLookupService } from './cadastral-parcel-lookup.service';

const CADASTRAL_LOOKUP_ROLES = [
  'farmer',
  'agent',
  'exporter',
  'cooperative',
  'compliance_manager',
  'admin',
  'country_reviewer',
] as const;

@ApiTags('Cadastral')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller()
export class CadastralParcelController {
  constructor(private readonly lookupService: CadastralParcelLookupService) {}

  private assertCadastralLookupRole(req: any): void {
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (!role || !(CADASTRAL_LOOKUP_ROLES as readonly string[]).includes(role)) {
      throw new ForbiddenException('This role cannot look up cadastral parcels.');
    }
  }

  @Get('v1/cadastral/parcels/lookup')
  @ApiOperation({
    summary: 'Look up parcel boundary geometry by cadastral reference',
    description:
      'Returns registry polygon when available. Demo deployments ship fixture parcels only; live country adapters plug in behind the same contract.',
  })
  @ApiQuery({ name: 'countryCode', required: true, example: 'HN' })
  @ApiQuery({ name: 'cadastralKey', required: true, example: '012-345-678-9' })
  async lookupParcel(
    @Query('countryCode') countryCode: string | undefined,
    @Query('cadastralKey') cadastralKey: string | undefined,
    @Req() req: unknown,
  ) {
    this.assertCadastralLookupRole(req);
    const country = countryCode?.trim();
    const key = cadastralKey?.trim();
    if (!country || !key) {
      return {
        found: false as const,
        code: 'CADASTRAL_PARCEL_NOT_FOUND' as const,
        message: 'countryCode and cadastralKey are required.',
      };
    }
    return this.lookupService.lookup({ countryCode: country, cadastralKey: key });
  }
}
