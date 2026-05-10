/**
 * Re-export module for backward compatibility with postPlot.ts.
 * New code should import from the specific modules (auth, plots, harvest, audit).
 */

// Auth exports
export {
  getAccessTokenFromSupabase,
  testBackendLogin,
  setAuthCredentials,
  getAuthCredentials,
  hydrateSyncAuthFromSettings,
  saveAndApplySyncAuth,
  clearPersistedSyncAuth,
} from './auth';

// Plots exports
export {
  buildGeometryFromLocalPlot,
  postPlotToBackend,
  updatePlotMetadataOnBackend,
  fetchPlotsForFarmer,
  runComplianceCheckForPlot,
  runGfwCheckForPlot,
  syncPlotPhotosToBackend,
  syncPlotLegalToBackend,
  syncPlotEvidenceToBackend,
  type PostPlotToBackendResult,
  type LocalPlotForUpload,
} from './plots';

// Harvest exports
export {
  postHarvestToBackend,
  fetchVouchersForFarmer,
  fetchVoucherByQrRef,
  fetchDdsPackagesForFarmer,
  fetchDdsPackageTracesJson,
  createDdsPackageForFarmer,
  submitDdsPackage,
} from './harvest';

// Audit exports
export { fetchAuditForFarmer, postAuditEventToBackend, logAuditEvent, type PostAuditEventResult } from './audit';
