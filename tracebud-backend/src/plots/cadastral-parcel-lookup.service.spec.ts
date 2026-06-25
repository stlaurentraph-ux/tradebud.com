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
    const result = service.lookup({
      countryCode: 'HN',
      cadastralKey: BACKEND_CADASTRAL_PARCEL_DEMO_KEYS.HN,
    });
    expect(result.found).toBe(true);
    if (!result.found) return;
    expect(result.countryCode).toBe('HN');
    expect(result.cadastralKey).toBe('0123456789');
    expect(result.geometry.type).toBe('Polygon');
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('tags Sentry on miss', () => {
    const result = service.lookup({ countryCode: 'HN', cadastralKey: '999-999-999-9' });
    expect(result.found).toBe(false);
    expect(Sentry.captureMessage).toHaveBeenCalledWith('cadastral_parcel_lookup_miss', 'info');
  });

  it('tags Sentry on invalid key format', () => {
    const result = service.lookup({ countryCode: 'HN', cadastralKey: '' });
    expect(result.found).toBe(false);
    expect(Sentry.captureMessage).toHaveBeenCalled();
  });
});
