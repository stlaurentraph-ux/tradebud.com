import { RequestsService } from './requests.service';

describe('RequestsService operational issues', () => {
  it('merges owned and upstream blocker issues', async () => {
    const owned = [
      {
        id: 'issue_compliance_owned',
        title: 'Owned issue',
        description: 'desc',
        severity: 'WARNING' as const,
        status: 'open' as const,
        owner: null,
        linked_entity_type: 'plot',
        linked_entity_id: 'plot-1',
        linked_entity_name: 'Plot 1',
        due_date: null,
        created_at: '2026-06-10T00:00:00.000Z',
        resolution_path: null,
        issue_kind: 'canonical' as const,
        owner_role: 'exporter',
        owner_organisation_name: 'Exporter Org',
        source_issue_id: null,
        can_update_status: true,
      },
    ];
    const upstream = [
      {
        ...owned[0],
        id: 'issue_upstream_peer',
        issue_kind: 'upstream_blocker' as const,
        can_update_status: false,
        source_issue_id: 'issue_compliance_peer',
      },
    ];

    const pool = { query: jest.fn() };
    const service = new RequestsService(pool as any, {} as any, {} as any);
    jest.spyOn(service as any, 'listOwnedOperationalIssues').mockResolvedValue(owned);
    jest.spyOn(service as any, 'listUpstreamBlockerIssues').mockResolvedValue(upstream);

    const issues = await service.listOperationalIssues('tenant_importer');
    expect(issues).toHaveLength(2);
    expect(issues.some((issue) => issue.issue_kind === 'upstream_blocker')).toBe(true);
  });
});
