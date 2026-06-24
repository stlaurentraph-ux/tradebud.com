import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ContactsService } from '../contacts/contacts.service';
import { CadastralParcelLookupService } from './cadastral-parcel-lookup.service';
import { CreatePlotDto } from './dto/create-plot.dto';
import { PlotsService } from './plots.service';
import {
  BULK_PLOT_IMPORT_MAX_ROWS,
  BULK_PLOT_POINT_MAX_AREA_HA,
  type BulkPlotImportExecuteResponse,
  type BulkPlotImportInputRow,
  type BulkPlotImportPreviewResponse,
  type BulkPlotImportRowPreview,
  type BulkPlotImportRowResult,
} from './bulk-plot-import.types';

type ResolvedGeometry =
  | {
      kind: 'point';
      geometry: { type: 'Point'; coordinates: [number, number] };
      declaredAreaHa: number;
      captureMethod: 'BULK_IMPORT';
    }
  | {
      kind: 'polygon';
      geometry: { type: 'Polygon'; coordinates: [number, number][][] };
      declaredAreaHa: number;
      captureMethod: 'CADASTRAL_IMPORT';
      cadastralKey?: string;
    };

type ResolvedProducer = {
  label: string;
  contactId: string;
  farmerId: string;
};

@Injectable()
export class BulkPlotImportService {
  private readonly logger = new Logger(BulkPlotImportService.name);

  constructor(
    private readonly plotsService: PlotsService,
    private readonly contactsService: ContactsService,
    private readonly cadastralLookup: CadastralParcelLookupService,
  ) {}

  preview(_tenantId: string, rows: BulkPlotImportInputRow[]): BulkPlotImportPreviewResponse {
    this.assertRowLimit(rows);
    const previews = rows.map((row, index) => this.previewRow(row, index + 1));
    const readyCount = previews.filter((row) => row.status === 'READY').length;
    return {
      totalRows: previews.length,
      readyCount,
      failedCount: previews.length - readyCount,
      rows: previews,
    };
  }

  async execute(params: {
    tenantId: string;
    userId: string;
    rows: BulkPlotImportInputRow[];
    actorEmail?: string;
    actorFullName?: string;
  }): Promise<BulkPlotImportExecuteResponse> {
    const { tenantId, userId, rows } = params;
    this.assertRowLimit(rows);

    const producerCache = new Map<string, ResolvedProducer>();
    const results: BulkPlotImportRowResult[] = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowIndex = row.rowIndex ?? index + 1;
      const preview = this.previewRow(row, rowIndex);
      const producerLabel = preview.producerLabel;

      if (preview.status === 'VALIDATION_FAILED') {
        results.push({
          rowIndex,
          clientPlotId: preview.clientPlotId,
          producerLabel,
          status: 'VALIDATION_FAILED',
          message: preview.message,
        });
        continue;
      }

      try {
        const resolved = this.resolveRowGeometry(row);
        const producerKey = this.producerCacheKey(row);
        let producer = producerCache.get(producerKey);
        if (!producer) {
          producer = await this.resolveProducer(tenantId, row, producerLabel);
          producerCache.set(producerKey, producer);
        }

        const clientPlotId = row.clientPlotId.trim();
        const createDto: CreatePlotDto = {
          farmerId: producer.farmerId,
          clientPlotId,
          name: row.plotName?.trim() || clientPlotId,
          producerContactId: producer.contactId,
          geometry: resolved.geometry,
          declaredAreaHa: resolved.declaredAreaHa,
          cadastralKey: resolved.kind === 'polygon' ? resolved.cadastralKey ?? undefined : undefined,
          geometryCapture: {
            geometryConfidenceTier: resolved.captureMethod === 'CADASTRAL_IMPORT' ? 'high' : 'moderate',
            geometryConfidenceScore: resolved.captureMethod === 'CADASTRAL_IMPORT' ? 92 : 70,
            horizontalUncertaintyM: resolved.captureMethod === 'CADASTRAL_IMPORT' ? 3 : 15,
            captureMethod: resolved.captureMethod,
            captureIntent: 'eudr_minimum',
            recordedAt: Date.now(),
          },
        };

        const plotRow = await this.plotsService.create(createDto, userId, tenantId, {
          email: params.actorEmail,
          fullName: params.actorFullName,
        });

        const plotId = typeof plotRow?.id === 'string' ? plotRow.id : undefined;
        const reconciled =
          plotRow != null &&
          typeof plotRow === 'object' &&
          'reconciledExisting' in plotRow &&
          plotRow.reconciledExisting === true;

        results.push({
          rowIndex,
          clientPlotId,
          producerLabel: producer.label,
          status: reconciled ? 'DUPLICATE_SKIPPED' : 'IMPORTED',
          plotId,
          producerContactId: producer.contactId,
          message: reconciled ? 'Plot already existed for this producer and client plot id.' : undefined,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Import failed.';
        this.logger.warn(`Bulk plot import row ${rowIndex} failed: ${message}`);
        results.push({
          rowIndex,
          clientPlotId: row.clientPlotId?.trim() || `row-${rowIndex}`,
          producerLabel,
          status: 'FAILED',
          message,
        });
      }
    }

    return {
      totalRows: results.length,
      importedCount: results.filter((row) => row.status === 'IMPORTED').length,
      duplicateSkippedCount: results.filter((row) => row.status === 'DUPLICATE_SKIPPED').length,
      failedCount: results.filter(
        (row) => row.status === 'FAILED' || row.status === 'VALIDATION_FAILED',
      ).length,
      rows: results,
    };
  }

  private assertRowLimit(rows: BulkPlotImportInputRow[]): void {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('At least one import row is required.');
    }
    if (rows.length > BULK_PLOT_IMPORT_MAX_ROWS) {
      throw new BadRequestException(
        `Bulk plot import supports up to ${BULK_PLOT_IMPORT_MAX_ROWS} rows per job.`,
      );
    }
  }

