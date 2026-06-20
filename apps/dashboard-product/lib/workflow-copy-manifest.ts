import { getPlotDeforestationDecisionCopyManifest } from '@/lib/plot-deforestation-decision-copy';
import { getBillingUpgradeCopyManifest } from '@/lib/billing-upgrade-copy';
import { getInboxFulfillmentCopyManifest } from '@/lib/inbox-fulfillment-copy';
import { getPlotTenurePanelCopyManifest } from '@/lib/plot-tenure-panel-copy';
import { getWorkflowErrorCopyManifest } from '@/lib/workflow-error-copy';
import { getRequestIntentCopyManifest } from '@/lib/request-intent-copy';
import { getAsyncStateShellCopyManifest, collectWorkflowTerminologyCopyManifest } from '@/lib/workflow-terminology-labels';
import { getDemoDataCopyManifest } from '@/lib/demo-data-copy';
import { getOnboardingStepCopyManifest } from '@/lib/onboarding-step-copy';
import { getVirginStateCopyManifest } from '@/lib/virgin-state-copy';
import { getDashboardAttentionCopyManifest } from '@/lib/dashboard-attention-copy';
import { getExporterLineageCopyManifest } from '@/lib/exporter-lineage-copy';
import { getPackageLineageSummaryCopyManifest } from '@/lib/package-lineage-summary-copy';
import { getPlotCreateCopyManifest } from '@/lib/plot-create-copy';

export function getWorkflowCopyManifest(): Record<string, string> {
  return {
    ...collectWorkflowTerminologyCopyManifest(),
    ...getOnboardingStepCopyManifest(),
    ...getVirginStateCopyManifest(),
    ...getDemoDataCopyManifest(),
    ...getRequestIntentCopyManifest(),
    ...getWorkflowErrorCopyManifest(),
    ...getAsyncStateShellCopyManifest(),
    ...getInboxFulfillmentCopyManifest(),
    ...getBillingUpgradeCopyManifest(),
    ...getPlotTenurePanelCopyManifest(),
    ...getPlotDeforestationDecisionCopyManifest(),
    ...getDashboardAttentionCopyManifest(),
    ...getExporterLineageCopyManifest(),
    ...getPackageLineageSummaryCopyManifest(),
    ...getPlotCreateCopyManifest(),
  };
}
