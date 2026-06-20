import { Alert } from 'react-native';

import { pickEvidenceFile } from '@/features/evidence/pickEvidenceFile';
import { copyEvidenceUriToAppStorage } from '@/features/evidence/readLocalEvidenceFile';
import {
  loadEvidenceForPlot,
  loadTitlePhotosForPlot,
  persistPlotEvidenceItem,
  persistPlotTitlePhoto,
  type PlotEvidenceItem,
  type PlotTitlePhoto,
} from '@/features/state/persistence';

function isImageMime(mimeType: string | null): boolean {
  return Boolean(mimeType?.startsWith('image/'));
}

export type LandProofSaveResult =
  | { kind: 'photo'; titlePhotos: PlotTitlePhoto[]; evidence: PlotEvidenceItem[] }
  | { kind: 'file'; titlePhotos: PlotTitlePhoto[]; evidence: PlotEvidenceItem[] };

export async function pickAndSaveLandProof(params: {
  plotId: string;
  pickMessages?: Parameters<typeof pickEvidenceFile>[0];
}): Promise<LandProofSaveResult | null> {
  const file = await pickEvidenceFile(params.pickMessages);
  if (!file) return null;

  const takenAt = Date.now();

  try {
    if (isImageMime(file.mimeType)) {
      const durableUri = await copyEvidenceUriToAppStorage({
        sourceUri: file.uri,
        plotId: params.plotId,
        kind: 'land_title',
        mimeType: file.mimeType,
        name: file.name,
      });
      await persistPlotTitlePhoto({
        plotId: params.plotId,
        uri: durableUri,
        takenAt,
      });
      const [titlePhotos, evidence] = await Promise.all([
        loadTitlePhotosForPlot(params.plotId),
        loadEvidenceForPlot(params.plotId),
      ]);
      return { kind: 'photo', titlePhotos, evidence };
    }

    const durableUri = await copyEvidenceUriToAppStorage({
      sourceUri: file.uri,
      plotId: params.plotId,
      kind: 'tenure_evidence',
      mimeType: file.mimeType,
      name: file.name,
    });
    await persistPlotEvidenceItem({
      plotId: params.plotId,
      kind: 'tenure_evidence',
      uri: durableUri,
      mimeType: file.mimeType,
      label: file.name ?? 'tenure_doc',
      takenAt,
    });
    const [titlePhotos, evidence] = await Promise.all([
      loadTitlePhotosForPlot(params.plotId),
      loadEvidenceForPlot(params.plotId),
    ]);
    return { kind: 'file', titlePhotos, evidence };
  } catch {
    Alert.alert('Could not save document', 'Try again or restart the app.');
    return null;
  }
}
