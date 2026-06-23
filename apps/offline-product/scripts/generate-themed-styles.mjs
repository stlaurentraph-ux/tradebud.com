import fs from 'fs';
import path from 'path';

const REPS = [
  ['#111827', 'c.text'],
  ['#171717', 'c.text'],
  ['#121212', 'c.text'],
  ['#0F172A', 'c.text'],
  ['#3A3A3A', 'c.text'],
  ['#374151', 'c.text'],
  ['#1F2937', 'c.text'],
  ['#1C1C1C', 'c.text'],
  ['#4B4B4B', 'c.textSecondary'],
  ['#4B5563', 'c.textSecondary'],
  ['#55514E', 'c.textSecondary'],
  ['#555555', 'c.textSecondary'],
  ['#5F6670', 'c.textMuted'],
  ['#5D6672', 'c.textMuted'],
  ['#6B7280', 'c.textMuted'],
  ['#616161', 'c.textMuted'],
  ['#949494', 'c.textMuted'],
  ['#9CA3AF', 'c.textMuted'],
  ['#4A4340', 'c.textSecondary'],
  ['#6A6360', 'c.textMuted'],
  ['#FFFFFF', 'c.backgroundCard'],
  ['#FAFAFA', 'c.backgroundSecondary'],
  ['#F8F8F8', 'c.backgroundSecondary'],
  ['#F7F8FA', 'c.backgroundSecondary'],
  ['#F7F7F7', 'c.backgroundSecondary'],
  ['#F3F4F6', 'c.backgroundSecondary'],
  ['#F9FAFB', 'c.backgroundSecondary'],
  ['#E5E7EB', 'c.border'],
  ['#D5D9DD', 'c.border'],
  ['#DCDDDF', 'c.border'],
  ['#D4D8DD', 'c.border'],
  ['#D3D3D3', 'c.border'],
  ['#D2D2D2', 'c.border'],
  ['#D8DCE1', 'c.border'],
  ['#D9D9D9', 'c.border'],
  ['#D1D5DB', 'c.chipBorder'],
  ['#0A7F59', 'c.link'],
  ['#0B6F50', 'c.link'],
  ['#0A9F68', 'c.link'],
  ['#0B4F3B', 'c.linkStrong'],
  ['#065F46', 'c.linkStrong'],
  ['#0A5C40', 'c.linkStrong'],
  ['#157E64', 'c.link'],
  ['#0B6E4F', 'c.link'],
  ['#0F8A64', 'c.link'],
  ['#0B5D48', 'c.link'],
  ['#0A8B63', 'c.link'],
  ['#1F6B57', 'c.link'],
  ['#047857', 'c.link'],
  ['#ECF8F2', 'c.chipBackgroundActive'],
  ['#E6F7EF', 'c.chipBackgroundActive'],
  ['#DDEFE8', 'c.surfaceAccent'],
  ['#E9F5EE', 'c.surfaceAccent'],
  ['#F0FAF5', 'c.surfaceAccent'],
  ['#E8F7F0', 'c.surfaceAccent'],
  ['#F4FBF8', 'c.surfaceAccent'],
  ['#ECFDF5', 'c.surfaceAccent'],
  ['#F2FBF7', 'c.surfaceAccent'],
  ['#AEE6D3', 'c.surfaceAccentBorder'],
  ['#B7E7D7', 'c.surfaceAccentBorder'],
  ['#A7F3D0', 'c.surfaceAccentBorder'],
  ['#D1FAE5', 'c.surfaceAccentBorder'],
  ['#7DDDC2', 'c.link'],
  ['#76D5B6', 'c.link'],
  ['#8FDCC2', 'c.dashedBorder'],
  ['#FFFBEB', 'c.surfaceWarning'],
  ['#FEF3C7', 'c.surfaceWarning'],
  ['#F7F3E6', 'c.surfaceAction'],
  ['#F7F2E6', 'c.surfaceAction'],
  ['#FFF8E8', 'c.surfaceWarning'],
  ['#FFF1F0', 'c.surfaceWarning'],
  ['#FDE68A', 'c.surfaceWarningBorder'],
  ['#FCD34D', 'c.surfaceWarningBorder'],
  ['#F2C94C', 'c.surfaceWarningBorder'],
  ['#EACB86', 'c.surfaceActionBorder'],
  ['#92400E', 'c.textWarning'],
  ['#B45309', 'c.textWarningStrong'],
  ['#78350F', 'c.textWarningStrong'],
  ['#7C2D12', 'c.textWarning'],
  ['#C05600', 'c.textWarningStrong'],
  ['#9A5F1A', 'c.textWarningStrong'],
  ['#7B4B12', 'c.textWarning'],
  ['#A35F00', 'c.textWarningStrong'],
  ['#A85900', 'c.textWarningStrong'],
  ['#7A5200', 'c.textWarningStrong'],
  ['#C98A00', 'c.warning'],
  ['#C0392B', 'c.error'],
  ['#8B291F', 'c.textWarningStrong'],
  ['#ECECEE', 'c.storageTrack'],
  ['#E7E7E7', 'c.storageTrack'],
  ['#DDF5EA', 'c.avatarBackground'],
  ['#DFF5EC', 'c.avatarBackground'],
  ['#CDEEDD', 'c.chipBackgroundActive'],
  ['#CDEEDF', 'c.surfaceAccent'],
  ['#F7E7B7', 'c.surfaceWarning'],
  ['#F8EBC8', 'c.surfaceWarning'],
  ['#EFF6FF', 'c.backgroundSecondary'],
  ['#BFDBFE', 'c.border'],
  ['#F5F3FF', 'c.backgroundSecondary'],
  ['#DDD6FE', 'c.border'],
  ['#DCE7F7', 'c.backgroundSecondary'],
  ['#EADFF8', 'c.backgroundSecondary'],
  ['#EAF1FB', 'c.backgroundSecondary'],
  ['#C9D9EE', 'c.border'],
  ['#BDD1C8', 'c.storageTrack'],
  ['#B8CBC5', 'c.storageTrack'],
  ['#E8F4EC', 'c.surfaceAccent'],
  ['#E8F7F0', 'c.surfaceAccent'],
  ['#F0FAF5', 'c.chipBackgroundActive'],
  ['#D8E0DD', 'c.border'],
  ['#F9FAFA', 'c.backgroundSecondary'],
  ['#D8D8D8', 'c.border'],
  ['#D9D9D9', 'c.border'],
  ['#9FE6C9', 'c.avatarBackground'],
  ['#ECECEC', 'c.border'],
  ['#D7DBDF', 'c.border'],
  ['#5C5C5C', 'c.textSecondary'],
  ['#FFFBF0', 'c.surfaceAction'],
  ['#6B6B6B', 'c.textMuted'],
  ['#BFEEDB', 'c.surfaceAccent'],
  ['#74D7B8', 'c.link'],
  ['#F8F1CD', 'c.surfaceAction'],
  ['#DFEAFE', 'c.backgroundSecondary'],
  ['#EFE3FA', 'c.backgroundSecondary'],
  ['#1E6D58', 'c.linkStrong'],
  ['#EFEFEF', 'c.storageTrack'],
  ['#666666', 'c.textMuted'],
  ['#8E8E8E', 'c.textMuted'],
  ['#D3EFE3', 'c.surfaceAccent'],
  ['#DBE8FF', 'c.backgroundSecondary'],
  ['#B87700', 'c.textWarningStrong'],
  ['#EBEBEB', 'c.storageTrack'],
  ['#4F4F4F', 'c.textSecondary'],
  ['#676767', 'c.textMuted'],
  ['#7CD8BA', 'c.link'],
  ['#565656', 'c.textSecondary'],
  ['#1F1F1F', 'c.text'],
  ['#6C6C6C', 'c.textMuted'],
  ['#515151', 'c.textSecondary'],
  ['#3D3D3D', 'c.text'],
  ['#E8F8F1', 'c.surfaceAccent'],
  ["'#eee'", 'c.storageTrack'],
  ['#eee', 'c.storageTrack'],
  ['#F4F5F3', 'c.background'],
];

