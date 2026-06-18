import { describe, expect, it } from 'vitest';

import {
  isTechnicalApiMessage,
  mapPlotUploadErrorMessage,
  mapSyncActionErrorMessage,
} from './mapApiErrorToUserMessage';

const t = (key: string) => key;

describe('isTechnicalApiMessage', () => {
  it('flags generic server failures', () => {
    expect(isTechnicalApiMessage('Internal Server Error')).toBe(true);
    expect(isTechnicalApiMessage('HTTP 500')).toBe(true);
    expect(isTechnicalApiMessage('Plot upload failed (500)')).toBe(true);
  });

  it('allows short validation copy', () => {
    expect(isTechnicalApiMessage('Declared area must be greater than zero.')).toBe(false);
  });
});

describe('mapPlotUploadErrorMessage', () => {
  it('maps technical server text to farmer copy', () => {
    expect(mapPlotUploadErrorMessage('Internal Server Error', t, { reason: 'server_error' })).toBe(
      'plot_upload_server_error',
    );
    expect(
      mapPlotUploadErrorMessage('Internal Server Error', t, {
        reason: 'server_error',
        surface: 'settings',
      }),
    ).toBe('plot_upload_server_error_settings');
  });

  it('maps network failures', () => {
    expect(
      mapPlotUploadErrorMessage('Network request failed', t, { reason: 'network_error' }),
    ).toBe('plot_upload_network_error');
  });

  it('maps geometry rejections from the API', () => {
    expect(mapPlotUploadErrorMessage('GEO-102: Invalid polygon', t)).toBe(
      'plot_upload_geometry_rejected',
    );
  });
});

describe('mapSyncActionErrorMessage', () => {
  it('maps technical queue errors to generic retry copy', () => {
    expect(mapSyncActionErrorMessage('Internal Server Error', t)).toBe('sync_action_failed_generic');
    expect(mapSyncActionErrorMessage('Internal Server Error', t, 'settings')).toBe(
      'sync_action_failed_generic_settings',
    );
  });
});
