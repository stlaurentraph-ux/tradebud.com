import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { BillingService } from '../billing/billing.service';
import { PG_POOL } from '../db/db.module';
import { HarvestService } from '../harvest/harvest.service';

export type ShipmentHeaderRecord = {
  id: string;
  tenant_id: string;
  external_id: string | null;
  shipment_reference: string;
  label: string;
  status: string;
  declared_quantity_kg: number;
  covered_quantity_kg: number;
  package_ids: string[];
  sealed_at: string | null;
  created_at: string;
  updated_at: string;
};

type CreateShipmentHeaderInput = {
  tenantId: string;
  externalId?: string;
  shipmentReference: string;
  label: string;
  packageIds: string[];
  declaredQuantityKg: number;
  coveredQuantityKg: number;
};

@Injectable()
export class ShipmentHeadersService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly harvestService: HarvestService,
    private readonly billingService: BillingService,
  ) {}

  private isSchemaMissing(error: unknown): boolean {
    return (error as { code?: string } | null)?.code === '42P01';
  }

  private mapRow(
    row: Record<string, unknown>,
    packageIds: string[] = [],
  ): ShipmentHeaderRecord {
    return {
      id: String(row.id),
      tenant_id: String(row.tenant_id),
      external_id: row.external_id != null ? String(row.external_id) : null,
      shipment_reference: String(row.shipment_reference),
      label: String(row.label),
      status: String(row.status),
      declared_quantity_kg: Number(row.declared_quantity_kg),
      covered_quantity_kg: Number(row.covered_quantity_kg),
      package_ids: packageIds,
      sealed_at: row.sealed_at != null ? new Date(String(row.sealed_at)).toISOString() : null,
      created_at: new Date(String(row.created_at)).toISOString(),
      updated_at: new Date(String(row.updated_at)).toISOString(),
    };
  }

  private async loadPackageIds(shipmentHeaderId: string): Promise<string[]> {
    const res = await this.pool.query<{ dds_package_id: string }>(
      `
        SELECT dds_package_id::text
        FROM shipment_header_packages
        WHERE shipment_header_id = $1
        ORDER BY created_at ASC
      `,
      [shipmentHeaderId],
    );
    return res.rows.map((row) => row.dds_package_id);
  }

  async listForTenant(tenantId: string): Promise<ShipmentHeaderRecord[]> {
    try {
      const res = await this.pool.query(
        `
          SELECT *
          FROM shipment_headers
          WHERE tenant_id = $1
          ORDER BY created_at DESC
          LIMIT 100
        `,
        [tenantId],
      );

      const rows = await Promise.all(
        res.rows.map(async (row) => this.mapRow(row, await this.loadPackageIds(String(row.id)))),
      );
      return rows;
    } catch (error) {
      if (this.isSchemaMissing(error)) {
        return [];
      }
      throw error;
    }
  }

  async getById(tenantId: string, id: string): Promise<ShipmentHeaderRecord> {
    try {
      const res = await this.pool.query(
        `
          SELECT *
          FROM shipment_headers
          WHERE id = $1
            AND tenant_id = $2
          LIMIT 1
        `,
        [id, tenantId],
      );
      if (!res.rowCount) {
        throw new NotFoundException('Shipment not found.');
      }
      return this.mapRow(res.rows[0], await this.loadPackageIds(id));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (this.isSchemaMissing(error)) {
        throw new ServiceUnavailableException('Shipment header tables are not provisioned.');
      }
      throw error;
    }
  }

  async findByExternalId(tenantId: string, externalId: string): Promise<ShipmentHeaderRecord | null> {
    try {
      const res = await this.pool.query(
        `
          SELECT *
          FROM shipment_headers
          WHERE tenant_id = $1
            AND external_id = $2
          LIMIT 1
        `,
        [tenantId, externalId],
      );
      if (!res.rowCount) {
        return null;
      }
      const id = String(res.rows[0].id);
      return this.mapRow(res.rows[0], await this.loadPackageIds(id));
    } catch (error) {
      if (this.isSchemaMissing(error)) {
        return null;
      }
      throw error;
    }
  }

  async createShipmentHeader(input: CreateShipmentHeaderInput): Promise<ShipmentHeaderRecord> {
    const packageIds = [...new Set(input.packageIds.map((id) => id.trim()).filter(Boolean))];
    if (packageIds.length === 0) {
      throw new BadRequestException('At least one batch (dds_package) is required.');
    }

    const weightCheck = await this.harvestService.validateShipmentDeclaredWeight(
      input.tenantId,
      packageIds,
      input.declaredQuantityKg,
    );
    if (!weightCheck.ok) {
      throw new BadRequestException(weightCheck.error ?? 'Shipment weight does not match batch totals.');
    }

    try {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        const inserted = await client.query(
          `
            INSERT INTO shipment_headers (
              tenant_id,
              external_id,
              shipment_reference,
              label,
              status,
              declared_quantity_kg,
              covered_quantity_kg
            )
            VALUES ($1, $2, $3, $4, 'DRAFT', $5, $6)
            RETURNING *
          `,
          [
            input.tenantId,
            input.externalId ?? null,
            input.shipmentReference,
            input.label,
            input.declaredQuantityKg,
            input.coveredQuantityKg,
          ],
        );

        const shipment = inserted.rows[0];
        const shipmentId = String(shipment.id);

        for (const packageId of packageIds) {
          await client.query(
            `
              INSERT INTO shipment_header_packages (shipment_header_id, dds_package_id)
              VALUES ($1, $2::uuid)
            `,
            [shipmentId, packageId],
          );
        }

        await client.query('COMMIT');
        return this.mapRow(shipment, packageIds);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      if (this.isSchemaMissing(error)) {
        throw new ServiceUnavailableException('Shipment header tables are not provisioned.');
      }
      throw error;
    }
  }

  async sealShipmentHeader(tenantId: string, id: string): Promise<ShipmentHeaderRecord> {
    const shipment = await this.getById(tenantId, id);
    if (shipment.status === 'SEALED') {
      await this.billingService.recordOriginSealMeter(tenantId, shipment.id);
      return shipment;
    }
    if (shipment.status !== 'DRAFT' && shipment.status !== 'READY') {
      throw new BadRequestException(`Cannot seal shipment in status ${shipment.status}.`);
    }

    const weightCheck = await this.harvestService.validateShipmentDeclaredWeight(
      tenantId,
      shipment.package_ids,
      shipment.declared_quantity_kg,
    );
    if (!weightCheck.ok) {
      throw new BadRequestException(weightCheck.error ?? 'Shipment weight does not match batch totals.');
    }

    const res = await this.pool.query(
      `
        UPDATE shipment_headers
        SET status = 'SEALED',
            sealed_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
          AND tenant_id = $2
        RETURNING *
      `,
      [id, tenantId],
    );

    if (!res.rowCount) {
      throw new NotFoundException('Shipment not found.');
    }

    await this.billingService.recordOriginSealMeter(tenantId, id);

    return this.mapRow(res.rows[0], shipment.package_ids);
  }

  async resolveShipmentHeaderIdForPackage(packageId: string): Promise<string | null> {
    try {
      const res = await this.pool.query<{ shipment_header_id: string }>(
        `
          SELECT shipment_header_id::text
          FROM shipment_header_packages
          WHERE dds_package_id = $1::uuid
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [packageId],
      );
      return res.rows[0]?.shipment_header_id ?? null;
    } catch (error) {
      if (this.isSchemaMissing(error)) {
        return null;
      }
      throw error;
    }
  }

  async assertPackageInSealedShipment(tenantId: string, packageId: string): Promise<string> {
    const shipmentHeaderId = await this.resolveShipmentHeaderIdForPackage(packageId);
    if (!shipmentHeaderId) {
      throw new BadRequestException('Package is not linked to a shipment header.');
    }
    const shipment = await this.getById(tenantId, shipmentHeaderId);
    if (shipment.status !== 'SEALED' && shipment.status !== 'SUBMITTED' && shipment.status !== 'ACCEPTED') {
      throw new ForbiddenException('Destination DDS submit requires a sealed upstream shipment.');
    }
    return shipmentHeaderId;
  }
}
