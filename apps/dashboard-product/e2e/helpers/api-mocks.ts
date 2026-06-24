import type { Page } from '@playwright/test';
import { GOLDEN_EXPORTER_SMOKE, GOLDEN_SMOKE } from './smoke-session';

const EMPTY_METRICS = {
  total_packages: 0,
  packages_by_status: {
    DRAFT: 0,
    READY: 0,
    SEALED: 0,
    SUBMITTED: 0,
    ACCEPTED: 0,
    REJECTED: 0,
    ARCHIVED: 0,
  },
  total_plots: 0,
  compliant_plots: 0,
  total_farmers: 0,
  incoming_requests_pending: 0,
  outgoing_requests_pending: 0,
  blocking_issues_count: 0,
  yield_failures_count: 0,
  upstream_blockers_count: 0,
  owned_blocking_issues_count: 0,
  recent_activity: [],
};

export async function mockAuthenticatedDashboardApis(
  page: Page,
  options?: { primaryRole?: string },
): Promise<void> {
  const primaryRole = options?.primaryRole ?? 'importer';
  await page.route('**/api/launch/commercial-profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        profile: {
          tenant_id: GOLDEN_SMOKE.tenantId,
          organization_name: GOLDEN_SMOKE.organizationName,
          country: 'RW',
          primary_role: primaryRole,
          supply_chain_roles: [primaryRole],
          team_size: null,
          main_commodity: 'coffee',
          primary_objective: null,
          profile_skipped: false,
          updated_at: new Date().toISOString(),
        },
      }),
    });
  });

  await page.route('**/api/dashboard/summary**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        metrics: EMPTY_METRICS,
        packages: [],
        campaigns: [],
      }),
    });
  });

  await page.route('**/api/launch/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        lifecycle_status: 'active',
        trial_expires_at: null,
      }),
    });
  });
}

export async function mockSupabasePasswordGrant(page: Page, accessToken: string): Promise<void> {
  await page.route('**/auth/v1/token?grant_type=password', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: 'playwright-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
      }),
    });
  });
}

export async function mockOnboardingProxy(page: Page): Promise<{
  getCalls: () => number;
  postBodies: () => Array<{ role: string; stepKey: string }>;
}> {
  let getCount = 0;
  const postPayloads: Array<{ role: string; stepKey: string }> = [];

  await page.route('**/api/launch/onboarding**', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      getCount += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [{ step_key: GOLDEN_SMOKE.onboardingStepKey, completed: false }],
        }),
      });
      return;
    }

    if (request.method() === 'POST') {
      const body = (request.postDataJSON() ?? {}) as { role?: string; stepKey?: string };
      postPayloads.push({
        role: body.role ?? '',
        stepKey: body.stepKey ?? '',
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
      return;
    }

    await route.continue();
  });

  return {
    getCalls: () => getCount,
    postBodies: () => postPayloads,
  };
}

