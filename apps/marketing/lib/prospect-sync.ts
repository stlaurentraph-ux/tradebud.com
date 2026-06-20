import { mapToOutreachActivity, mapToProspect } from '@/lib/founder-os-mapper';
import { getSupabaseCrm } from '@/lib/supabase-admin';

type ProspectFormType = 'exporter' | 'importer' | 'country' | 'farmer' | 'cooperative' | 'pilot';

type SyncInput = {
  formType: ProspectFormType;
  name: string;
  email: string;
  company?: string | null;
  country?: string | null;
  sourcePage: string;
  payload: Record<string, unknown>;
};

export async function syncLeadToProspects(input: SyncInput): Promise<void> {
  const crm = getSupabaseCrm();
  const prospect = mapToProspect(input);
  const activity = mapToOutreachActivity(input);

  const { data: inserted, error: insertError } = await crm
    .from('prospects')
    .insert(prospect)
    .select('id')
    .single();

  if (insertError || !inserted?.id) {
    console.error('[prospect-sync] insert failed:', insertError?.message);
    return;
  }

  const { error: activityError } = await crm.from('outreach_activity').insert({
    ...activity,
    prospect_id: inserted.id,
  });

  if (activityError) {
    console.error('[prospect-sync] outreach activity failed:', activityError.message);
  }

  if (input.formType === 'pilot') {
    const commodity = asString(input.payload.commodity) ?? asString(input.payload.commodities);
    const { error: pilotError } = await crm.from('pilots').insert({
      prospect_id: inserted.id,
      name: `${prospect.company ?? input.name} pilot`,
      status: 'lead',
      country: input.country ?? null,
      commodity: commodity?.toLowerCase() ?? null,
      success_criteria: asString(input.payload.successCriteria),
      notes: `Auto-created from pilot form ${input.sourcePage}`,
    });
    if (pilotError) console.error('[prospect-sync] pilot record failed:', pilotError.message);
  }
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function syncWaitlistToProspects(input: {
  firstName: string;
  lastName: string;
  email: string;
  organisation: string;
  role: string;
  commodity: string;
  producerRange: string;
  sourcePage: string;
}): Promise<void> {
  const crm = getSupabaseCrm();
  const name = `${input.firstName} ${input.lastName}`.trim();
  const { data: inserted, error: insertError } = await crm
    .from('prospects')
    .insert({
      name,
      company: input.organisation,
      email: input.email,
      commodity_focus: input.commodity.toLowerCase(),
      company_size: input.producerRange,
      source: 'website_waitlist',
      stage: 'identified',
      connection_status: 'not_sent',
      notes: `Waitlist signup (${input.role}) from ${input.sourcePage}`,
      tags: ['source:waitlist', 'source:website_form', `role:${input.role.toLowerCase()}`],
    })
    .select('id')
    .single();

  if (insertError || !inserted?.id) {
    console.error('[prospect-sync] waitlist insert failed:', insertError?.message);
    return;
  }

  const { error: activityError } = await crm.from('outreach_activity').insert({
    prospect_id: inserted.id,
    activity_type: 'identified',
    channel: 'website',
    content: `Waitlist signup from ${input.sourcePage}`,
    metadata: {
      role: input.role,
      commodity: input.commodity,
      producerRange: input.producerRange,
      email: input.email,
    },
    performed_by: 'system',
  });

  if (activityError) {
    console.error('[prospect-sync] waitlist activity failed:', activityError.message);
  }
}
