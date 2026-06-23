import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import type { TranslateFn } from '@/features/i18n/translate';
import { loadPlotMappingDraft } from '@/features/state/persistence';
import {
  queuePlotMappingDraftClearSync,
  saveAndSyncPlotMappingDraft,
} from '@/features/sync/plotMappingDraft';

type MapPoint = { latitude: number; longitude: number; timestamp?: number };

export function useMappingDraftCloudSync(params: {
  farmerId: string | undefined;
  editPlotId?: string;
  plotName: string;
  captureMethod: string;
  isRecording: boolean;
  drawTracingActive: boolean;
  points: MapPoint[];
  replacePointsFromPlot: (points: MapPoint[]) => void;
  t: TranslateFn;
  enabled?: boolean;
}) {
  const resumeCheckedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!params.enabled || !params.farmerId?.trim() || resumeCheckedRef.current) return;
    resumeCheckedRef.current = true;

    void loadPlotMappingDraft(params.farmerId).then((draft) => {
      if (!draft || draft.points.length === 0) return;
      if (params.editPlotId && draft.editPlotId && draft.editPlotId !== params.editPlotId) return;
      if (!params.editPlotId && draft.editPlotId) return;

      Alert.alert(
        params.t('mapping_draft_resume_title'),
        params.t('mapping_draft_resume_body', { n: String(draft.points.length) }),
        [
          { text: params.t('cancel'), style: 'cancel' },
          {
            text: params.t('mapping_draft_resume_action'),
            onPress: () => {
              params.replacePointsFromPlot(draft.points);
            },
          },
        ],
      );
    });
  }, [params.enabled, params.editPlotId, params.farmerId, params.replacePointsFromPlot, params.t]);

  useEffect(() => {
    if (!params.enabled || !params.farmerId?.trim()) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveAndSyncPlotMappingDraft({
        farmerId: params.farmerId!,
        editPlotId: params.editPlotId ?? null,
        plotName: params.plotName || null,
        captureMethod: params.captureMethod,
        isRecording: params.isRecording,
        drawTracingActive: params.drawTracingActive,
        points: params.points,
        updatedAt: Date.now(),
      });
    }, 1200);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [
    params.captureMethod,
    params.drawTracingActive,
    params.editPlotId,
    params.enabled,
    params.farmerId,
    params.isRecording,
    params.plotName,
    params.points,
  ]);
}

export async function clearMappingDraftAfterPlotSave(farmerId: string | undefined): Promise<void> {
  if (!farmerId?.trim()) return;
  await queuePlotMappingDraftClearSync(farmerId).catch(() => undefined);
}
