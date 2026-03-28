export type PlotPhoto = {
  id: number;
  plotId: string;
  uri: string;
  takenAt: number;
  latitude?: number | null;
  longitude?: number | null;
};

export type PlotTitlePhoto = {
  id: number;
  plotId: string;
  uri: string;
  takenAt: number;
};
