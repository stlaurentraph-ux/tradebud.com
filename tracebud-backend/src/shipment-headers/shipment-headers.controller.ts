import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveTenantIdFromSupabaseUser } from '../auth/roles';
import { resolveDashboardRole } from '../billing/billing-access';
import { ShipmentHeadersService } from './shipment-headers.service';

const SHIPMENT_WRITE_ROLES = new Set(['exporter', 'cooperative', 'admin', 'compliance_manager']);

@ApiTags('Shipment Headers')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/shipment-headers')
export class ShipmentHeadersController {
  constructor(private readonly shipmentHeadersService: ShipmentHeadersService) {}

  private requireTenantId(req: { user?: Record<string, unknown> }): string {
    const tenantId = deriveTenantIdFromSupabaseUser(req.user);
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    return tenantId;
  }

  @Get()
  @ApiOperation({ summary: 'List shipment headers for tenant' })
  async list(@Req() req: any) {
    const tenantId = this.requireTenantId(req);
    const shipments = await this.shipmentHeadersService.listForTenant(tenantId);
    return { shipments };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipment header detail' })
  async getOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.requireTenantId(req);
    const shipment = await this.shipmentHeadersService.getById(tenantId, id);
    return { shipment };
  }

  @Post()
  @ApiOperation({ summary: 'Create shipment header from batches' })
  async create(
    @Body()
    body: {
      externalId?: string;
      shipmentReference?: string;
      label?: string;
      packageIds?: string[];
      declaredQuantityKg?: number;
      coveredQuantityKg?: number;
    },
    @Req() req: any,
  ) {
    const tenantId = this.requireTenantId(req);
    const role = resolveDashboardRole(req.user);
    if (!SHIPMENT_WRITE_ROLES.has(role)) {
      throw new ForbiddenException('Insufficient permissions to create shipments.');
    }

    const shipment = await this.shipmentHeadersService.createShipmentHeader({
      tenantId,
      externalId: body.externalId?.trim(),
      shipmentReference: body.shipmentReference?.trim() || `SHP-${Date.now()}`,
      label: body.label?.trim() || 'Shipment',
      packageIds: Array.isArray(body.packageIds) ? body.packageIds : [],
      declaredQuantityKg: Number(body.declaredQuantityKg),
      coveredQuantityKg: Number(body.coveredQuantityKg),
    });

    return { shipment };
  }

  @Post(':id/seal')
  @ApiOperation({ summary: 'Seal shipment header and meter origin usage (€1)' })
  async seal(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.requireTenantId(req);
    const role = resolveDashboardRole(req.user);
    if (!SHIPMENT_WRITE_ROLES.has(role)) {
      throw new ForbiddenException('Insufficient permissions to seal shipments.');
    }

    const shipment = await this.shipmentHeadersService.sealShipmentHeader(tenantId, id);
    return { shipment };
  }
}
