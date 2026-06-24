import { NotFoundException } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { CadastralParcelLookupService } from './cadastral-parcel-lookup.service';
import { BACKEND_CADASTRAL_PARCEL_DEMO_KEYS } from './backendCadastralParcelRegistry';

jest.mock('@sentry/nestjs', () => ({
  withScope: jest.fn((cb: (scope: { setTag: jest.Mock; setExtra: jest.Mock }) => void) => {
    cb({ setTag: jest.fn(), setExtra: jest.fn() });
  }),
  captureMessage: jest.fn(),
}));

describe('CadastralParcelLookupService', () => {
  const service = new CadastralParcelLookupService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns Honduras demo fixture for normalized clave', () => {
    const result = service.lookup('HN', BACKEND_CADASTRAL_PARCEL_DEMO_KEYS.HN);
    expect(result.countryIso).toBe('HN');
    expect(result.cadastralKey).toBe('012-345-678-9');
    expect(result.geometry.type).toBe('Polygon');
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('tags Sentry on miss', () => {
    expect(() => service.lookup('HN', '999-999-999-9')).toThrow(NotFoundException);
    expect(Sentry.captureMessage).toHaveBeenCalledWith('cadastral_parcel_lookup_miss', 'info');
  });

  it('rejects unsupported country', () => {
    expect(() => service.lookup('XX', '0123456789')).toThrow(NotFoundException);
    expect(Sentry.captureMessage).toHaveBeenCalled();
  });
});
