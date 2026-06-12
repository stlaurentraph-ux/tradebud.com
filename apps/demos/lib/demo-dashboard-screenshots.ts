/**
 * Reference screenshots for public demo dashboards (June 2026).
 * Use for marketing, QA evidence, pitch decks, and visual regression baselines.
 *
 * Files live alongside this module under `screenshots/`.
 */

export type DemoDashboardRole =
  | "exporter"
  | "importer"
  | "cooperative"
  | "country";

export type DemoDashboardScreenshot = {
  role: DemoDashboardRole;
  /** Primary view shown in the screenshot */
  view: string;
  title: string;
  demoUrl: string;
  /** Path relative to `apps/demos/lib/` */
  file: string;
  capturedAt: string;
};

export const DEMO_DASHBOARD_SCREENSHOTS = [
  {
    role: "exporter",
    view: "overview",
    title: "Green Valley Exports — EUDR compliance overview",
    demoUrl: "https://exporter-demo.tracebud.com",
    file: "screenshots/exporter-overview.png",
    capturedAt: "2026-06-12",
  },
  {
    role: "importer",
    view: "inbound-lots",
    title: "NordCup Roasters AB — inbound lots",
    demoUrl: "https://importer-demo.tracebud.com",
    file: "screenshots/importer-inbound-lots.png",
    capturedAt: "2026-06-12",
  },
  {
    role: "cooperative",
    view: "overview",
    title: "Copán Highlands Coop — cooperative control tower",
    demoUrl: "https://cooperative-demo.tracebud.com",
    file: "screenshots/cooperative-overview.png",
    capturedAt: "2026-06-12",
  },
  {
    role: "country",
    view: "overview",
    title: "Ministry of Agriculture — national control tower",
    demoUrl: "https://country-demo.tracebud.com",
    file: "screenshots/country-overview.png",
    capturedAt: "2026-06-12",
  },
] as const satisfies readonly DemoDashboardScreenshot[];

export function getDemoDashboardScreenshot(
  role: DemoDashboardRole,
  view?: string,
): DemoDashboardScreenshot | undefined {
  return DEMO_DASHBOARD_SCREENSHOTS.find(
    (entry) => entry.role === role && (view == null || entry.view === view),
  );
}
