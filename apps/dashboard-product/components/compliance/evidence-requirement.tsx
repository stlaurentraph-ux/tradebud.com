'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import {
  evaluateComplianceEvidenceRequirements,
  type EvidenceItem,
} from '@/lib/compliance-doc-reason-codes';
import { useAuth } from '@/lib/auth-context';

interface EvidenceRequirementProps {
  plotId: string;
  plotName: string;
  requiredEvidence: EvidenceItem[];
  missingEvidence: string[];
}

export function EvidenceRequirement({
  plotName,
  requiredEvidence,
  missingEvidence,
}: EvidenceRequirementProps) {
  const { user } = useAuth();
  const isImporter = user?.active_role === 'importer';
  const [expanded, setExpanded] = useState(true);

  const verifiedCount = requiredEvidence.filter((e) => e.status === 'verified').length;
  const evaluation = evaluateComplianceEvidenceRequirements(requiredEvidence, missingEvidence);

  return (
    <Card
      className={`border-l-4 ${
        evaluation.status === 'fail'
          ? 'border-red-500'
          : evaluation.status === 'warning'
            ? 'border-yellow-500'
            : 'border-green-500'
      }`}
    >
      <CardHeader
        className="cursor-pointer hover:bg-secondary/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {verifiedCount === requiredEvidence.length && missingEvidence.length === 0 ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
            )}
            <div>
              <CardTitle className="text-base">{plotName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {verifiedCount}/{requiredEvidence.length} {isImporter ? 'evidence records verified' : 'evidence items verified'}
              </p>
              <p className="text-xs mt-1 text-muted-foreground">
                Autonomous check: {evaluation.status === 'pass' ? 'pass' : evaluation.status}
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
                    className={`p-3 rounded-lg border ${
                      evidence.status === 'verified'
                        ? 'border-green-500/30 bg-green-500/10'
                        : evidence.status === 'pending'
                          ? 'border-yellow-500/30 bg-yellow-500/10'
                          : 'border-red-500/30 bg-red-500/10'
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
                            ? 'bg-green-500/20 text-green-400'
                            : evidence.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
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
              <h4 className="font-medium text-sm mb-3 text-red-400">Missing Evidence</h4>
              <div className="space-y-2">
                {missingEvidence.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                    <p className="text-sm font-medium text-red-400">{item}</p>
                    <p className="text-xs text-red-300/80 mt-1">
                      {isImporter
                        ? 'This evidence type is required before declaration submission'
                        : 'This evidence type is required to verify deforestation compliance'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {evaluation.reasons.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-3">Autonomous document checks</h4>
              <div className="space-y-2">
                {evaluation.reasons.map((reason, index) => (
                  <div
                    key={`${reason.code}-${index}`}
                    className={`p-3 rounded-lg border ${
                      reason.severity === 'blocking'
                        ? 'border-red-500/30 bg-red-500/10'
                        : 'border-yellow-500/30 bg-yellow-500/10'
                    }`}
                  >
                    <p className="text-sm font-medium">
                      {reason.code}: {reason.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Remediation: {reason.remediation}</p>
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
              {isImporter ? 'View Readiness Details' : 'View Details'}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
