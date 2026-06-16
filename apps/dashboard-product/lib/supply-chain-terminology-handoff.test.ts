import { describe, expect, it } from 'vitest';
import {
  getAssembleShipmentSubtitle,
  getPackageFilingWorkflowHint,
  getPackagePreflightBlockersTitle,
  getPackageSubmitActionLabel,
  getPackageSubmittedAwaitingMessage,
} from './supply-chain-terminology';

describe('supply-chain handoff vs TRACES terminology', () => {
  it('keeps exporter and cooperative on handoff language, not TRACES filing', () => {
    for (const role of ['exporter', 'cooperative'] as const) {
      expect(getPackageSubmitActionLabel(role).toLowerCase()).not.toContain('traces');
      expect(getPackageSubmitActionLabel(role)).toContain('handoff');
      expect(getPackageFilingWorkflowHint(role).toLowerCase()).not.toContain('traces');
      expect(getPackageFilingWorkflowHint(role).toLowerCase()).toContain('importer');
      expect(getAssembleShipmentSubtitle(role).toLowerCase()).not.toContain('traces');
      expect(getPackageSubmittedAwaitingMessage(role).toLowerCase()).toContain('importer');
    }
  });

  it('uses TRACES filing language for importer role', () => {
    expect(getPackageSubmitActionLabel('importer').toLowerCase()).toContain('traces');
    expect(getPackagePreflightBlockersTitle('importer').toLowerCase()).toContain('traces');
    expect(getPackageFilingWorkflowHint('importer').toLowerCase()).toContain('traces');
    expect(getAssembleShipmentSubtitle('importer').toLowerCase()).toContain('traces');
    expect(getPackageSubmittedAwaitingMessage('importer').toLowerCase()).toContain('traces');
  });
});
