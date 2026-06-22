import fs from 'fs';

const JOBS = [
  ['app/documents.tsx', '@/app/documentsScreenStyles', 'createDocumentsScreenStyles'],
  ['app/data-sharing.tsx', '@/app/dataSharingScreenStyles', 'createDataSharingScreenStyles'],
  ['app/plot/[id].tsx', '@/app/plot/plotDetailScreenStyles', 'createPlotDetailScreenStyles'],
  ['components/mapping/CaptureInstructionsLink.tsx', '@/components/mapping/captureInstructionsLinkStyles', 'createCaptureInstructionsLinkStyles'],
  ['components/mapping/CornerMapOverlay.tsx', '@/components/mapping/cornerMapOverlayStyles', 'createCornerMapOverlayStyles'],
  ['components/mapping/GeometryConfidenceBanner.tsx', '@/components/mapping/geometryConfidenceBannerStyles', 'createGeometryConfidenceBannerStyles'],
  ['components/mapping/PlotContiguityRuleCard.tsx', '@/components/mapping/plotContiguityRuleCardStyles', 'createPlotContiguityRuleCardStyles'],
  ['components/mapping/SecondPlotOverlapTip.tsx', '@/components/mapping/secondPlotOverlapTipStyles', 'createSecondPlotOverlapTipStyles'],
  ['components/evidence/PlotEvidencePanel.tsx', '@/components/evidence/plotEvidencePanelStyles', 'createPlotEvidencePanelStyles'],
  ['components/evidence/PlotLandPapersCard.tsx', '@/components/evidence/plotLandPapersCardStyles', 'createPlotLandPapersCardStyles'],
  ['components/evidence/ProducerDeclarationsSection.tsx', '@/components/evidence/producerDeclarationsSectionStyles', 'createProducerDeclarationsSectionStyles'],
  ['components/evidence/ProducerSupportingFilesSection.tsx', '@/components/evidence/producerSupportingFilesSectionStyles', 'createProducerSupportingFilesSectionStyles'],
  ['components/evidence/DocumentListRow.tsx', '@/components/evidence/documentListRowStyles', 'createDocumentListRowStyles'],
  ['components/evidence/DocumentPreviewModal.tsx', '@/components/evidence/documentPreviewModalStyles', 'createDocumentPreviewModalStyles'],
  ['components/compliance/PlotTenureStatusCard.tsx', '@/components/compliance/plotTenureStatusCardStyles', 'createPlotTenureStatusCardStyles'],
  ['components/compliance/PlotAttestationsCard.tsx', '@/components/compliance/plotAttestationsCardStyles', 'createPlotAttestationsCardStyles'],
  ['components/compliance/PlotComplianceStatusCards.tsx', '@/components/compliance/plotComplianceStatusCardsStyles', 'createPlotComplianceStatusCardsStyles'],
  ['features/harvest/MultiPlotDeliveryWizard.tsx', '@/features/harvest/multiPlotDeliveryWizardStyles', 'createMultiPlotDeliveryWizardStyles'],
  ['features/harvest/DeliveryRecipientFields.tsx', '@/features/harvest/deliveryRecipientFieldsStyles', 'createDeliveryRecipientFieldsStyles'],
];

for (const [file, importPath, factory] of JOBS) {
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('useThemedStyles')) {
    const themeImport = `import { useThemedStyles } from '@/features/theme/useThemedStyles';\nimport { ${factory} } from '${importPath}';\n`;
    const lastImport = src.lastIndexOf('\nimport ');
    const endOfImport = src.indexOf('\n', lastImport + 1);
    src = src.slice(0, endOfImport + 1) + themeImport + src.slice(endOfImport + 1);
  }
  if (!src.includes(`useThemedStyles(${factory})`) && !src.includes(`useThemedStyles((c) => ${factory}(c))`)) {
    src = src.replace(
      /export function (\w+)\([^)]*\) \{\n/,
      (match, name) => `${match}  const styles = useThemedStyles(${factory});\n`,
    );
    src = src.replace(
      /export default function (\w+)\(\) \{\n/,
      (match) => `${match}  const styles = useThemedStyles(${factory});\n`,
    );
  }
  src = src.replace(/\nconst styles = StyleSheet\.create\(\{[\s\S]*\}\);\s*$/, '\n');
  fs.writeFileSync(file, src);
  console.log('wired', file);
}
