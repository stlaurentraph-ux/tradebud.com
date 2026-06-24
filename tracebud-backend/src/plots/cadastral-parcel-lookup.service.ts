import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { normalizeCadastralKeyForCountry } from './cadastral-country-packs';
import { CADASTRAL_PARCEL_FIXTURES } from './cadastral-parcel-fixtures';
import type { CadastralParcelLookupResponse } from './cadastral-parcel.types';

@Injectable()
export class CadastralParcelLookupService {
  isEnabled(): boolean {
    const raw = process.env.CADASTRAL_PARCEL_IMPORT_ENABLED?.trim().toLowerCase();
    if (raw === '0' || raw === 'false' || raw === 'off') {
      return false;
    }
    return true;
  }

  lookup(params: {
    countryCode: string;
    cadastralKey: string;
  }): CadastralParcelLookupResponse {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException({
        code: 'CADASTRAL_PARCEL_IMPORT_DISABLED',
        message: 'Cadastral parcel import is disabled on this API deployment.',
      });
    }

    const countryCode = params.countryCode.trim().toUpperCase();
    const normalizedCadastralKey = normalizeCadastralKeyForCountry(
      params.cadastralKey,
      countryCode,
    );

    if (!normalizedCadastralKey) {
      return {
        found: false,
        code: 'CADASTRAL_PARCEL_NOT_FOUND',
        message: 'Cadastral key format is invalid for the selected country.',
      };
    }

    const fixture = CADASTRAL_PARCEL_FIXTURES.find(
      (row) =>
        row.countryIso === countryCode &&
        normalizeCadastralKeyForCountry(row.cadastralKey, countryCode) === normalizedCadastralKey,
    );

    if (!fixture) {
      return {
        found: false,
        code: 'CADASTRAL_PARCEL_NOT_FOUND',
        message:
          'No parcel boundary is available for this cadastral key in the demo registry. Farmers can still walk or trace the boundary manually.',
      };
    }

    return {
      found: true,
      source: 'fixture',
      countryCode,
      cadastralKey: params.cadastralKey.trim(),
      normalizedCadastralKey,
      label: fixture.label,
      areaHa: fixture.areaHa,
      geometry: fixture.geometry,
      registryAttribution: fixture.registryAttribution,
    };
  }
}