  private previewRow(row: BulkPlotImportInputRow, rowIndex: number): BulkPlotImportRowPreview {
    const clientPlotId = row.clientPlotId?.trim() ?? '';
    const producerLabel = this.producerLabel(row);

    if (!clientPlotId) {
      return {
        rowIndex,
        clientPlotId: '',
        producerLabel,
        status: 'VALIDATION_FAILED',
        geometryKind: null,
        declaredAreaHa: null,
        message: 'client_plot_id is required.',
      };
    }

    try {
      const resolved = this.resolveRowGeometry(row);
      return {
        rowIndex,
        clientPlotId,
        producerLabel,
        status: 'READY',
        geometryKind: resolved.kind,
        declaredAreaHa: resolved.declaredAreaHa,
      };
    } catch (error) {
      return {
        rowIndex,
        clientPlotId,
        producerLabel,
        status: 'VALIDATION_FAILED',
        geometryKind: null,
        declaredAreaHa: null,
        message: error instanceof Error ? error.message : 'Validation failed.',
      };
    }
  }

  private producerLabel(row: BulkPlotImportInputRow): string {
    const name = row.producerFullName?.trim();
    const email = row.producerEmail?.trim();
    if (name && email) return `${name} (${email})`;
    if (name) return name;
    if (email) return email;
    if (row.producerContactId?.trim()) return row.producerContactId.trim();
    return 'Unknown producer';
  }

  private producerCacheKey(row: BulkPlotImportInputRow): string {
    const contactId = row.producerContactId?.trim();
    if (contactId) return `contact:${contactId}`;
    const email = row.producerEmail?.trim().toLowerCase();
    if (email) return `email:${email}`;
    const phone = row.producerPhone?.trim();
    if (phone) return `phone:${phone}`;
    const name = row.producerFullName?.trim().toLowerCase();
    return `name:${name ?? randomUUID()}`;
  }

