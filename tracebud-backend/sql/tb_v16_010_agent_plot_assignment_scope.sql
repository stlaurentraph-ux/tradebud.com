-- TB-V16-010: canonical assignment scope relation for mobile sync authorization.
-- Establishes agent-to-plot assignment records used by sync scope checks.

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
