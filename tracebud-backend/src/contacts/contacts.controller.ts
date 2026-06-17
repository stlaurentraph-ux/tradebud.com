import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { deriveRoleFromSupabaseUser, deriveTenantIdFromSupabaseUser } from '../auth/roles';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import {
  ContactStatus,
  ContactsService,
  type LegacyContactTypeInput,
  type ProcessingFacilitySubtype,
} from './contacts.service';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  private getTenantId(req: any): string {
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim in app_metadata');
    }
    return tenantId;
  }

  private requireContactAccess(req: any): void {
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (!['admin', 'exporter', 'importer', 'cooperative'].includes(role)) {
      throw new ForbiddenException('This role cannot access contacts.');
    }
  }

  @Get()
  async list(@Req() req: any) {
    this.requireContactAccess(req);
    const tenantId = this.getTenantId(req);
    return this.contactsService.list(tenantId);
  }

  @Post()
  async create(
    @Req() req: any,
    @Body()
    body: {
      full_name?: string;
      email?: string;
      phone?: string | null;
      organization?: string | null;
      contact_type?: LegacyContactTypeInput;
      processing_subtype?: ProcessingFacilitySubtype | null;
      country?: string | null;
      tags?: string[];
      consent_status?: 'unknown' | 'granted' | 'revoked';
    },
  ) {
    this.requireContactAccess(req);
    const tenantId = this.getTenantId(req);
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Invalid payload.');
    }
    return this.contactsService.create(tenantId, body);
  }

  @Get(':id')
  async getById(@Req() req: any, @Param('id') id: string) {
    this.requireContactAccess(req);
    const tenantId = this.getTenantId(req);
    return this.contactsService.getById(tenantId, id);
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      full_name?: string;
      email?: string;
      phone?: string | null;
      organization?: string | null;
      contact_type?: LegacyContactTypeInput;
      processing_subtype?: ProcessingFacilitySubtype | null;
      country?: string | null;
      tags?: string[];
      consent_status?: 'unknown' | 'granted' | 'revoked';
    },
  ) {
    this.requireContactAccess(req);
    const tenantId = this.getTenantId(req);
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Invalid payload.');
    }
    return this.contactsService.update(tenantId, id, body);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    this.requireContactAccess(req);
    const tenantId = this.getTenantId(req);
    return this.contactsService.remove(tenantId, id);
  }

  @Patch(':id/status')
  async updateStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status?: ContactStatus }) {
    this.requireContactAccess(req);
    const tenantId = this.getTenantId(req);
    if (!body.status) {
      throw new BadRequestException('status is required');
    }
    return this.contactsService.updateStatus(tenantId, id, body.status);
  }
}