  private async resolveProducer(
    tenantId: string,
    row: BulkPlotImportInputRow,
    fallbackLabel: string,
  ): Promise<ResolvedProducer> {
    const contactId = row.producerContactId?.trim();
    if (contactId) {
      const contact = await this.contactsService.getById(tenantId, contactId);
      if (contact.contact_type !== 'farmer') {
        throw new BadRequestException('producer_contact_id must reference a farmer contact.');
      }
      return {
        label: contact.full_name,
        contactId: contact.id,
        farmerId: contact.farmer_profile_id?.trim() || randomUUID(),
      };
    }

    const email = row.producerEmail?.trim().toLowerCase();
    if (email) {
      const contacts = await this.contactsService.list(tenantId);
      const match = contacts.find(
        (contact) =>
          contact.contact_type === 'farmer' &&
          typeof contact.email === 'string' &&
          contact.email.toLowerCase() === email,
      );
      if (match) {
        return {
          label: match.full_name,
          contactId: match.id,
          farmerId: match.farmer_profile_id?.trim() || randomUUID(),
        };
      }
    }

    const fullName = row.producerFullName?.trim();
    if (!fullName) {
      throw new BadRequestException(
        'producer_full_name is required when producer_contact_id and producer_email are absent.',
      );
    }

    const contact = await this.contactsService.create(tenantId, {
      full_name: fullName,
      email: email || undefined,
      phone: row.producerPhone?.trim() || null,
      country: row.producerCountry?.trim().toUpperCase() || null,
      contact_type: 'farmer',
      consent_status: 'unknown',
    });

    return {
      label: contact.full_name || fallbackLabel,
      contactId: contact.id,
      farmerId: contact.farmer_profile_id?.trim() || randomUUID(),
    };
  }

  private resolveRowGeometry(row: BulkPlotImportInputRow): ResolvedGeometry {
    const cadastralKey = row.cadastralKey?.trim();
    const countryCode = row.countryCode?.trim().toUpperCase();
    if (cadastralKey) {
      if (!countryCode) {
        throw new BadRequestException('country_code is required when cadastral_key is provided.');
      }
      const lookup = this.cadastralLookup.lookup({ countryCode, cadastralKey });
      if (!lookup.found) {
        throw new BadRequestException(lookup.message);
      }
      return {
        kind: 'polygon',
        geometry: lookup.geometry,
        declaredAreaHa: lookup.areaHa,
        captureMethod: 'CADASTRAL_IMPORT',
        cadastralKey: lookup.normalizedCadastralKey,
      };
    }

    const latitude = this.parseCoordinate(row.latitude, 'latitude');
    const longitude = this.parseCoordinate(row.longitude, 'longitude');
    const declaredAreaHa = this.parsePositiveNumber(row.declaredAreaHa, 'declared_area_ha');
    if (declaredAreaHa >= BULK_PLOT_POINT_MAX_AREA_HA) {
      throw new BadRequestException(
        `Point-only bulk import supports plots below ${BULK_PLOT_POINT_MAX_AREA_HA} ha. Use cadastral_key or import polygons in a later release.`,
      );
    }

    return {
      kind: 'point',
      geometry: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      declaredAreaHa,
      captureMethod: 'BULK_IMPORT',
    };
  }

  private parseCoordinate(value: number | string | null | undefined, label: string): number {
    if (value == null || String(value).trim() === '') {
      throw new BadRequestException(`${label} is required when cadastral_key is absent.`);
    }
    const parsed = Number(String(value).replace(',', '.'));
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(`${label} must be a valid number.`);
    }
    if (label === 'latitude' && (parsed < -90 || parsed > 90)) {
      throw new BadRequestException('latitude must be between -90 and 90.');
    }
    if (label === 'longitude' && (parsed < -180 || parsed > 180)) {
      throw new BadRequestException('longitude must be between -180 and 180.');
    }
    return parsed;
  }

  private parsePositiveNumber(value: number | string | null | undefined, label: string): number {
    if (value == null || String(value).trim() === '') {
      throw new BadRequestException(`${label} is required when cadastral_key is absent.`);
    }
    const parsed = Number(String(value).replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException(`${label} must be a positive number.`);
    }
    return parsed;
  }
}

export function assertBulkPlotImportRole(role: string | null | undefined): void {
  if (
    role !== 'cooperative' &&
    role !== 'exporter' &&
    role !== 'admin' &&
    role !== 'compliance_manager'
  ) {
    throw new ForbiddenException('This role cannot bulk-import plots.');
  }
}
