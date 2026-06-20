-- ADR-006 Phase 0: formalize tables previously created at runtime or missing from prod.

BEGIN;

-- Agent plot assignment (TB-V16-010)
CREATE TABLE IF NOT EXISTS public.agent_plot_assignment (
  assignment_id TEXT PRIMARY KEY,
  agent_user_id UUID NOT NULL REFERENCES public.user_account(id),
  plot_id UUID NOT NULL REFERENCES public.plot(id),
  status TEXT NOT NULL DEFAULT 'active',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (status IN ('active', 'completed', 'cancelled'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_plot_assignment_active_unique
  ON public.agent_plot_assignment (agent_user_id, plot_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_agent_plot_assignment_plot_agent_status
  ON public.agent_plot_assignment (plot_id, agent_user_id, status);

COMMENT ON TABLE public.agent_plot_assignment IS
  'Agent-to-plot assignment scope for mobile sync authorization.';

-- Farmer push devices (TB-V16-042)
CREATE TABLE IF NOT EXISTS public.farmer_push_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  push_token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'unknown' CHECK (platform IN ('ios', 'android', 'web', 'unknown')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, push_token)
);

CREATE INDEX IF NOT EXISTS idx_farmer_push_devices_user
  ON public.farmer_push_devices (user_id, updated_at DESC);

COMMENT ON TABLE public.farmer_push_devices IS
  'Expo push tokens for producer consent and field-app alerts.';

-- Inbox workflow (previously inbox.service.ts runtime DDL)
CREATE TABLE IF NOT EXISTS public.inbox_requests (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  title TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (
    request_type IN ('MISSING_PLOT_GEOMETRY', 'GENERAL_EVIDENCE', 'CONSENT_GRANT')
  ),
  due_at TIMESTAMPTZ NOT NULL,
  from_org TEXT NOT NULL,
  sender_tenant_id TEXT NOT NULL,
  recipient_tenant_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'RESPONDED')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inbox_request_events (
  id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES public.inbox_requests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_tenant_id TEXT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inbox_requests_recipient_status_due
  ON public.inbox_requests (recipient_tenant_id, status, due_at);

CREATE INDEX IF NOT EXISTS idx_inbox_requests_campaign
  ON public.inbox_requests (campaign_id);

CREATE INDEX IF NOT EXISTS idx_inbox_request_events_request_id
  ON public.inbox_request_events (request_id);

COMMENT ON TABLE public.inbox_requests IS
  'Dashboard inbox requests (campaign fan-out). Backend-primary; tenant-scoped RLS.';
COMMENT ON TABLE public.inbox_request_events IS
  'Inbox request lifecycle events.';

-- Chat threads (previously chat-threads.service.ts runtime DDL)
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  record_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'resolved', 'archived')),
  created_by TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  author_user_id TEXT NULL,
  author_role TEXT NOT NULL CHECK (
    author_role IN ('farmer', 'agent', 'exporter', 'admin', 'compliance_manager')
  ),
  body TEXT NOT NULL,
  idempotency_key TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_messages_tenant_idempotency
  ON public.chat_messages (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_threads_tenant_record_created
  ON public.chat_threads (tenant_id, record_id, created_at DESC);

COMMENT ON TABLE public.chat_threads IS
  'Compliance record chat threads (dashboard). Tenant-scoped RLS.';
COMMENT ON TABLE public.chat_messages IS
  'Messages within chat_threads.';

-- Supply chain roles column (TB-V16-045) if not yet applied
ALTER TABLE public.tenant_commercial_profiles
  ADD COLUMN IF NOT EXISTS supply_chain_roles TEXT[] NOT NULL DEFAULT '{}';

COMMIT;
