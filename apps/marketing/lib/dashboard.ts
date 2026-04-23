const DEFAULT_DASHBOARD_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://app.tracebud.com";

export const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL || DEFAULT_DASHBOARD_URL;

type PrimaryRole = "exporter" | "importer" | "compliance_manager";

export function getCreateAccountUrl(primaryRole?: PrimaryRole): string {
  if (!primaryRole) {
    return `${DASHBOARD_URL}/create-account`;
  }
  return `${DASHBOARD_URL}/create-account?primaryRole=${primaryRole}`;
}
