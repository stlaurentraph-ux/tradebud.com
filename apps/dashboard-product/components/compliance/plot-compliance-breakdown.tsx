'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

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
  const isImporter = user?.active_role === 'importer';
  const compliantPlots = plots.filter((p) => p.status === 'compliant');
  const nonCompliantPlots = plots.filter((p) => p.status === 'non_compliant');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isImporter ? 'Evidence-by-Evidence Readiness Analysis' : 'Plot-by-Plot Compliance Analysis'}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {isImporter
            ? 'Detailed readiness assessment for all linked evidence records'
            : 'Detailed deforestation assessment for all plots'}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {isImporter ? 'Total Records' : 'Total Plots'}
            </p>
            <p className="text-2xl font-bold mt-1">{plots.length}</p>
          </div>
          <div className="border rounded-lg p-4 border-green-500/30 bg-green-500/10">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Compliant</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{compliantPlots.length}</p>
          </div>
          <div className="border rounded-lg p-4 border-red-500/30 bg-red-500/10">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Non-Compliant</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{nonCompliantPlots.length}</p>
          </div>
        </div>

        {/* Plot List */}
        <div>
          <h4 className="font-medium mb-3">{isImporter ? 'Evidence Details' : 'Plot Details'}</h4>
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
                        Risk: {plot.deforestation_risk.charAt(0).toUpperCase() + plot.deforestation_risk.slice(1)}
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
                    {isCompliant ? 'Compliant' : 'Non-Compliant'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Blocking Issues */}
        {nonCompliantPlots.length > 0 && (
          <div className="border-l-4 border-red-500 bg-red-500/10 p-4 rounded">
            <h4 className="font-medium text-red-400 mb-2">Blocking Issues Detected</h4>
            <ul className="text-sm text-red-300 space-y-1 list-disc list-inside">
              {nonCompliantPlots.map((plot, idx) => (
                <li key={idx}>
                  {plot.name} has deforestation evidence requiring resolution
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="mt-3">
              {isImporter ? 'View Exception Details' : 'View Evidence Details'}
            </Button>
          </div>
        )}

        {/* Ready for Submission Message */}
        {compliantPlots.length === plots.length && plots.length > 0 && (
          <div className="border-l-4 border-green-500 bg-green-500/10 p-4 rounded">
            <h4 className="font-medium text-green-400 mb-1">
              {isImporter ? 'All Records Ready' : 'All Plots Verified'}
            </h4>
            <p className="text-sm text-green-300">
              {isImporter
                ? 'This shipment is ready for declaration submission. Proceed to submit your DDS to the government portal.'
                : 'This package is ready for TRACES submission. Proceed to the next step to submit your DDS to the government portal.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
