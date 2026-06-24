import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ContactsService } from '../contacts/contacts.service';
import { CadastralParcelLookupService } from './cadastral-parcel-lookup.service';
import {
  assertBulkPlotImportRole,
  BulkPlotImportService,
} from './bulk-plot-import.service';
import { PlotsService } from './plots.service';

function makeService(deps?: {
  plotsService?: Partial<PlotsService>;
  contactsService?: Partial<ContactsService>;
  cadastralLookup?: Partial<CadastralParcelLookupService>;
}) {
  return new BulkPlotImportService(
    deps?.plotsService as PlotsService,
    deps?.contactsService as ContactsService,
    deps?.cadastralLookup as CadastralParcelLookupService,
  );
}

describe('BulkPlotImportService.preview', () => {
  it('marks point rows as READY when coordinates and area are valid', () => {
    const service = makeService();
    const result = service.preview('tenant_1', [
      {
        clientPlotId: 'PLOT-001',
        producerFullName: 'Maria Lopez',
        latitude: 14.6349,
        longitude: -87.8494,
        declaredAreaHa: 2.5,
      },
    ]);
    expect(result.readyCount).toBe(1);
    expect(result.rows[0]?.status).toBe('READY');
    expect(result.rows[0]?.geometryKind).toBe('point');
  });

  it('rejects point rows at or above 4 ha', () => {
    const service = makeService();
    const result = service.preview('tenant_1', [
      {
        clientPlotId: 'PLOT-002',
        producerFullName: 'Maria Lopez',
        latitude: 14.6349,
        longitude: -87.8494,
        declaredAreaHa: 4,
      },
    ]);
    expect(result.failedCount).toBe(1);
    expect(result.rows[0]?.message).toContain('4 ha');
  });

  it('hydrates cadastral rows as polygon READY', () => {
    const service = makeService({
      cadastralLookup: {
        lookup: () => ({
          found: true as const,
          source: 'fixture' as const,
          countryCode: 'HN',
          cadastralKey: '012-345-678-9',
          normalizedCadastralKey: '0123456789',
          label: 'Demo parcel',
          areaHa: 1.8,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [-87.1, 14.1],
                [-87.2, 14.1],
                [-87.2, 14.2],
                [-87.1, 14.2],
                [-87.1, 14.1],
              ],
            ],
          },
          registryAttribution: 'Demo registry',
        }),
      },
    });
    const result = service.preview('tenant_1', [
      {
        clientPlotId: 'PLOT-CAD-1',
        producerFullName: 'Juan Perez',
        countryCode: 'HN',
        cadastralKey: '012-345-678-9',
      },
    ]);
    expect(result.readyCount).toBe(1);
    expect(result.rows[0]?.geometryKind).toBe('polygon');
  });
});

describe('BulkPlotImportService.execute', () => {
  it('creates a farmer contact and plot for a valid row', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'plot_1' });
    const contactsCreate = jest.fn().mockResolvedValue({
      id: 'contact_1',
      full_name: 'Maria Lopez',
      farmer_profile_id: null,
      contact_type: 'farmer',
    });
    const service = makeService({
      plotsService: { create },
      contactsService: {
        create: contactsCreate,
        getById: jest.fn(),
        list: jest.fn().mockResolvedValue([]),
      },
    });

    const result = await service.execute({
      tenantId: 'tenant_1',
      userId: 'user_1',
      rows: [
        {
          clientPlotId: 'PLOT-001',
          producerFullName: 'Maria Lopez',
          latitude: 14.6349,
          longitude: -87.8494,
          declaredAreaHa: 2.5,
        },
      ],
    });

    expect(result.importedCount).toBe(1);
    expect(contactsCreate).toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientPlotId: 'PLOT-001',
        producerContactId: 'contact_1',
        geometry: { type: 'Point', coordinates: [-87.8494, 14.6349] },
      }),
      'user_1',
      'tenant_1',
      expect.any(Object),
    );
  });
});

describe('assertBulkPlotImportRole', () => {
  it('allows cooperative and exporter roles', () => {
    expect(() => assertBulkPlotImportRole('cooperative')).not.toThrow();
    expect(() => assertBulkPlotImportRole('exporter')).not.toThrow();
  });

  it('blocks farmer role', () => {
    expect(() => assertBulkPlotImportRole('farmer')).toThrow(ForbiddenException);
  });
});

describe('BulkPlotImportService limits', () => {
  it('rejects empty payloads', () => {
    const service = makeService();
    expect(() => service.preview('tenant_1', [])).toThrow(BadRequestException);
  });
});
