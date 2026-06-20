import { getFounderOsClient, getSupabaseCrm } from '@/lib/supabase-admin';

export async function listMarkets() {
  const { data, error } = await getSupabaseCrm().from('market_registry').select('*').order('priority_tier').order('country_name');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createMarket(input: {
  country_code: string;
  country_name: string;
  commodity: string;
  segment: string;
  priority_tier?: string;
  entry_wedge?: string | null;
}) {
  const { data, error } = await getSupabaseCrm().from('market_registry').insert({
    country_code: input.country_code.toUpperCase(),
    country_name: input.country_name,
    commodity: input.commodity.toLowerCase(),
    segment: input.segment.toLowerCase(),
    priority_tier: input.priority_tier ?? 'explore',
    entry_wedge: input.entry_wedge ?? null,
  }).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listPilots(limit = 100) {
  const { data, error } = await getSupabaseCrm().from('pilots')
    .select('*, prospects(id, name, company, email)').order('updated_at', { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPilot(input: {
  name: string;
  country?: string | null;
  commodity?: string | null;
  notes?: string | null;
  prospect_id?: string | null;
  status?: string;
}) {
  const { data, error } = await getSupabaseCrm().from('pilots').insert({
    name: input.name,
    country: input.country ?? null,
    commodity: input.commodity ?? null,
    notes: input.notes ?? null,
    prospect_id: input.prospect_id ?? null,
    status: input.status ?? 'lead',
  }).select('*, prospects(id, name, company, email)').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updatePilot(id: string, input: Partial<{ status: string; notes: string | null }>) {
  const { data, error } = await getSupabaseCrm().from('pilots').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id)
    .select('*, prospects(id, name, company, email)').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listPartnerships(limit = 100) {
  const { data, error } = await getSupabaseCrm().from('partnerships').select('*').order('updated_at', { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPartnership(input: {
  organization_name: string;
  partner_type: string;
  country?: string | null;
  notes?: string | null;
}) {
  const { data, error } = await getSupabaseCrm().from('partnerships').insert(input).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listObjections(limit = 200) {
  const { data, error } = await getSupabaseCrm().from('objection_log')
    .select('*, prospects(id, name, company)').order('logged_at', { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createObjection(input: {
  category: string;
  objection_text: string;
  response_text?: string | null;
  prospect_id?: string | null;
}) {
  const { data, error } = await getSupabaseCrm().from('objection_log').insert(input).select('*, prospects(id, name, company)').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getPenetrationMetrics() {
  const { data, error } = await getFounderOsClient().rpc('penetration_metrics');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function refreshIcpScores() {
  const { data, error } = await getFounderOsClient().rpc('refresh_prospect_icp_scores');
  if (error) throw new Error(error.message);
  return data ?? 0;
}
