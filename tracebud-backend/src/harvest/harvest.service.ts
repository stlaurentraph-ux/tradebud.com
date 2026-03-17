import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { CreateHarvestDto } from './dto/create-harvest.dto';
import { CreateDdsPackageDto } from './dto/create-dds-package.dto';

const YIELD_CAP_KG_PER_HA = 1500;

@Injectable()
export class HarvestService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async create(dto: CreateHarvestDto, userId: string | undefined) {
    const { farmerId, plotId, kg, harvestDate, note } = dto;

    if (kg <= 0) {
      throw new BadRequestException('Kg must be positive');
    }

    const plotRes = await this.pool.query(
      'SELECT id, area_ha FROM plot WHERE id = $1 AND farmer_id = $2',
      [plotId, farmerId],
    );
    if (plotRes.rowCount === 0) {
      throw new BadRequestException('Plot does not belong to farmer');
    }

    const areaHa = Number(plotRes.rows[0].area_ha);
    if (areaHa > 0) {
      const capKg = areaHa * YIELD_CAP_KG_PER_HA;
      if (kg > capKg) {
        throw new BadRequestException(
          `Yield cap exceeded: ${kg.toFixed(
            1,
          )}kg > ${capKg.toFixed(1)}kg allowed for ${areaHa.toFixed(4)}ha plot`,
        );
      }
    }

    const insertRes = await this.pool.query(
      `
        INSERT INTO harvest_transaction (
          farmer_id,
          plot_id,
          kg,
          harvest_date,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [farmerId, plotId, kg, harvestDate ?? null, null],
    );

    const tx = insertRes.rows[0];

    const qrRef = `V-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    const voucherRes = await this.pool.query(
      `
        INSERT INTO voucher (
          farmer_id,
          transaction_id,
          qr_code_ref
        )
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [farmerId, tx.id, qrRef],
    );

    const result = {
      transaction: tx,
      voucher: voucherRes.rows[0],
    };

    // Audit: harvest recorded
    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        userId ?? null,
        'harvest_recorded',
        JSON.stringify({
          farmerId,
          plotId,
          kg,
          harvestId: tx.id,
          voucherId: voucherRes.rows[0].id,
        }),
      ],
    );

    return result;
  }

  async listVouchersForFarmer(farmerId: string) {
    const res = await this.pool.query(
      `
        SELECT
          id,
          farmer_id,
          transaction_id,
          qr_code_ref,
          status,
          created_at
        FROM voucher
        WHERE farmer_id = $1
        ORDER BY created_at DESC
      `,
      [farmerId],
    );

    return res.rows;
  }

  async createDdsPackage(dto: CreateDdsPackageDto) {
    const { voucherIds, label } = dto;

    const vouchersRes = await this.pool.query(
      `
        SELECT id, farmer_id
        FROM voucher
        WHERE id = ANY($1::uuid[])
      `,
      [voucherIds],
    );

    if (vouchersRes.rowCount === 0) {
      throw new BadRequestException('No vouchers found for given IDs');
    }

    const farmerId = vouchersRes.rows[0].farmer_id as string;

    const pkgRes = await this.pool.query(
      `
        INSERT INTO dds_package (
          farmer_id,
          label,
          status
        )
        VALUES ($1, $2, 'draft')
        RETURNING *
      `,
      [farmerId, label ?? null],
    );

    const pkg = pkgRes.rows[0];

    await this.pool.query(
      `
        INSERT INTO dds_package_voucher (dds_package_id, voucher_id)
        SELECT $1::uuid, id
        FROM voucher
        WHERE id = ANY($2::uuid[])
      `,
      [pkg.id, voucherIds],
    );

    return pkg;
  }

  async listDdsPackagesForFarmer(farmerId: string) {
    const res = await this.pool.query(
      `
        SELECT
          id,
          farmer_id,
          label,
          status,
          created_at
        FROM dds_package
        WHERE farmer_id = $1
        ORDER BY created_at DESC
      `,
      [farmerId],
    );

    return res.rows;
  }

  async getDdsPackageDetail(id: string) {
    const pkgRes = await this.pool.query(
      `
        SELECT
          id,
          farmer_id,
          label,
          status,
          created_at,
          traces_reference
        FROM dds_package
        WHERE id = $1
      `,
      [id],
    );

    if (pkgRes.rowCount === 0) {
      throw new BadRequestException('DDS package not found');
    }

    const vouchersRes = await this.pool.query(
      `
        SELECT
          v.id,
          v.status,
          v.created_at,
          ht.kg,
          ht.harvest_date,
          p.id as plot_id,
          p.name as plot_name,
          p.kind as plot_kind,
          p.area_ha,
          p.declared_area_ha
        FROM dds_package_voucher dpv
        JOIN voucher v ON v.id = dpv.voucher_id
        JOIN harvest_transaction ht ON ht.id = v.transaction_id
        JOIN plot p ON p.id = ht.plot_id
        WHERE dpv.dds_package_id = $1
        ORDER BY v.created_at DESC
      `,
      [id],
    );

    return {
      package: pkgRes.rows[0],
      vouchers: vouchersRes.rows,
    };
  }

  async getDdsPackageTracesJson(id: string) {
    const detail = await this.getDdsPackageDetail(id);
    const pkg = detail.package as any;
    const vouchers = detail.vouchers as any[];

    const exporterId = pkg.farmer_id;

    const lots = vouchers.map((v) => ({
      voucherId: v.id,
      plotId: v.plot_id,
      plotName: v.plot_name,
      plotKind: v.plot_kind,
      plotAreaHa: Number(v.area_ha),
      declaredAreaHa: v.declared_area_ha != null ? Number(v.declared_area_ha) : null,
      kg: Number(v.kg),
      harvestDate: v.harvest_date
        ? new Date(v.harvest_date).toISOString().slice(0, 10)
        : null,
    }));

    const totalKg = lots.reduce((sum, lot) => sum + (Number.isFinite(lot.kg) ? lot.kg : 0), 0);

    return {
      tracesReference: pkg.traces_reference ?? null,
      exporterId,
      ddsPackageId: pkg.id,
      label: pkg.label ?? null,
      createdAt: pkg.created_at,
      status: pkg.status,
      commodity: 'coffee',
      hsCode: '0901',
      totalKg,
      lots,
    };
  }

  async submitDdsPackage(id: string) {
    const tracesRef = `TRACES-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const res = await this.pool.query(
      `
        UPDATE dds_package
        SET status = 'submitted',
            traces_reference = $2
        WHERE id = $1
        RETURNING *
      `,
      [id, tracesRef],
    );

    if (res.rowCount === 0) {
      throw new BadRequestException('DDS package not found');
    }

    const pkg = res.rows[0];

    // Audit: DDS package submitted
    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        null,
        'dds_package_submitted',
        JSON.stringify({
          packageId: pkg.id,
          tracesReference: pkg.traces_reference,
        }),
      ],
    );

    return pkg;
  }
}

