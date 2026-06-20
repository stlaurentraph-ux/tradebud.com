// Founder OS / CRM (dashboard-internal)
export interface ContentCalendarItem {
  id: string;
  channel: string;
  pillar?: string | null;
  format?: string | null;
  hook?: string | null;
  scheduled_at?: string | null;
  status?: string;
  review_status?: string;
  owner?: string;
  content_ideas?: { id: string; title: string } | null;
}

export interface ContentTask {
  id: string;
  task_type: string;
  due_date?: string | null;
  notes?: string | null;
  status: 'open' | 'in_progress' | 'done' | 'missed';
  content_calendar_id?: string | null;
  content_calendar?: {
    id: string;
    channel?: string | null;
    pillar?: string | null;
    scheduled_at?: string | null;
  } | null;
}

export interface Prospect {
  id: string;
  name: string;
  company?: string | null;
  stage?: string | null;
  priority?: string | null;
  email?: string | null;
  source?: string | null;
  notes?: string | null;
  icp_score?: number | null;
  country?: string | null;
  segment?: string | null;
  commodity_focus?: string | null;
  market_registry?: MarketRegistry | null;
}

export interface MarketRegistry {
  id: string;
  country_code: string;
  country_name: string;
  commodity: string;
  segment: string;
  priority_tier: string;
  entry_wedge?: string | null;
  regulatory_notes?: string | null;
}

export interface Pilot {
  id: string;
  name: string;
  status: string;
  country?: string | null;
  commodity?: string | null;
  notes?: string | null;
  prospects?: { id: string; name: string; company?: string | null } | null;
}

export interface Partnership {
  id: string;
  organization_name: string;
  partner_type: string;
  status: string;
  country?: string | null;
  notes?: string | null;
}

export interface ObjectionLog {
  id: string;
  category: string;
  objection_text: string;
  response_text?: string | null;
  prospects?: { id: string; name: string; company?: string | null } | null;
}

export interface PenetrationMetric {
  metric_key: string;
  metric_value: number;
  metric_label: string;
}

export interface OutreachTemplate {
  id: string;
  name: string;
  channel?: string | null;
  body?: string | null;
  content?: string | null;
  stage?: string | null;
}

export interface OutreachActivity {
  id: string;
  prospect_id?: string | null;
  template_id?: string | null;
  status?: string | null;
  scheduled_at?: string | null;
  created_at?: string | null;
  content?: string | null;
  activity_type?: string | null;
  channel?: string | null;
}

export interface DailyAction {
  id: string;
  title?: string;
  action_type?: string;
  action_date?: string;
  due_date?: string | null;
  status?: string | null;
  priority?: string | null;
  reason?: string | null;
  completed?: boolean;
  prospects?: { name?: string; company?: string | null } | null;
}
