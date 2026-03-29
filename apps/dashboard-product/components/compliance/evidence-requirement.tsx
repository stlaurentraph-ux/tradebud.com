'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';

interface EvidenceItem {
  id: string;
  type: 'satellite_imagery' | 'field_report' | 'government_source' | 'certification';
  title: string;
  status: 'verified' | 'pending' | 'rejected';
  date: string;
  source: string;
}

interface EvidenceRequirementProps {
  plotId: string;
  plotName: string;
  requiredEvidence: EvidenceItem[];
  missingEvidence: string[];
}

export function EvidenceRequirement({
  plotId,
  plotName,
  requiredEvidence,
  missingEvidence,
}: EvidenceRequirementProps) {
  const [expanded, setExpanded] = useState(true);

  const verifiedCount = requiredEvidence.filter((e) => e.status === 'verified').length;
  const totalRequired = requiredEvidence.length + missingEvidence.length;

  return (
    <Card className="border-l-4 border-blue-300">
      <CardHeader
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {verifiedCount === requiredEvidence.length && missingEvidence.length === 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            )}
            <div>
              <CardTitle className="text-base">{plotName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {verifiedCount}/{requiredEvidence.length} evidence items verified
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Provided Evidence */}
          {requiredEvidence.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-3">Provided Evidence</h4>
              <div className="space-y-2">
                {requiredEvidence.map((evidence) => (
                  <div
                    key={evidence.id}
                    className={`p-3 rounded-lg border-2 ${
                      evidence.status === 'verified'
                        ? 'border-green-200 bg-green-50'
                        : evidence.status === 'pending'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{evidence.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {evidence.type.replace(/_/g, ' ').toUpperCase()} · {evidence.source} ·{' '}
                          {new Date(evidence.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                          evidence.status === 'verified'
                            ? 'bg-green-200 text-green-800'
                            : evidence.status === 'pending'
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-red-200 text-red-800'
                        }`}
                      >
                        {evidence.status.charAt(0).toUpperCase() + evidence.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Evidence */}
          {missingEvidence.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-3 text-red-900">Missing Evidence</h4>
              <div className="space-y-2">
                {missingEvidence.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border-2 border-red-200 bg-red-50">
                    <p className="text-sm font-medium text-red-900">{item}</p>
                    <p className="text-xs text-red-800 mt-1">
                      This evidence type is required to verify deforestation compliance
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm">
              Upload Evidence
            </Button>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
