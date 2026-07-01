export type FarmerActivityCategory =
  | 'deforestation'
  | 'land_documents'
  | 'plot_setup'
  | 'boundary'
  | 'consent'
  | 'sync';

export type FarmerActivitySeverity = 'action' | 'info';

export type FarmerActivityNavigateTarget =
  | { screen: 'plot'; plotId: string; plotSub?: 'photos' | 'documents' }
  | { screen: 'data-sharing' }
  | { screen: 'documents' }
  | { screen: 'backup' };

export type FarmerActivityItem = {
  id: string;
  category: FarmerActivityCategory;
  severity: FarmerActivitySeverity;
  titleKey: string;
  titleParams?: Record<string, string | number>;
  subtitleKey?: string;
  subtitleParams?: Record<string, string | number>;
  occurredAt: string | null;
  navigate: FarmerActivityNavigateTarget;
};

export type FarmerActivityFeedSnapshot = {
  fetchedAt: string;
  items: FarmerActivityItem[];
  actionCount: number;
};
