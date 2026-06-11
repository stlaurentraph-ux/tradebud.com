export type TenureParseStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'MANUAL_REQUIRED';

export type TenureType =
  | 'FORMAL'
  | 'CUSTOMARY'
  | 'LEASEHOLD'
  | 'POSSESSION_DECLARATION'
  | 'UNKNOWN';

export type CadastralCrossCheck = {
  declared_cadastral_key: string | null;
  extracted_parcel_reference: string | null;
  normalized_declared: string | null;
  normalized_extracted: string | null;
  keys_match: boolean | null;
  holder_name_match: boolean | null;
  informal_tenure_conflict: boolean;
  issues: string[];
  requires_manual_review: boolean;
  country_pack?: string | null;
  country_label?: string | null;
};

export type TenureDocumentSource = 'tenure_evidence' | 'land_title';

export type TenureParseResultV1 = {
  tenure_type: TenureType;
  holder_name: string | null;
  community_or_issuer: string | null;
  parcel_reference: string | null;
  /** Formal title number / Clave Catastral when distinct from parcel_reference. */
  title_number?: string | null;
  issue_date: string | null;
  country_iso: string | null;
  document_source?: TenureDocumentSource | null;
  cadastral_cross_check?: CadastralCrossCheck | null;
  clauses_found: string[];
  clauses_missing: string[];
  anti_fraud: {
    metadata_timestamp_plausible: boolean;
    issuer_name_match: boolean;
    document_age_within_policy: boolean;
  };
  confidence_breakdown: {
    ocr_quality: number;
    field_completeness: number;
  };
  summary: string | null;
  parser: 'llm' | 'manual_required_stub';
};

export type PlotTenureVerificationRow = {
  id: string;
  plot_id: string;
  storage_path: string;
  mime_type: string | null;
  evidence_label: string | null;
  parse_status: TenureParseStatus;
  parse_result: TenureParseResultV1 | Record<string, unknown> | null;
  parse_confidence: number | null;
  parse_reviewed_by: string | null;
  parse_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};
