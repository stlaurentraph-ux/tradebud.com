import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function listProspects(limit = 100) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createProspect(input: {
  name: string;
  company: string;
  email?: string | null;
  notes?: string | null;
  source?: string;
  stage?: string;
}) {
  const supabase = getSupabaseAdmin();
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
  const supabase = getSupabaseAdmin();
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
  const supabase = getSupabaseAdmin();
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

export async function ensureDailyOutreachActions(actionDate?: string, target = 3) {
  const supabase = getSupabaseAdmin();
  const date = actionDate ?? new Date().toISOString().slice(0, 10);
  const weekday = new Date(`${date}T00:00:00`).getDay();
  if (weekday === 0 || weekday === 6) {
    return listDailyActions(date);
  }

  const { data: existing, error: existingError } = await supabase
    .from("daily_actions")
    .select("id, prospect_id")
    .eq("action_date", date);
  if (existingError) throw new Error(existingError.message);

  const existingRows = existing ?? [];
  const missing = Math.max(0, target - existingRows.length);
  if (missing > 0) {
    const existingProspectIds = existingRows
      .map((row) => row.prospect_id)
      .filter((id): id is string => Boolean(id));

    const { data: prospects, error: prospectsError } = await supabase
      .from("prospects")
      .select("id, name, stage, notes")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (prospectsError) throw new Error(prospectsError.message);

    const candidates = (prospects ?? []).filter((prospect) => !existingProspectIds.includes(prospect.id));
    const inserts = candidates.slice(0, missing).map((prospect, index) => {
      const isFollowUp = prospect.stage === "contacted" || prospect.stage === "replied";
      return {
        action_date: date,
        prospect_id: prospect.id,
        action_type: isFollowUp ? "follow_up_message" : "first_message",
        priority: index === 0 ? "high" : "medium",
        reason: prospect.notes ?? "Daily target queue.",
      };
    });

    if (inserts.length > 0) {
      const { error: insertError } = await supabase.from("daily_actions").insert(inserts);
      if (insertError) throw new Error(insertError.message);
    }
  }

  return listDailyActions(date);
}

export async function markDailyActionComplete(id: string) {
  const supabase = getSupabaseAdmin();
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
  const supabase = getSupabaseAdmin();
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
  const supabase = getSupabaseAdmin();
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
  const supabase = getSupabaseAdmin();
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
  const supabase = getSupabaseAdmin();
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
