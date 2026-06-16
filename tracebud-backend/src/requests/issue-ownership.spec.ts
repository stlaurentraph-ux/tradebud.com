import { inferOwnerRoleForLinkedEntity, formatOwnerRoleLabel } from './issue-ownership';

describe('issue-ownership', () => {
  it('infers owner role from linked entity type', () => {
    expect(inferOwnerRoleForLinkedEntity('plot')).toBe('cooperative');
    expect(inferOwnerRoleForLinkedEntity('tenure_verification')).toBe('exporter');
  });

  it('formats owner role labels', () => {
    expect(formatOwnerRoleLabel('importer')).toBe('Importer');
  });
});
