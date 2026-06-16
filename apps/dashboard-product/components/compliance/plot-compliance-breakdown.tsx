'use client';

import React, { useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import {
  getPlotBreakdownAllReadyTitle,
  getPlotBreakdownBlockingItem,
  getPlotBreakdownBlockingTitle,
  getPlotBreakdownComplianceBadge,
  getPlotBreakdownDetailsSectionTitle,
  getPlotBreakdownRiskPrefix,
  getPlotBreakdownStatCompliantLabel,
  getPlotBreakdownStatNonCompliantLabel,
  getPlotBreakdownStatTotalLabel,
  getPlotBreakdownSubtitle,
  getPlotBreakdownTitle,
  getPlotBreakdownViewDetailsCta,
  getPlotDeforestationRiskLabel,
  getPlotReadyMessage,
} from '@/lib/workflow-terminology-labels';

interface Plot {
  id: string;
  name: string;
  deforestation_risk: 'low' | 'medium' | 'high';
  status: string;
}

interface PlotComplianceBreakdownProps {
  plots: Plot[];
  packageId: string;
}

export function PlotComplianceBreakdown({ plots }: PlotComplianceBreakdownProps) {
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const role = user?.active_role;
  const compliantPlots = plots.filter((p) => p.status === 'compliant');
  const nonCompliantPlots = plots.filter((p) => p.status === 'non_compliant');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{getPlotBreakdownTitle(role, t)}</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">{getPlotBreakdownSubtitle(role, t)}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {getPlotBreakdownStatTotalLabel(role, t)}
            </p>
            <p className="text-2xl font-bold mt-1">{plots.length}</p>
          </div>
          <div className="border rounded-lg p-4 border-green-500/30 bg-green-500/10">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {getPlotBreakdownStatCompliantLabel(t)}
            </p>
            <p className="text-2xl font-bold text-green-400 mt-1">{compliantPlots.length}</p>
          </div>
          <div className="border rounded-lg p-4 border-red-500/30 bg-red-500/10">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {getPlotBreakdownStatNonCompliantLabel(t)}
            </p>
            <p className="text-2xl font-bold text-red-400 mt-1">{nonCompliantPlots.length}</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">{getPlotBreakdownDetailsSectionTitle(role, t)}</h4>
          <div className="space-y-2">
            {plots.map((plot) => {
              const isCompliant = plot.status === 'compliant';
              const isHighRisk = plot.deforestation_risk === 'high';

              return (
                <div
                  key={plot.id}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    isCompliant
                      ? 'border-green-500/30 bg-green-500/10'
                      : 'border-red-500/30 bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isCompliant ? (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{plot.name}</p>
                      <p className={`text-xs ${isHighRisk ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}>
                        {getPlotBreakdownRiskPrefix(t)}{' '}
                        {getPlotDeforestationRiskLabel(plot.deforestation_risk, t)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      isCompliant
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {getPlotBreakdownComplianceBadge(isCompliant, t)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {nonCompliantPlots.length > 0 && (
          <div className="border-l-4 border-red-500 bg-red-500/10 p-4 rounded">
            <h4 className="font-medium text-red-400 mb-2">{getPlotBreakdownBlockingTitle(t)}</h4>
            <ul className="text-sm text-red-300 space-y-1 list-disc list-inside">
              {nonCompliantPlots.map((plot, idx) => (
                <li key={idx}>{getPlotBreakdownBlockingItem(plot.name, t)}</li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="mt-3">
              {getPlotBreakdownViewDetailsCta(role, t)}
            </Button>
          </div>
        )}

        {compliantPlots.length === plots.length && plots.length > 0 && (
          <div className="border-l-4 border-green-500 bg-green-500/10 p-4 rounded">
            <h4 className="font-medium text-green-400 mb-1">{getPlotBreakdownAllReadyTitle(role, t)}</h4>
            <p className="text-sm text-green-300">{getPlotReadyMessage(role, t)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