const SMOKE_DRAFT_CAMPAIGN = {
  id: 'campaign_playwright_draft',
  title: 'Playwright Evidence Request',
  description: 'Golden path draft campaign',
  request_type: 'GENERAL_EVIDENCE',
  status: 'DRAFT',
  target_organization_ids: [],
  target_farmer_ids: [],
  target_plot_ids: [],
  target_contact_emails: ['supplier@tracebud.test'],
  due_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
  accepted_count: 0,
  pending_count: 0,
  expired_count: 0,
  created_by: 'playwright',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export async function mockOutreachCampaignApis(page: Page): Promise<{
  sendCalls: () => number;
  archiveCalls: () => number;
}> {
  let campaigns = [{ ...SMOKE_DRAFT_CAMPAIGN }];
  let sendCount = 0;
  let archiveCount = 0;

  await page.route('**/api/requests/campaigns', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ campaigns }),
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/requests/campaigns/*/send', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    sendCount += 1;
    campaigns = campaigns.map((campaign) =>
      campaign.id === SMOKE_DRAFT_CAMPAIGN.id
        ? { ...campaign, status: 'RUNNING', updated_at: new Date().toISOString() }
        : campaign,
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, campaign: campaigns[0] }),
    });
  });

  await page.route('**/api/requests/campaigns/*/archive', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    archiveCount += 1;
    campaigns = campaigns.map((campaign) =>
      campaign.id === SMOKE_DRAFT_CAMPAIGN.id
        ? { ...campaign, status: 'CANCELLED', updated_at: new Date().toISOString() }
        : campaign,
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ campaign_id: SMOKE_DRAFT_CAMPAIGN.id, campaign: campaigns[0] }),
    });
  });

  return {
    sendCalls: () => sendCount,
    archiveCalls: () => archiveCount,
  };
}

const SMOKE_CANONICAL_ISSUE = {
  id: 'issue_compliance_playwright_1',
  title: 'Playwright tenure gap',
  description: 'Missing land title evidence for plot review',
  severity: 'WARNING',
  status: 'open',
  owner: null,
  linked_entity_type: 'plot',
  linked_entity_id: 'plot_pw_1',
  linked_entity_name: 'Plot PW-1',
  due_date: null,
  created_at: new Date().toISOString(),
  resolution_path: '/plots/plot_pw_1',
  issue_kind: 'canonical',
  owner_role: 'exporter',
  owner_organisation_name: 'Golden Exporter',
  source_issue_id: null,
  can_update_status: true,
};

export async function mockComplianceIssuesApis(page: Page): Promise<{
  patchCalls: () => number;
}> {
  let issues = [{ ...SMOKE_CANONICAL_ISSUE }];
  let patchCount = 0;

  await page.route('**/api/requests/issues', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(issues),
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/requests/issues/*', async (route) => {
    if (route.request().method() !== 'PATCH') {
      await route.continue();
      return;
    }
    patchCount += 1;
    const body = (route.request().postDataJSON() ?? {}) as { status?: string };
    issues = issues.map((issue) =>
      issue.id === SMOKE_CANONICAL_ISSUE.id
        ? { ...issue, status: body.status ?? issue.status }
        : issue,
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: SMOKE_CANONICAL_ISSUE.id, status: body.status ?? 'open' }),
    });
  });

  return { patchCalls: () => patchCount };
}

const SMOKE_EXPORTER_PACKAGE = {
  package: {
    id: GOLDEN_EXPORTER_SMOKE.packageId,
    label: 'SHP-PW-001',
    status: 'draft',
    farmer_id: 'farmer_pw_1',
    sender_tenant_id: GOLDEN_EXPORTER_SMOKE.tenantId,
    sender_org: 'Coop Alpha',
    created_at: new Date().toISOString(),
    plot_count: 1,
    compliant_plot_count: 0,
  },
  vouchers: [],
};

export async function mockPlotGeometryApprovalApis(
  page: Page,
  options?: { approved?: boolean },
): Promise<void> {
  const approved = options?.approved ?? false;
  const plotId = GOLDEN_EXPORTER_SMOKE.packageId;

  await page.route(`**/api/plots/${plotId}/map-preview`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: plotId,
        name: 'Test Plot',
        kind: 'polygon',
        area_ha: 1.2,
        status: 'under_review',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [30.0612, -1.9441],
              [30.0624, -1.9441],
              [30.0624, -1.9432],
              [30.0612, -1.9432],
              [30.0612, -1.9441],
            ],
          ],
        },
        geometry_capture: {
          geometry_confidence_tier: 'low',
          capture_method: 'gps_walk',
        },
        geometry_approved_at: approved ? new Date().toISOString() : null,
      }),
    });
  });

  await page.route(`**/api/plots/${plotId}/approve-geometry`, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        geometry_approved_at: new Date().toISOString(),
      }),
    });
  });
}

export async function mockExporterPackageReadinessApis(
  page: Page,
  options?: { blocked?: boolean },
): Promise<void> {
  const blocked = options?.blocked ?? true;
  const packageId = GOLDEN_EXPORTER_SMOKE.packageId;

  await page.route('**/api/harvest/packages/**', async (route) => {
    const request = route.request();
    const url = request.url();

    if (request.method() !== 'GET') {
      await route.continue();
      return;
    }

    if (url.includes('/readiness')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          packageId,
          status: blocked ? 'blocked' : 'ready_to_submit',
          blockers: blocked
            ? [
                {
                  code: 'MISSING_PLOT_GEOMETRY',
                  message: 'Plot geometry missing for linked producer',
                  severity: 'blocker',
                },
              ]
            : [],
          warnings: [],
          checkedAt: new Date().toISOString(),
        }),
      });
      return;
    }

    if (url.includes(packageId)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SMOKE_EXPORTER_PACKAGE),
      });
      return;
    }

    await route.continue();
  });
}
