import { GroundTruthPhotoCapture } from '@/components/plot-photo-vault/GroundTruthPhotoCapture';
import type { Plot } from '@/features/state/AppStateContext';
import type { PlotPhoto } from '@/features/state/persistence.native';
import type { TranslateFn } from '@/features/i18n/translate';

type PhotoVaultPanelProps = {
  plot: Plot;
  photos: PlotPhoto[];
  onPhotosChange: (photos: PlotPhoto[]) => void;
  t: TranslateFn;
};

export function PhotoVaultPanel({ plot, photos, onPhotosChange, t }: PhotoVaultPanelProps) {
  return (
    <GroundTruthPhotoCapture
      plot={plot}
      photos={photos}
      onPhotosChange={onPhotosChange}
      t={t}
    />
  );
}
