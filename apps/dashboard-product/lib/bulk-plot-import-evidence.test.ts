import { strToU8, zipSync } from 'fflate';
import {
  buildEvidenceImportItemsFromZip,
  mapDocumentTypeToEvidenceKind,
  matchEvidenceReferencesToZipFiles,
} from '@/lib/bulk-plot-import-evidence';
import type { TracebudImportV1EvidenceReference } from '@/lib/bulk-plot-import-package';

const references: TracebudImportV1EvidenceReference[] = [
  {
    document_ref: 'DOC-001',
    client_plot_id: 'PLOT-001',
    document_type: 'land_title',
  },
];

function buildSampleZip(): Uint8Array {
  return zipSync({
    'DOC-001.pdf': strToU8('sample land title pdf'),
  });
}

describe('bulk plot import evidence', () => {
  it('maps document types to evidence kinds', () => {
    expect(mapDocumentTypeToEvidenceKind('land_title')).toBe('tenure_evidence');
    expect(mapDocumentTypeToEvidenceKind('fpic')).toBe('fpic_repository');
  });

  it('matches zip entries to evidence references by document_ref', async () => {
    const zipBytes = buildSampleZip();
    const { matched, missing } = await matchEvidenceReferencesToZipFiles({
      references,
      zipBytes,
    });
    expect(matched).toHaveLength(1);
    expect(missing).toHaveLength(0);
    expect(matched[0]?.fileName).toBe('DOC-001.pdf');
  });

  it('builds backend import items from zip matches', async () => {
    const zipBytes = buildSampleZip();
    const result = await buildEvidenceImportItemsFromZip({ references, zipBytes });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.clientPlotId).toBe('PLOT-001');
    expect(result.items[0]?.evidenceKind).toBe('tenure_evidence');
    expect(result.missingDocumentRefs).toHaveLength(0);
  });
});
