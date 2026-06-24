'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { EnumerationCampaignProgress } from '@/lib/enumeration-campaign-types';

type EnumerationCampaignProgressPanelProps = {
  progress: EnumerationCampaignProgress;
};

export function EnumerationCampaignProgressPanel({ progress }: EnumerationCampaignProgressPanelProps) {
  const { totals } = progress;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Roster members" value={totals.rosterMembers} />
        <StatCard label="Members with plots" value={totals.membersWithPlots} />
        <StatCard label="Plots captured" value={totals.plotsCaptured} />
        <StatCard label="Provisional pending review" value={totals.provisionalPendingReview} />
        <StatCard label="Geometry pending approval" value={totals.plotsPendingGeometryApproval} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member collection progress</CardTitle>
          <CardDescription>
            Roster targets for this campaign. Provisional members need desk review before merge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {progress.members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No roster members yet. Add farmer targets to the campaign draft, then send or launch it.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead>Plots</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progress.members.map((member) => (
                  <TableRow key={member.farmerId}>
                    <TableCell className="font-medium">{member.fullName}</TableCell>
                    <TableCell>{member.village ?? '—'}</TableCell>
                    <TableCell>{member.plotCount}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.isProvisional ? (
                          <Badge variant="outline">Provisional</Badge>
                        ) : (
                          <Badge variant="secondary">Roster</Badge>
                        )}
                        {member.geometryPendingApproval > 0 ? (
                          <Badge className="bg-amber-500/15 text-amber-800">
                            {member.geometryPendingApproval} geometry review
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {member.producerContactId ? (
                        <Link
                          href={`/contacts/${member.producerContactId}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Open contact
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
