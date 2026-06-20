type TranslateFn = (key: string) => string;

function wf(key: string, fallback: string, t?: TranslateFn, vars?: Record<string, string | number>): string {
  let text = fallback;
  if (t) {
    const resolved = t(key);
    text = resolved === key ? fallback : resolved;
  }
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
    }
  }
  return text;
}

const PLOT_TENURE_PANEL_COPY = {
  title: {
    key: 'workflow.plot_tenure.panel.title',
    fallback: 'Land tenure path',
  },
  loading: {
    key: 'workflow.plot_tenure.panel.loading',
    fallback: 'Loading tenure status…',
  },
  cadastral_key_label: {
    key: 'workflow.plot_tenure.panel.cadastral_key_label',
    fallback: 'Cadastral key',
  },
  cadastral_key_hint: {
    key: 'workflow.plot_tenure.panel.cadastral_key_hint',
    fallback:
      'Ask the farmer to enter Clave Catastral and sync land title photos from the field app for formal cadastral cross-check.',
  },
  possession_note_label: {
    key: 'workflow.plot_tenure.panel.possession_note_label',
    fallback: 'Possession note',
  },
  files_synced: {
    key: 'workflow.plot_tenure.panel.files_synced',
    fallback: '{count} tenure file synced',
  },
  files_synced_plural: {
    key: 'workflow.plot_tenure.panel.files_synced_plural',
    fallback: '{count} tenure files synced',
  },
  no_files: {
    key: 'workflow.plot_tenure.panel.no_files',
    fallback: 'No tenure files synced for this plot yet.',
  },
  legal_synced_at: {
    key: 'workflow.plot_tenure.panel.legal_synced_at',
    fallback: 'Legal metadata last synced {date}',
  },
  informal_after_backup: {
    key: 'workflow.plot_tenure.panel.informal_after_backup',
    fallback: 'Informal tenure and cadastral metadata appear after the farmer backs up from the field app.',
  },
  ai_in_progress: {
    key: 'workflow.plot_tenure.panel.ai_in_progress',
    fallback: 'AI review in progress — status refreshes automatically.',
  },
  ai_review_title: {
    key: 'workflow.plot_tenure.panel.ai_review_title',
    fallback: 'AI tenure review',
  },
  missing_prefix: {
    key: 'workflow.plot_tenure.panel.missing_prefix',
    fallback: 'Missing:',
  },
  extracted_prefix: {
    key: 'workflow.plot_tenure.panel.extracted_prefix',
    fallback: '· Extracted:',
  },
  ai_starts_after_sync: {
    key: 'workflow.plot_tenure.panel.ai_starts_after_sync',
    fallback: 'AI review starts automatically after tenure files sync. Use refresh if a file was just uploaded.',
  },
  view_evidence_link: {
    key: 'workflow.plot_tenure.panel.view_evidence_link',
    fallback: 'View uploaded evidence below',
  },
  open_queue_link: {
    key: 'workflow.plot_tenure.panel.open_queue_link',
    fallback: 'Open full tenure queue',
  },
  dialog_description: {
    key: 'workflow.plot_tenure.panel.dialog.description',
    fallback:
      'Record why this AI extraction is acceptable for compliance. This clears the manual review gate for the farmer checklist.',
  },
  dialog_reason_required_label: {
    key: 'workflow.plot_tenure.panel.dialog.reason_required_label',
    fallback: 'Reason (required)',
  },
  dialog_reason_placeholder: {
    key: 'workflow.plot_tenure.panel.dialog.reason_placeholder',
    fallback: 'e.g. Municipal attestation matches field visit notes…',
  },
  dialog_confirming: {
    key: 'workflow.plot_tenure.panel.dialog.confirming',
    fallback: 'Confirming…',
  },
  cadastral_verified: {
    key: 'workflow.plot_tenure.panel.cadastral.verified',
    fallback: 'Cadastral key verified',
  },
  cadastral_mismatch: {
    key: 'workflow.plot_tenure.panel.cadastral.mismatch',
    fallback: 'Cadastral key mismatch',
  },
  cadastral_enter_clave: {
    key: 'workflow.plot_tenure.panel.cadastral.enter_clave',
    fallback: 'Enter Clave Catastral to cross-check',
  },
  cadastral_formal_review: {
    key: 'workflow.plot_tenure.panel.cadastral.formal_review',
    fallback: 'Formal title needs review',
  },
  cadastral_enter_country: {
    key: 'workflow.plot_tenure.panel.cadastral.enter_country',
    fallback: 'Enter {country} to cross-check',
  },
  jurisdiction_country_mismatch: {
    key: 'workflow.plot_tenure.panel.jurisdiction.country_mismatch',
    fallback: 'Document country ({document}) does not match plot country ({plot})',
  },
  jurisdiction_issuer_hint: {
    key: 'workflow.plot_tenure.panel.jurisdiction.issuer_hint',
    fallback: 'Issuer jurisdiction hint: document suggests {documentCountry}',
  },
  jurisdiction_admin_hint: {
    key: 'workflow.plot_tenure.panel.jurisdiction.admin_hint',
    fallback: 'Admin region on document ({regions}) — compare with field plot on map',
  },
  jurisdiction_exporter_heading: {
    key: 'workflow.plot_tenure.panel.jurisdiction.exporter_heading',
    fallback: 'Compliance hints (staff only)',
  },
} as const;

