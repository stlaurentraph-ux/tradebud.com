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

  private schemaReady = false;

  private async ensureSchema() {
    if (this.schemaReady) return;
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS admin_organizations (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('COOPERATIVE', 'EXPORTER', 'IMPORTER')),
        country TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PENDING', 'SUSPENDED')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        organisation_id TEXT NOT NULL,
        roles TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PENDING', 'SUSPENDED')),
        invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMPTZ NULL
      )
    `);
    this.schemaReady = true;
  }

  async listOrganizations(tenantId: string): Promise<AdminOrganization[]> {
    await this.ensureSchema();
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
    await this.ensureSchema();
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
    await this.ensureSchema();
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
    await this.ensureSchema();
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
    await this.ensureSchema();
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
    await this.ensureSchema();
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
