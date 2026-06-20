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
  it('maps generic transport failures without claiming Tracebud is down', () => {
    expect(mapSyncActionErrorMessage('TypeError: Network request failed', t, 'settings')).toBe(
      'settings_sync_transport_failed_settings',
    );
  });

  it('maps photo queue transport failures to photo-specific copy', () => {
    expect(
      mapSyncActionErrorMessage('Network request failed', t, 'settings', {
        actionType: 'photos_sync',
      }),
    ).toBe('sync_photos_upload_failed_settings');
  });

  it('maps technical queue errors to farmer copy', () => {
    expect(mapSyncActionErrorMessage('Internal Server Error', t)).toBe('sync_action_failed_generic');
    expect(mapSyncActionErrorMessage('Internal Server Error', t, 'settings')).toBe(
      'settings_sync_online_server_busy',
    );
  });

  it('keeps farmer-readable queue errors', () => {
    expect(
      mapSyncActionErrorMessage('Plot not on server — upload from My Plots first.', t, 'settings'),
    ).toBe('Plot not on server — upload from My Plots first.');
  });

  it('maps auth failures to sign-in guidance', () => {
    expect(mapSyncActionErrorMessage('401 Unauthorized', t, 'settings')).toBe(
      'sync_session_expired_short',
    );
  });
});
