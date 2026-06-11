-- TB-V16-034: plot tenure verification parse results (Phase 1 producer-in-possession)

CREATE TABLE IF NOT EXISTS plot_tenure_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NULL,
  evidence_label TEXT NULL,
  parse_status TEXT NOT NULL CHECK (
    parse_status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'MANUAL_REQUIRED')
  ) DEFAULT 'PENDING',
  parse_result JSONB NULL,
  parse_confidence NUMERIC(3, 2) NULL,
  parse_reviewed_by UUID NULL,
  parse_reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (plot_id, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_plot_tenure_verification_plot
  ON plot_tenure_verification (plot_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_plot_tenure_verification_pending
  ON plot_tenure_verification (parse_status, created_at ASC)
  WHERE parse_status = 'PENDING';
