import { NextResponse } from 'next/server';
import { buildSponsorDashboardSummary } from '@/lib/build-sponsor-dashboard-summary';
import { normalizeBackendArray } from '@/lib/build-dashboard-summary';
import { fetchBackendJson } from '@/lib/dashboard-fetch';

type OrganisationRecord = Record<string, unknown>;
type CampaignRecord = { id?: string; title?: string; status?: string; commodity?: string };
type ContactRecord = { contact_type?: string; country?: string | null; status?: string };

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const totalPlots = Number(searchParams.get('total_plots') ?? '0');
  const compliantPlots = Number(searchParams.get('compliant_plots') ?? '0');

  try {
    const [organisationsRaw, campaignsRaw, contactsRaw] = await Promise.allSettled([
      fetchBackendJson('/v1/admin/organizations', authHeader),
      fetchBackendJson('/v1/requests/campaigns', authHeader),
      fetchBackendJson('/v1/contacts', authHeader),
    ]);

    const organisations =
      organisationsRaw.status === 'fulfilled'
        ? normalizeBackendArray<OrganisationRecord>(organisationsRaw.value)
        : [];
    const campaigns =
      campaignsRaw.status === 'fulfilled' ? normalizeBackendArray<CampaignRecord>(campaignsRaw.value) : [];
    const contacts =
      contactsRaw.status === 'fulfilled' ? normalizeBackendArray<ContactRecord>(contactsRaw.value) : [];

    const sponsor = buildSponsorDashboardSummary({
      organisations,
      campaigns,
      contacts,
      totalPlots: Number.isFinite(totalPlots) ? totalPlots : 0,
      compliantPlots: Number.isFinite(compliantPlots) ? compliantPlots : 0,
    });

    return NextResponse.json({
      organisations,
      campaigns,
      contacts,
      aggregates: {
        countryCoverage: sponsor.countryCoverage,
        commodityCoverage: sponsor.commodityCoverage,
        networkRoles: sponsor.networkRoles,
        transparencyMetrics: sponsor.transparencyMetrics,
        organisationCount: sponsor.organisationCount,
        campaignCount: sponsor.campaignCount,
        draftCampaignCount: sponsor.draftCampaignCount,
        contactCount: sponsor.contactCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load sponsor dashboard summary.' },
      { status: 500 },
    );
  }
}
