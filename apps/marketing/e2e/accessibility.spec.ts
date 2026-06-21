import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';

const locale = 'en';
const baselinePath = path.join(
  process.cwd(),
  'qa/automation-baselines/marketing-a11y-violations.baseline.json',
);

type NormalizedViolation = {
  ruleId: string;
  impact: string;
  count: number;
};

type RouteBaseline = {
  violations: NormalizedViolation[];
};

type A11yBaseline = {
  schemaVersion: 1;
  routes: Record<string, RouteBaseline>;
};

function normalizeViolations(
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'],
): NormalizedViolation[] {
  const counts = new Map<string, NormalizedViolation>();

  for (const violation of violations) {
    const key = `${violation.id}:${violation.impact ?? 'unknown'}`;
    const current = counts.get(key);
    if (current) {
      current.count += violation.nodes.length;
      continue;
    }
    counts.set(key, {
      ruleId: violation.id,
      impact: violation.impact ?? 'unknown',
      count: violation.nodes.length,
    });
  }

  return [...counts.values()].sort((left, right) =>
    `${left.ruleId}:${left.impact}`.localeCompare(`${right.ruleId}:${right.impact}`),
  );
}

function loadBaseline(): A11yBaseline {
  if (!fs.existsSync(baselinePath)) {
    throw new Error(`Missing a11y baseline: ${baselinePath}`);
  }
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8')) as A11yBaseline;
}

function writeBaseline(routes: Record<string, RouteBaseline>) {
  const payload: A11yBaseline = {
    schemaVersion: 1,
    routes,
  };
  fs.writeFileSync(baselinePath, `${JSON.stringify(payload, null, 2)}\n`);
}

const refreshRoutes: Record<string, RouteBaseline> = {};

async function analyzeRoute(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
}

async function assertRouteMatchesBaseline(
  routeId: string,
  page: import('@playwright/test').Page,
  baseline: A11yBaseline,
) {
  const results = await analyzeRoute(page);
  const normalized = normalizeViolations(results.violations);

  if (process.env.A11Y_BASELINE_REFRESH === '1') {
    refreshRoutes[routeId] = { violations: normalized };
    return;
  }

  const expected = baseline.routes[routeId]?.violations ?? [];
  expect(normalized).toEqual(expected);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent', 'accepted');
  });
});

test('home route has no axe violations', async ({ page }) => {
  const baseline = loadBaseline();
  await page.goto(`/${locale}`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Traceability infrastructure');
  await assertRouteMatchesBaseline('home', page, baseline);
});

test('pricing route has no axe violations', async ({ page }) => {
  const baseline = loadBaseline();
  await page.goto(`/${locale}/pricing`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trace the source. Unlock the market.');
  await assertRouteMatchesBaseline('pricing', page, baseline);
});

test.afterAll(() => {
  if (process.env.A11Y_BASELINE_REFRESH === '1') {
    writeBaseline(refreshRoutes);
  }
});
