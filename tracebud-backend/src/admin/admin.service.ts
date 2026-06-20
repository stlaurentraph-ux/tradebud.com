import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';

export type AdminOrgType = 'COOPERATIVE' | 'EXPORTER' | 'IMPORTER';
export type AdminStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

export interface AdminOrganization {
  id: string;
  name: string;
  type: AdminOrgType;
  country: string;
  status: AdminStatus;
  created_at: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  organisation_id: string;
  roles: string[];
  status: AdminStatus;
  invited_at: string;
  last_login_at: string | null;
}

@Injectable()
export class AdminService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listOrganizations(tenantId: string): Promise<AdminOrganization[]> {
    const result = await this.pool.query<AdminOrganization>(
      `
        SELECT id, name, type, country, status, created_at
        FROM admin_organizations
        WHERE tenant_id = $1
        ORDER BY created_at DESC
      `,
      [tenantId],
    );
    return result.rows;
  }

  async listUsers(tenantId: string): Promise<AdminUser[]> {
    const result = await this.pool.query<AdminUser>(
      `
        SELECT id, name, email, organisation_id, roles, status, invited_at, last_login_at
        FROM admin_users
        WHERE tenant_id = $1
        ORDER BY invited_at DESC
      `,
      [tenantId],
    );
    return result.rows;
  }

  async createOrganization(
    tenantId: string,
    input: { name: string; type: AdminOrgType; country: string },
  ): Promise<AdminOrganization> {
    const result = await this.pool.query<AdminOrganization>(
      `
        INSERT INTO admin_organizations (id, tenant_id, name, type, country, status, created_at)
        VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW())
        RETURNING id, name, type, country, status, created_at
      `,
      [`org_${Date.now()}`, tenantId, input.name.trim(), input.type, input.country.trim().toUpperCase()],
    );
    return result.rows[0];
  }

  async inviteUser(
    tenantId: string,
    input: { name: string; email: string; organisation_id: string; role: string },
  ): Promise<AdminUser> {
    const result = await this.pool.query<AdminUser>(
      `
        INSERT INTO admin_users (
          id, tenant_id, name, email, organisation_id, roles, status, invited_at, last_login_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::TEXT[], 'PENDING', NOW(), NULL)
        RETURNING id, name, email, organisation_id, roles, status, invited_at, last_login_at
      `,
      [
        `usr_${Date.now()}`,
        tenantId,
        input.name.trim(),
        input.email.trim().toLowerCase(),
        input.organisation_id,
        [input.role],
      ],
    );
    return result.rows[0];
  }

  async updateUserRole(tenantId: string, userId: string, role: string): Promise<AdminUser> {
    const result = await this.pool.query<AdminUser>(
      `
        UPDATE admin_users
        SET roles = $1::TEXT[]
        WHERE tenant_id = $2 AND id = $3
        RETURNING id, name, email, organisation_id, roles, status, invited_at, last_login_at
      `,
      [[role], tenantId, userId],
    );
    if (!result.rows[0]) {
      throw new NotFoundException('User not found.');
    }
    return result.rows[0];
  }

  async updateUserStatus(tenantId: string, userId: string, status: AdminStatus): Promise<AdminUser> {
    const result = await this.pool.query<AdminUser>(
      `
        UPDATE admin_users
        SET status = $1
        WHERE tenant_id = $2 AND id = $3
        RETURNING id, name, email, organisation_id, roles, status, invited_at, last_login_at
      `,
      [status, tenantId, userId],
    );
    if (!result.rows[0]) {
      throw new NotFoundException('User not found.');
    }
    return result.rows[0];
  }
}
