import { evaluateTenureParseGate } from '@/features/compliance/plotChecklist';
import type { PlotTenureVerificationRecord } from '@/features/api/postPlot';

export function plotNeedsLocalLandDocumentUpload(params: {
  hasLandDocuments: boolean;
  isSyncedToServer: boolean;
  tenureVerifications?: PlotTenureVerificationRecord[];
}): boolean {
  return (
    evaluateTenureParseGate({
      hasLandDocuments: params.hasLandDocuments,
      isSyncedToServer: params.isSyncedToServer,
      tenureVerifications: params.tenureVerifications,
    }) === 'documents_local_only'
  );
}
