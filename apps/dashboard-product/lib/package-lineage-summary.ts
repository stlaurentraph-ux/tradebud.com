import type { DDSPackage } from '@/types';

export interface PackageLineageSummary {
  producerCount: number;
  plotCount: number;
  verifiedPlotCount: number;
  totalHectares: number;
  weightKg: number;
  isIntact: boolean;
  missingProducers: boolean;
  missingPlots: boolean;
}

export function buildPackageLineageSummary(pkg: DDSPackage): PackageLineageSummary {
  const producerCount = pkg.farmers.length;
  const plotCount = pkg.plots.length;
  const verifiedPlotCount = pkg.plots.filter((plot) => plot.verified).length;
  const totalHectares = pkg.plots.reduce((sum, plot) => sum + (plot.area_hectares ?? 0), 0);
  const weightKg = pkg.total_weight_kg ?? 0;

  return {
    producerCount,
    plotCount,
    verifiedPlotCount,
    totalHectares,
    weightKg,
    isIntact: producerCount > 0 && plotCount > 0,
    missingProducers: producerCount === 0,
    missingPlots: plotCount === 0,
  };
}
