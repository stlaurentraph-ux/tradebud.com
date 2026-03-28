/**
 * TypeScript entry: Metro resolves `./persistence` to `persistence.web` or `persistence.native` at bundle time.
 * Re-exporting native keeps `tsc` and editors happy without pulling web-only/native-only into the wrong bundle.
 */
export type { PlotPhoto, PlotTitlePhoto } from './persistence.types';
export {
  initDatabase,
  loadAppState,
  persistFarmer,
  persistPlots,
  logAuditEvent,
  persistPlotPhoto,
  loadPhotosForPlot,
  savePlotCadastralKey,
  loadPlotCadastralKey,
  persistPlotTitlePhoto,
  loadTitlePhotosForPlot,
} from './persistence.native';
