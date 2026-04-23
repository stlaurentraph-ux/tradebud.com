import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { AdminService, AdminOrgType, AdminStatus } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private getTenantId(req: any): string {
    const tenantId = req?.user?.app_metadata?.tenant_id ?? req?.user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    return tenantId;
  }

  private requireAdmin(req: any): void {
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role !== 'admin') {
      throw new ForbiddenException('Only admins can manage users and organizations');
    }
  }

  @Get('organizations')
  async listOrganizations(@Req() req: any) {
    this.requireAdmin(req);
    const tenantId = this.getTenantId(req);
    return this.adminService.listOrganizations(tenantId);
  }

  @Post('organizations')
  async createOrganization(
    @Req() req: any,
    @Body() body: { name?: string; type?: AdminOrgType; country?: string },
  ) {
    this.requireAdmin(req);
    const tenantId = this.getTenantId(req);
    if (!body.name || !body.country || !body.type) {
      throw new ForbiddenException('name, type, and country are required');
    }
    return this.adminService.createOrganization(tenantId, {
      name: body.name,
      type: body.type,
      country: body.country,
    });
  }

  @Get('users')
  async listUsers(@Req() req: any) {
    this.requireAdmin(req);
    const tenantId = this.getTenantId(req);
    return this.adminService.listUsers(tenantId);
  }

  @Post('users/invite')
  async inviteUser(
    @Req() req: any,
    @Body() body: { name?: string; email?: string; organisation_id?: string; role?: string },
  ) {
    this.requireAdmin(req);
    const tenantId = this.getTenantId(req);
    if (!body.name || !body.email || !body.organisation_id || !body.role) {
      throw new ForbiddenException('name, email, organisation_id, and role are required');
    }
    return this.adminService.inviteUser(tenantId, {
      name: body.name,
      email: body.email,
      organisation_id: body.organisation_id,
      role: body.role,
    });
  }

  @Patch('users/:id/role')
  async updateUserRole(@Req() req: any, @Param('id') id: string, @Body() body: { role?: string }) {
    this.requireAdmin(req);
    const tenantId = this.getTenantId(req);
    if (!body.role) {
      throw new BadRequestException('role is required');
    }
    return this.adminService.updateUserRole(tenantId, id, body.role);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status?: AdminStatus },
  ) {
    this.requireAdmin(req);
    const tenantId = this.getTenantId(req);
    if (!body.status) {
      throw new BadRequestException('status is required');
    }
    return this.adminService.updateUserStatus(tenantId, id, body.status);
  }
}
