import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';

import { PG_POOL } from '../db/db.module';
import {
  buildEnumerationContactTags,
  dedupePackMembers,
  nationalIdFromContactTags,
  normalizePhone,
  provisionalContactEmail,
  villageFromContactTags,
} from './field-enumeration-pack';
import type {
  FieldEnumerationMappingRegion,
  FieldEnumerationPackResponse,
  SyncEnumerationProvisionalDto,
  SyncEnumerationProvisionalResult,
} from './field-enumeration-pack.types';
import { parseMappingRegionRow } from './resolve-enumeration-mapping-region';
import { summarizeEnumerationProgress, validateMappingRegionInput, type EnumerationCampaignProgress } from './field-enumeration-progress';
import { PlotsService } from './plots.service';

type ContactRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  tags: string[] | null;
  farmer_profile_id: string | null;
};

@Injectable()
export class FieldEnumerationService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly plotsService: PlotsService,
  ) {}

  async getPackForAgent(
    tenantId: string,
    campaignId?: string | null,
  ): Promise<FieldEnumerationPackResponse> {
    const normalizedCampaignId = campaignId?.trim() || null;
    let campaignTitle: string | null = null;
    let mappingRegion: FieldEnumerationMappingRegion | null = null;
    let farmerIds: string[] = [];
    let contactEmails: string[] = [];

    if (normalizedCampaignId) {
      const campaignRes = await this.pool.query<{
        id: string;
        title: string;
        target_farmer_ids: string[] | null;
        target_contact_emails: string[] | null;
        mapping_region_label: string | null;
        mapping_region_west: number | null;
        mapping_region_south: number | null;
        mapping_region_east: number | null;
        mapping_region_north: number | null;
      }>(
        `
          SELECT
            id,
            title,
            target_farmer_ids,
            target_contact_emails,
            mapping_region_label,
            mapping_region_west,
            mapping_region_south,
            mapping_region_east,
            mapping_region_north
          FROM request_campaigns
          WHERE id = $1
            AND tenant_id = $2
          LIMIT 1
        `,
        [normalizedCampaignId, tenantId],
      );
      const campaign = campaignRes.rows[0];
      if (!campaign) {
        throw new NotFoundException('Campaign not found for this workspace');
      }
      campaignTitle = campaign.title;
      mappingRegion = parseMappingRegionRow(campaign);
      farmerIds = (campaign.target_farmer_ids ?? []).map((id) => String(id).trim()).filter(Boolean);
      contactEmails = (campaign.target_contact_emails ?? [])
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
    }

    const members: FieldEnumerationPackResponse['members'] = [];

    if (farmerIds.length > 0) {
      const farmerRes = await this.pool.query<ContactRow & { plot_count: string }>(
        `
          SELECT
            cc.id,
            cc.full_name,
            cc.email,
            cc.phone,
            cc.organization,
            cc.tags,
            cc.farmer_profile_id,
            COALESCE((
              SELECT COUNT(*)::text
              FROM plot p
              WHERE p.farmer_id = cc.farmer_profile_id
            ), '0') AS plot_count
          FROM crm_contacts cc
          WHERE cc.tenant_id = $1
            AND cc.farmer_profile_id = ANY($2::uuid[])
        `,
        [tenantId, farmerIds],
      );
      for (const row of farmerRes.rows) {
        if (!row.farmer_profile_id) continue;
        members.push(this.mapContactToPackMember(row));
      }

      const missingFarmerIds = farmerIds.filter(
        (id) => !members.some((member) => member.farmerId === id),
      );
      if (missingFarmerIds.length > 0) {
        const profileRes = await this.pool.query<{
          id: string;
          name: string | null;
          plot_count: string;
        }>(
          `
            SELECT
              fp.id,
              ua.name,
              COALESCE((
                SELECT COUNT(*)::text
                FROM plot p
                WHERE p.farmer_id = fp.id
              ), '0') AS plot_count
            FROM farmer_profile fp
            LEFT JOIN user_account ua ON ua.id = fp.user_id
            WHERE fp.id = ANY($1::uuid[])
          `,
          [missingFarmerIds],
        );
        for (const row of profileRes.rows) {
          members.push({
            farmerId: String(row.id),
            fullName: row.name?.trim() || 'Producer',
            village: null,
            phone: null,
            nationalId: null,
            email: null,
            producerContactId: null,
            assignmentId: null,
            plotCount: Number(row.plot_count ?? 0),
            source: 'roster',
          });
        }
      }
    }

    if (contactEmails.length > 0) {
      const emailRes = await this.pool.query<ContactRow & { plot_count: string }>(
        `
          SELECT
            cc.id,
            cc.full_name,
            cc.email,
            cc.phone,
            cc.organization,
            cc.tags,
            cc.farmer_profile_id,
            COALESCE((
              SELECT COUNT(*)::text
              FROM plot p
              WHERE p.farmer_id = cc.farmer_profile_id
            ), '0') AS plot_count
          FROM crm_contacts cc
          WHERE cc.tenant_id = $1
            AND LOWER(cc.email) = ANY($2::text[])
            AND cc.contact_type = 'farmer'
        `,
        [tenantId, contactEmails],
      );
      for (const row of emailRes.rows) {
        if (!row.farmer_profile_id) continue;
        members.push(this.mapContactToPackMember(row));
      }
    }

    if (!normalizedCampaignId) {
      const allFarmersRes = await this.pool.query<ContactRow & { plot_count: string }>(
        `
          SELECT
            cc.id,
            cc.full_name,
            cc.email,
            cc.phone,
            cc.organization,
            cc.tags,
            cc.farmer_profile_id,
            COALESCE((
              SELECT COUNT(*)::text
              FROM plot p
              WHERE p.farmer_id = cc.farmer_profile_id
            ), '0') AS plot_count
          FROM crm_contacts cc
          WHERE cc.tenant_id = $1
            AND cc.contact_type = 'farmer'
            AND cc.farmer_profile_id IS NOT NULL
          ORDER BY cc.full_name ASC
          LIMIT 500
        `,
        [tenantId],
      );
      for (const row of allFarmersRes.rows) {
        members.push(this.mapContactToPackMember(row));
      }
    }

    if (!mappingRegion) {
      mappingRegion = await this.resolveDefaultMappingRegion(tenantId, normalizedCampaignId);
    }

    return {
      campaignId: normalizedCampaignId,
      campaignTitle,
      mappingRegion,
      prefetchedAt: new Date().toISOString(),
      members: dedupePackMembers(members),
    };
  }

  private async resolveDefaultMappingRegion(
    tenantId: string,
    campaignId: string | null,
  ): Promise<FieldEnumerationMappingRegion | null> {
    try {
      const result = await this.pool.query<{
        mapping_region_label: string | null;
        mapping_region_west: number | null;
        mapping_region_south: number | null;
        mapping_region_east: number | null;
        mapping_region_north: number | null;
      }>(
        `
          SELECT
            mapping_region_label,
            mapping_region_west,
            mapping_region_south,
            mapping_region_east,
            mapping_region_north
          FROM request_campaigns
          WHERE tenant_id = $1
            AND status IN ('RUNNING', 'QUEUED')
            AND request_type = 'MISSING_PLOT_GEOMETRY'
            AND mapping_region_label IS NOT NULL
            AND ($2::text IS NULL OR id <> $2::text)
          ORDER BY updated_at DESC
          LIMIT 1
        `,
        [tenantId, campaignId],
      );
      return parseMappingRegionRow(result.rows[0] ?? {});
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42703' || code === '42P01') {
        return null;
      }
      throw error;
    }
  }

  async syncProvisionalMember(
    userId: string,
    tenantId: string,
    dto: SyncEnumerationProvisionalDto,
  ): Promise<SyncEnumerationProvisionalResult> {
    const farmerId = dto.farmerId?.trim();
    const fullName = dto.fullName?.trim();
    const village = dto.village?.trim();
    if (!farmerId || !fullName || !village) {
      throw new BadRequestException('farmerId, fullName, and village are required');
    }
    const phone = normalizePhone(dto.phone);
    const nationalId = dto.nationalId?.trim() || null;
    const emailInput = dto.email?.trim().toLowerCase() || null;
    if (!phone && !nationalId && !emailInput) {
      throw new BadRequestException('phone, nationalId, or email is required');
    }

    const duplicateWarnings = await this.findProvisionalDuplicateWarnings(tenantId, {
      phone,
      nationalId,
      email: emailInput,
      fullName,
      village,
    });

    await this.plotsService.ensureDelegatedProducerProfile(farmerId, userId, {
      tenantId,
      producerDisplayName: fullName,
    });

    const contactEmail = emailInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)
      ? emailInput
      : provisionalContactEmail(farmerId);
    const tags = buildEnumerationContactTags({
      village,
      nationalId,
      provisional: true,
    });

    const contactId = `contact_enum_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const upsert = await this.pool.query<{ id: string }>(
      `
        INSERT INTO crm_contacts (
          id,
          tenant_id,
          full_name,
          email,
          phone,
          organization,
          contact_type,
          status,
          country,
          tags,
          consent_status,
          farmer_profile_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'farmer', 'engaged', NULL, $7::text[], 'unknown', $8::uuid)
        ON CONFLICT (tenant_id, email)
        DO UPDATE SET
          full_name = EXCLUDED.full_name,
          phone = COALESCE(EXCLUDED.phone, crm_contacts.phone),
          organization = EXCLUDED.organization,
          tags = (
            SELECT ARRAY(
              SELECT DISTINCT unnest(
                COALESCE(crm_contacts.tags, ARRAY[]::text[]) || EXCLUDED.tags
              )
            )
          ),
          farmer_profile_id = COALESCE(crm_contacts.farmer_profile_id, EXCLUDED.farmer_profile_id),
          status = CASE
            WHEN crm_contacts.status IN ('inactive', 'blocked') THEN crm_contacts.status
            ELSE 'engaged'
          END,
          updated_at = NOW()
        RETURNING id
      `,
      [contactId, tenantId, fullName, contactEmail, phone, village, tags, farmerId],
    );

    const producerContactId = upsert.rows[0]?.id ?? null;
    if (producerContactId) {
      await this.pool.query(
        `
          UPDATE crm_contacts
          SET farmer_profile_id = $1, updated_at = NOW()
          WHERE tenant_id = $2
            AND id = $3
        `,
        [farmerId, tenantId, producerContactId],
      );
    }

    return {
      ok: true,
      farmerId,
      producerContactId,
      duplicateWarnings,
    };
  }

  private mapContactToPackMember(row: ContactRow & { plot_count: string }) {
    const village =
      villageFromContactTags(row.tags) ?? (row.organization?.trim() || null);
    return {
      farmerId: String(row.farmer_profile_id),
      fullName: row.full_name?.trim() || 'Producer',
      village,
      phone: normalizePhone(row.phone),
      nationalId: nationalIdFromContactTags(row.tags),
      email: row.email?.includes('@tracebud.field.local') ? null : row.email,
      producerContactId: row.id,
      assignmentId: null,
      plotCount: Number(row.plot_count ?? 0),
      source: 'roster' as const,
    };
  }

  private async findProvisionalDuplicateWarnings(
    tenantId: string,
    input: {
      phone: string | null;
      nationalId: string | null;
      email: string | null;
      fullName: string;
      village: string;
    },
  ): Promise<SyncEnumerationProvisionalResult['duplicateWarnings']> {
    const warnings: SyncEnumerationProvisionalResult['duplicateWarnings'] = [];

    if (input.phone) {
      const phoneRes = await this.pool.query<{ id: string }>(
        `
          SELECT id
          FROM crm_contacts
          WHERE tenant_id = $1
            AND phone IS NOT NULL
            AND regexp_replace(phone, '\\s+', ' ', 'g') = $2
          LIMIT 3
        `,
        [tenantId, input.phone],
      );
      for (const row of phoneRes.rows) {
        warnings.push({ reason: 'phone', producerContactId: row.id });
      }
    }

    if (input.email) {
      const emailRes = await this.pool.query<{ id: string }>(
        `
          SELECT id
          FROM crm_contacts
          WHERE tenant_id = $1
            AND LOWER(email) = LOWER($2)
          LIMIT 3
        `,
        [tenantId, input.email],
      );
      for (const row of emailRes.rows) {
        warnings.push({ reason: 'email', producerContactId: row.id });
      }
    }

    if (input.nationalId) {
      const tag = `enumeration:national_id:${input.nationalId}`;
      const idRes = await this.pool.query<{ id: string }>(
        `
          SELECT id
          FROM crm_contacts
          WHERE tenant_id = $1
            AND tags @> ARRAY[$2]::text[]
          LIMIT 3
        `,
        [tenantId, tag],
      );
      for (const row of idRes.rows) {
        warnings.push({ reason: 'national_id', producerContactId: row.id });
      }
    }

    const nameRes = await this.pool.query<{ id: string }>(
      `
        SELECT id
        FROM crm_contacts
        WHERE tenant_id = $1
          AND LOWER(full_name) = LOWER($2)
          AND (
            organization = $3
            OR tags @> ARRAY[$4]::text[]
          )
        LIMIT 3
      `,
      [tenantId, input.fullName, input.village, `enumeration:village:${input.village}`],
    );
    for (const row of nameRes.rows) {
      warnings.push({ reason: 'name_village', producerContactId: row.id });
    }

    return warnings;
  }

  async updateCampaignMappingRegion(
    tenantId: string,
    campaignId: string,
    input: {
      label?: string | null;
      west?: number | null;
      south?: number | null;
      east?: number | null;
      north?: number | null;
    },
  ): Promise<{ campaign_id: string; mappingRegion: FieldEnumerationMappingRegion }> {
    const normalizedCampaignId = campaignId.trim();
    if (!normalizedCampaignId) {
      throw new BadRequestException('campaignId is required');
    }
    let regionInput: ReturnType<typeof validateMappingRegionInput>;
    try {
      regionInput = validateMappingRegionInput(input);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid mapping region');
    }

    try {
      const result = await this.pool.query<{ id: string }>(
        `
          UPDATE request_campaigns
          SET
            mapping_region_label = $1,
            mapping_region_west = $2,
            mapping_region_south = $3,
            mapping_region_east = $4,
            mapping_region_north = $5,
            updated_at = NOW()
          WHERE tenant_id = $6
            AND id = $7
          RETURNING id
        `,
        [
          regionInput.label,
          regionInput.west,
          regionInput.south,
          regionInput.east,
          regionInput.north,
          tenantId,
          normalizedCampaignId,
        ],
      );
      if (!result.rows[0]) {
        throw new NotFoundException('Campaign not found for this workspace');
      }
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42703') {
        throw new BadRequestException(
          'Mapping region columns are not migrated yet. Apply tb_v16_062_enumeration_mapping_region.sql.',
        );
      }
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw error;
    }

    return {
      campaign_id: normalizedCampaignId,
      mappingRegion: {
        label: regionInput.label,
        bbox: {
          west: regionInput.west,
          south: regionInput.south,
          east: regionInput.east,
          north: regionInput.north,
        },
      },
    };
  }

  async getCampaignProgressForDesk(
    tenantId: string,
    campaignId: string,
  ): Promise<EnumerationCampaignProgress> {
    const pack = await this.getPackForAgent(tenantId, campaignId);
    const farmerIds = pack.members.map((member) => member.farmerId).filter(Boolean);
    const geometryPendingByFarmer = await this.loadGeometryPendingByFarmer(tenantId, farmerIds);
    const provisionalPendingReview = await this.countProvisionalContacts(tenantId);
    const provisionalFarmerIds = await this.loadProvisionalFarmerIds(tenantId);

    const members = pack.members.map((member) => ({
      ...member,
      isProvisional: provisionalFarmerIds.has(member.farmerId),
      geometryPendingApproval: geometryPendingByFarmer.get(member.farmerId) ?? 0,
    }));

    return summarizeEnumerationProgress({
      campaignId: campaignId.trim(),
      campaignTitle: pack.campaignTitle ?? 'Mapping campaign',
      mappingRegionConfigured: Boolean(pack.mappingRegion),
      mappingRegion: pack.mappingRegion,
      provisionalPendingReview,
      members,
    });
  }

  private async countProvisionalContacts(tenantId: string): Promise<number> {
    try {
      const result = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM crm_contacts WHERE tenant_id = $1 AND tags @> ARRAY['enumeration:provisional']::text[]`,
        [tenantId],
      );
      return Number.parseInt(result.rows[0]?.count ?? '0', 10);
    } catch {
      return 0;
    }
  }

  private async loadProvisionalFarmerIds(tenantId: string): Promise<Set<string>> {
    try {
      const result = await this.pool.query<{ farmer_profile_id: string }>(
        `SELECT farmer_profile_id FROM crm_contacts WHERE tenant_id = $1 AND tags @> ARRAY['enumeration:provisional']::text[] AND farmer_profile_id IS NOT NULL`,
        [tenantId],
      );
      return new Set(result.rows.map((row) => row.farmer_profile_id));
    } catch {
      return new Set();
    }
  }

  private async loadGeometryPendingByFarmer(
    tenantId: string,
    farmerIds: string[],
  ): Promise<Map<string, number>> {
    if (farmerIds.length === 0) return new Map();
    try {
      const result = await this.pool.query<{ farmer_id: string; count: string }>(
        `
          SELECT p.farmer_id, COUNT(*)::text AS count
          FROM plot p
          WHERE p.farmer_id = ANY($1::uuid[])
            AND p.geometry_approved_at IS NULL
            AND COALESCE(p.metadata->>'geometry_confidence_tier', '') IN ('low', 'moderate')
          GROUP BY p.farmer_id
        `,
        [farmerIds],
      );
      return new Map(result.rows.map((row) => [row.farmer_id, Number.parseInt(row.count, 10)]));
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42703') {
        return new Map();
      }
      throw error;
    }
  }
}

export function assertAgentTenantAccess(
  role: string | null,
  tenantId: string | null,
): asserts tenantId is string {
  if (role !== 'agent' && role !== 'exporter' && role !== 'cooperative') {
    throw new ForbiddenException('Only field agents or workspace operators can access enumeration packs');
  }
  if (!tenantId) {
    throw new ForbiddenException('Missing tenant claim in app_metadata');
  }
}
