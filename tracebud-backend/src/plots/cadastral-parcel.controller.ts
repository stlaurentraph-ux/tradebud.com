import { Controller, ForbiddenException, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { CadastralParcelLookupService } from './cadastral-parcel-lookup.service';

const CADASTRAL_LOOKUP_ROLES = new Set([
  'exporter',
  'compliance_manager',
  'cooperative',
  'admin',
  'agent',
  'country_reviewer',
  'farmer',
]);

@ApiTags('Cadastral')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/cadastral/parcels')
export class CadastralParcelController {
  constructor(private readonly lookupService: CadastralParcelLookupService) {}

  private enforceCadastralLookupRole(req: any) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (!role || !CADASTRAL_LOOKUP_ROLES.has(role)) {
      throw new ForbiddenException('Not allowed to query cadastral parcel fixtures');
    }
  }

  @Get('lookup')
  @ApiOperation({
    summary: 'Lookup demo cadastral parcel geometry (HN/GT fixtures)',
    description:
      'Returns fixture polygon metadata for desk mapping cross-check. Production registry integrations land in a later slice.',
  })
  @ApiQuery({ name: 'countryIso', required: true })
  @ApiQuery({ name: 'cadastralKey', required: true })
  lookup(
    @Query('countryIso') countryIso: string,
    @Query('cadastralKey') cadastralKey: string,
    @Req() req: any,
  ) {
    this.enforceCadastralLookupRole(req);
    return this.lookupService.lookup(countryIso, cadastralKey);
  }
}
