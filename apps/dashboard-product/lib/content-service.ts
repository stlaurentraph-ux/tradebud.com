import { getSupabaseAdmin } from "@/lib/supabase-admin";

function weekStartIso(baseDate: Date) {
  const result = new Date(baseDate);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result.toISOString().slice(0, 10);
}

export async function listContentCalendar(limit = 120) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("content_calendar")
    .select("*, content_ideas(id, title)")
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createContentCalendarItem(input: {
  channel: string;
  pillar?: string | null;
  hook?: string | null;
  scheduled_at?: string | null;
  status?: string;
  review_status?: string;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("content_calendar")
    .insert({
      channel: input.channel,
      pillar: input.pillar ?? null,
      hook: input.hook ?? null,
      scheduled_at: input.scheduled_at ?? null,
      status: input.status ?? "draft",
      review_status: input.review_status ?? "draft",
      owner: "raph",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listContentTasks(limit = 200) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("content_tasks")
    .select("*, content_calendar(id, channel, pillar, scheduled_at)")
    .order("status", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateContentTaskStatus(id: string, status: "open" | "in_progress" | "done" | "missed") {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("content_tasks")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createContentTask(input: {
  task_type: string;
  due_date?: string | null;
  notes?: string | null;
  status?: "open" | "in_progress" | "done" | "missed";
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("content_tasks")
    .insert({
      task_type: input.task_type,
      due_date: input.due_date ?? null,
      notes: input.notes ?? null,
      status: input.status ?? "open",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function ensureWeeklyPostPlan(referenceDate?: string, targetPosts = 2) {
  const supabase = getSupabaseAdmin();
  const base = referenceDate ? new Date(`${referenceDate}T00:00:00`) : new Date();
  const weekStart = weekStartIso(base);
  const weekEndDate = new Date(`${weekStart}T00:00:00`);
  weekEndDate.setDate(weekEndDate.getDate() + 7);
  const weekEnd = weekEndDate.toISOString().slice(0, 10);

  const { data: existing, error: existingError } = await supabase
    .from("content_calendar")
    .select("id")
    .eq("channel", "linkedin_post")
    .gte("scheduled_at", `${weekStart}T00:00:00.000Z`)
    .lt("scheduled_at", `${weekEnd}T00:00:00.000Z`);
  if (existingError) throw new Error(existingError.message);

  const missing = Math.max(0, targetPosts - (existing?.length ?? 0));
  if (missing > 0) {
    const monday = new Date(`${weekStart}T09:00:00`);
    const defaultOffsets = [1, 3];
    const inserts = Array.from({ length: missing }).map((_, idx) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + (defaultOffsets[idx] ?? idx + 1));
      return {
        channel: "linkedin_post",
        pillar: "founder_updates",
        hook: `Weekly post ${idx + 1}`,
        scheduled_at: date.toISOString(),
        status: "draft",
        review_status: "draft",
        owner: "raph",
      };
    });

    const { error: insertError } = await supabase.from("content_calendar").insert(inserts);
    if (insertError) throw new Error(insertError.message);
  }

  return listContentCalendar();
}
