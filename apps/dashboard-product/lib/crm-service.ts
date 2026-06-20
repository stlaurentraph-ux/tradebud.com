import { getFounderOsClient, getSupabaseCrm } from "@/lib/supabase-admin";

export async function listProspects(limit = 100) {
  const supabase = getSupabaseCrm();
  const { data, error } = await supabase
    .from("prospects")
    .select("*, market_registry(id, country_name, commodity, segment, priority_tier)")
    .order("icp_score", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateProspect(id: string, input: Partial<{ stage: string; segment: string | null; notes: string | null }>) {
  const supabase = getSupabaseCrm();
  const { data, error } = await supabase
    .from("prospects")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, market_registry(id, country_name, commodity, segment, priority_tier)")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createProspect(input: {
  name: string;
  company: string;
  email?: string | null;
  notes?: string | null;
  source?: string;
  stage?: string;
}) {
  const supabase = getSupabaseCrm();
  const { data, error } = await supabase
    .from("prospects")
    .insert({
      name: input.name,
      company: input.company,
      email: input.email ?? null,
      notes: input.notes ?? null,
      source: input.source ?? "manual_entry",
      stage: input.stage ?? "identified",
      connection_status: "not_sent",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listDailyActions(actionDate?: string) {
  const supabase = getSupabaseCrm();
  const date = actionDate ?? new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("daily_actions")
    .select("*, prospects(name, company, title, linkedin_url, stage)")
    .eq("action_date", date)
    .order("completed", { ascending: true })
    .order("priority", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listDailyActionsHistory(days = 30) {
  const supabase = getSupabaseCrm();
  const start = new Date();
  start.setDate(start.getDate() - Math.max(1, days));
  const fromDate = start.toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("daily_actions")
    .select("id, action_date, completed, completed_at")
    .gte("action_date", fromDate)
    .order("action_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function ensureDailyOutreachActions(actionDate?: string, _target = 3) {
  const date = actionDate ?? new Date().toISOString().slice(0, 10);
  const weekday = new Date(`${date}T00:00:00`).getDay();
  if (weekday === 0 || weekday === 6) return listDailyActions(date);

  const { error: genError } = await getFounderOsClient().rpc("generate_daily_actions", { target_date: date });
  if (genError) throw new Error(genError.message);
  return listDailyActions(date);
}

export async function markDailyActionComplete(id: string) {
  const supabase = getSupabaseCrm();
  const { data, error } = await supabase
    .from("daily_actions")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listOutreachTemplates() {
  const supabase = getSupabaseCrm();
  const { data, error } = await supabase
    .from("outreach_templates")
    .select("*")
    .order("stage", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createOutreachTemplate(input: {
  name: string;
  stage: string;
  channel: string;
  content: string;
}) {
  const supabase = getSupabaseCrm();
  const { data, error } = await supabase
    .from("outreach_templates")
    .insert({
      name: input.name,
      stage: input.stage,
      channel: input.channel,
      content: input.content,
      active: true,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listOutreachActivity(limit = 200) {
  const supabase = getSupabaseCrm();
  const { data, error } = await supabase
    .from("outreach_activity")
    .select("*, prospects(id, name, company)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createOutreachActivity(input: {
  prospect_id: string;
  activity_type?: string;
  channel?: string;
  content: string;
}) {
  const supabase = getSupabaseCrm();
  const { data, error } = await supabase
    .from("outreach_activity")
    .insert({
      prospect_id: input.prospect_id,
      activity_type: input.activity_type ?? "note",
      channel: input.channel ?? "manual",
      content: input.content,
    })
    .select("*, prospects(id, name, company)")
    .single();
  if (error) throw new Error(error.message);
  return data;
}
