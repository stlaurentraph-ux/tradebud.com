import { Alert } from 'react-native';

import { pickEvidenceFile } from '@/features/evidence/pickEvidenceFile';
import {
  loadEvidenceForPlot,
  persistPlotEvidenceItem,
  type PlotEvidenceItem,
  type PlotEvidenceKind,
} from '@/features/state/persistence';

export async function pickAndSavePlotEvidence(params: {
  plotId: string;
  kind: PlotEvidenceKind;
  defaultLabel?: string;
  pickMessages?: Parameters<typeof pickEvidenceFile>[0];
}): Promise<PlotEvidenceItem[] | null> {
  const file = await pickEvidenceFile(params.pickMessages);
  if (!file) return null;

  try {
    await persistPlotEvidenceItem({
      plotId: params.plotId,
      kind: params.kind,
      uri: file.uri,
      mimeType: file.mimeType,
      label: file.name ?? params.defaultLabel ?? null,
      takenAt: Date.now(),
    });
  } catch {
    Alert.alert('Could not save document', 'Try again or restart the app.');
    return null;
  }

  return loadEvidenceForPlot(params.plotId);
}