export function getPlotTenurePanelCopy(
  key: keyof typeof PLOT_TENURE_PANEL_COPY,
  t?: TranslateFn,
  vars?: Record<string, string | number>,
): string {
  const entry = PLOT_TENURE_PANEL_COPY[key];
  return wf(entry.key, entry.fallback, t, vars);
}

export function getPlotTenurePanelFilesSyncedLabel(count: number, t?: TranslateFn): string {
  if (count === 1) {
    return getPlotTenurePanelCopy('files_synced', t, { count });
  }
  return getPlotTenurePanelCopy('files_synced_plural', t, { count });
}

export function getPlotTenurePanelCadastralCrossCheckLabel(
  crossCheck: Record<string, unknown> | null | undefined,
  t?: TranslateFn,
): string | null {
  if (!crossCheck || typeof crossCheck !== 'object') return null;
  if (crossCheck.keys_match === true) return getPlotTenurePanelCopy('cadastral_verified', t);
  if (crossCheck.keys_match === false) return getPlotTenurePanelCopy('cadastral_mismatch', t);
  if (Array.isArray(crossCheck.issues) && crossCheck.issues.includes('declared_cadastral_key_missing')) {
    return getPlotTenurePanelCopy('cadastral_enter_clave', t);
  }
  if (crossCheck.requires_manual_review === true) {
    return getPlotTenurePanelCopy('cadastral_formal_review', t);
  }
  if (typeof crossCheck.country_label === 'string' && crossCheck.country_label.length > 0) {
    if (crossCheck.keys_match === null && crossCheck.extracted_parcel_reference) {
      return getPlotTenurePanelCopy('cadastral_enter_country', t, { country: crossCheck.country_label });
    }
  }
  return null;
}

export function getPlotTenurePanelJurisdictionHints(
  parseResult: Record<string, unknown> | null | undefined,
  t?: TranslateFn,
): string[] {
  const jurisdiction = parseResult?.jurisdiction_cross_check;
  if (!jurisdiction || typeof jurisdiction !== 'object') return [];

  const row = jurisdiction as {
    plot_country_iso?: string | null;
    document_country_iso?: string | null;
    document_country_match?: boolean | null;
    issuer_inferred_country_iso?: string | null;
    exporter_hints?: unknown;
    document_admin_regions?: unknown;
  };

  const hints: string[] = [];
  if (row.document_country_match === false) {
    hints.push(
      getPlotTenurePanelCopy('jurisdiction_country_mismatch', t, {
        document: row.document_country_iso ?? '?',
        plot: row.plot_country_iso ?? '?',
      }),
    );
  } else if (
    row.issuer_inferred_country_iso &&
    row.plot_country_iso &&
    row.issuer_inferred_country_iso !== row.plot_country_iso
  ) {
    hints.push(
      getPlotTenurePanelCopy('jurisdiction_issuer_hint', t, {
        documentCountry: row.issuer_inferred_country_iso,
      }),
    );
  }

  const exporterHints = Array.isArray(row.exporter_hints) ? row.exporter_hints : [];
  for (const raw of exporterHints) {
    const hint = typeof raw === 'string' ? raw.trim() : '';
    if (!hint) continue;
    if (hint.startsWith('document_admin_regions:') || hint.startsWith('admin_region_hint:')) {
      hints.push(
        getPlotTenurePanelCopy('jurisdiction_admin_hint', t, {
          regions: hint.split(':', 1)[1] ?? hint,
        }),
      );
    }
  }

  const adminRegions = Array.isArray(row.document_admin_regions)
    ? row.document_admin_regions.filter((v): v is string => typeof v === 'string')
    : [];
  if (
    adminRegions.length > 0 &&
    !hints.some((line) => line.includes('Admin region'))
  ) {
    hints.push(
      getPlotTenurePanelCopy('jurisdiction_admin_hint', t, {
        regions: adminRegions.join(', '),
      }),
    );
  }

  return hints;
}

export function getPlotTenurePanelCopyManifest(): Record<string, string> {
  return Object.fromEntries(Object.values(PLOT_TENURE_PANEL_COPY).map((entry) => [entry.key, entry.fallback]));
}