function generateThemedStyles(sourcePath, exportName, outPath, extraImports = '') {
  const src = fs.readFileSync(sourcePath, 'utf8');
  const m = src.match(/const styles = StyleSheet\.create\(\{([\s\S]*)\}\);\s*$/);
  if (!m) {
    console.error('no match in', sourcePath);
    return false;
  }
  let body = m[1];
  for (const [hex, token] of REPS) {
    body = body.replaceAll(`'${hex}'`, token);
  }
  body = body.replaceAll('color: Brand.primary,', 'color: c.link,');
  body = body.replaceAll('color: Brand.primaryDark,', 'color: c.linkStrong,');
  body = body.replaceAll('color: Brand.primary', 'color: c.link');
  body = body.replaceAll('color: Brand.accent,', 'color: c.link,');
  body = body.replaceAll('color: Brand.accent', 'color: c.link');
  const out = `import { StyleSheet } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';
${extraImports}
export function ${exportName}(c: AppColors) {
  return StyleSheet.create({${body}});
}
`;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out);
  console.log('written', outPath);
  return true;
}

const jobs = [
  ['app/documents.tsx', 'createDocumentsScreenStyles', 'screenStyles/documentsScreenStyles.ts'],
  ['app/data-sharing.tsx', 'createDataSharingScreenStyles', 'screenStyles/dataSharingScreenStyles.ts'],
  ['app/plot/[id].tsx', 'createPlotDetailScreenStyles', 'screenStyles/plotDetailScreenStyles.ts'],
  ['components/mapping/CaptureInstructionsLink.tsx', 'createCaptureInstructionsLinkStyles', 'components/mapping/captureInstructionsLinkStyles.ts'],
  ['components/mapping/CornerMapOverlay.tsx', 'createCornerMapOverlayStyles', 'components/mapping/cornerMapOverlayStyles.ts'],
  ['components/mapping/GeometryConfidenceBanner.tsx', 'createGeometryConfidenceBannerStyles', 'components/mapping/geometryConfidenceBannerStyles.ts'],
  ['components/mapping/PlotContiguityRuleCard.tsx', 'createPlotContiguityRuleCardStyles', 'components/mapping/plotContiguityRuleCardStyles.ts'],
  ['components/mapping/SecondPlotOverlapTip.tsx', 'createSecondPlotOverlapTipStyles', 'components/mapping/secondPlotOverlapTipStyles.ts'],
  ['components/evidence/PlotEvidencePanel.tsx', 'createPlotEvidencePanelStyles', 'components/evidence/plotEvidencePanelStyles.ts'],
  ['components/evidence/PlotLandPapersCard.tsx', 'createPlotLandPapersCardStyles', 'components/evidence/plotLandPapersCardStyles.ts'],
  ['components/evidence/ProducerDeclarationsSection.tsx', 'createProducerDeclarationsSectionStyles', 'components/evidence/producerDeclarationsSectionStyles.ts'],
  ['components/evidence/ProducerSupportingFilesSection.tsx', 'createProducerSupportingFilesSectionStyles', 'components/evidence/producerSupportingFilesSectionStyles.ts'],
  ['components/evidence/DocumentListRow.tsx', 'createDocumentListRowStyles', 'components/evidence/documentListRowStyles.ts'],
  ['components/evidence/DocumentPreviewModal.tsx', 'createDocumentPreviewModalStyles', 'components/evidence/documentPreviewModalStyles.ts'],
  ['components/compliance/PlotTenureStatusCard.tsx', 'createPlotTenureStatusCardStyles', 'components/compliance/plotTenureStatusCardStyles.ts'],
  ['components/compliance/PlotAttestationsCard.tsx', 'createPlotAttestationsCardStyles', 'components/compliance/plotAttestationsCardStyles.ts'],
  ['components/compliance/PlotComplianceStatusCards.tsx', 'createPlotComplianceStatusCardsStyles', 'components/compliance/plotComplianceStatusCardsStyles.ts'],
  ['features/harvest/MultiPlotDeliveryWizard.tsx', 'createMultiPlotDeliveryWizardStyles', 'features/harvest/multiPlotDeliveryWizardStyles.ts'],
  ['features/harvest/DeliveryRecipientFields.tsx', 'createDeliveryRecipientFieldsStyles', 'features/harvest/deliveryRecipientFieldsStyles.ts'],
];

let failed = 0;
for (const [src, name, out] of jobs) {
  if (out === 'SKIP') continue;
  if (!generateThemedStyles(src, name, out)) failed += 1;
}

process.exit(failed > 0 ? 1 : 0);
