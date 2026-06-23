import type { TranslateFn } from '@/features/i18n/translate';
import type { SyncFailure, SyncFailureStep } from '@/features/sync/syncFailure';

function stepLabelKey(step: SyncFailureStep): string {
  switch (step) {
    case 'token_refresh':
      return 'sync_failure_step_token';
    case 'api_reachability':
      return 'sync_failure_step_api';
    case 'plot_list':
      return 'sync_failure_step_plot_list';
    case 'plot_upload':
      return 'sync_failure_step_plot_upload';
    case 'photo_storage':
      return 'sync_failure_step_photo_storage';
    case 'photo_api':
      return 'sync_failure_step_photo_api';
    case 'harvest':
      return 'sync_failure_step_harvest';
    case 'evidence':
      return 'sync_failure_step_evidence';
    case 'declaration':
      return 'sync_failure_step_declaration';
    default:
      return 'sync_failure_step_queue';
  }
}

/** Farmer-facing primary line for a typed sync failure. */
export function formatSyncFailureUserMessage(failure: SyncFailure, t: TranslateFn): string {
  if (failure.step === 'token_refresh') {
    if (failure.cause === 'network' || failure.cause === 'timeout') {
      return t('sync_auth_refresh_failed');
    }
    return t('sync_session_expired_short');
  }

  if (failure.step === 'api_reachability' || (failure.step === 'plot_list' && failure.cause === 'network')) {
    return t('settings_sync_reach_failed');
  }

  if (failure.cause === 'missing_plot_link') {
    return failure.message;
  }

  if (failure.cause === 'forbidden') {
    return t('plot_upload_account_error_settings');
  }

  if (failure.cause === 'rate_limit') {
    if (failure.step === 'plot_upload' || failure.actionType === 'photos_sync' || failure.actionType === 'evidence_sync' || failure.actionType === 'harvest') {
      return t('plot_upload_rate_limited_settings');
    }
    return t('sync_rate_limited_settings');
  }

  if (failure.cause === 'validation') {
    if (failure.step === 'photo_storage' && failure.message.length > 160) {
      return t('sync_photos_upload_failed_settings');
    }
    return failure.message;
  }

  if (failure.step === 'photo_storage' || failure.step === 'photo_api' || failure.actionType === 'photos_sync') {
    return t('sync_photos_upload_failed_settings');
  }

  if (failure.step === 'evidence' || failure.actionType === 'evidence_sync') {
    return t('sync_evidence_upload_failed_settings');
  }

  if (failure.step === 'harvest' || failure.actionType === 'harvest') {
    return t('sync_harvest_upload_failed_settings');
  }

  if (failure.step === 'declaration' || failure.actionType === 'audit_sync') {
    return t('sync_declaration_upload_failed_settings');
  }

  if (failure.cause === 'network' || failure.cause === 'timeout') {
    return t('settings_sync_transport_failed_settings');
  }

  if (failure.cause === 'server') {
    return t('settings_sync_online_server_busy');
  }

  return failure.message.length <= 160 ? failure.message : t('settings_sync_online_server_busy');
}

/** Short label for technical details: "Photo upload (API)". */
export function formatSyncFailureStepLabel(failure: SyncFailure, t: TranslateFn): string {
  return t(stepLabelKey(failure.step));
}
