import { Injectable, NotFoundException } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { normalizeCadastralKey } from './cadastral-cross-check';
import {
  BACKEND_CADASTRAL_PARCEL_LOOKUP_SENTRY_TAGS,
} from './backendCadastralParcelRegistry';
import {
  CADASTRAL_PARCEL_FIXTURES,
  cadastralFixtureKey,
} from './cadastral-parcel-fixtures';
import type { CadastralParcelLookupResult } from './cadastral-parcel.types';

@Injectable()
export class CadastralParcelLookupService {
  lookup(countryIsoRaw: string, cadastralKeyRaw: string): CadastralParcelLookupResult {
    const countryIso = countryIsoRaw?.trim().toUpperCase();
    const cadastralKey = cadastralKeyRaw?.trim();
    if (!countryIso || countryIso.length !== 2) {
      this.captureMiss(BACKEND_CADASTRAL_PARCEL_LOOKUP_SENTRY_TAGS.unsupportedCountry, {
        countryIso: countryIsoRaw,
        cadastralKey: cadastralKeyRaw,
      });
      throw new NotFoundException({
        code: 'UNSUPPORTED_COUNTRY',
        message: 'Country must be a supported ISO-3166 alpha-2 code.',
      });
    }

    if (!cadastralKey) {
      this.captureMiss(BACKEND_CADASTRAL_PARCEL_LOOKUP_SENTRY_TAGS.invalidKey, {
        countryIso,
      });
      throw new NotFoundException({
        code: 'INVALID_KEY',
        message: 'Cadastral key is required.',
      });
    }

    const normalized = normalizeCadastralKey(cadastralKey, countryIso);
    if (!normalized) {
      this.captureMiss(BACKEND_CADASTRAL_PARCEL_LOOKUP_SENTRY_TAGS.invalidKey, {
        countryIso,
        cadastralKey,
      });
      throw new NotFoundException({
        code: 'INVALID_KEY',
        message: 'Cadastral key could not be normalized for this country pack.',
      });
    }

    const fixture = CADASTRAL_PARCEL_FIXTURES[cadastralFixtureKey(countryIso, normalized)];
    if (!fixture) {
      this.captureMiss(BACKEND_CADASTRAL_PARCEL_LOOKUP_SENTRY_TAGS.miss, {
        countryIso,
        cadastralKey,
        normalizedKey: normalized,
      });
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'No demo parcel fixture matches this cadastral reference.',
      });
    }

    return fixture;
  }

  private captureMiss(tag: string, extra: Record<string, string | undefined>) {
    Sentry.withScope((scope) => {
      scope.setTag('cadastral.lookup', tag);
      for (const [key, value] of Object.entries(extra)) {
        if (value) scope.setExtra(key, value);
      }
      Sentry.captureMessage('cadastral_parcel_lookup_miss', 'info');
    });
  }
}
