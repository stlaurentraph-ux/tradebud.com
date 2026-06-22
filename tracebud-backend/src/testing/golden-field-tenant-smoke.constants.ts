/**
 * Golden field-app tenant isolation smoke fixtures (slice 4.O.2).
 * UUIDs and passwords live in GitHub secrets / local .env only — never commit values.
 */
export const GOLDEN_FIELD_TENANT_SMOKE = {
  slice: '4.O.2',
  apiUrlDefault: 'https://api.tracebud.com/api',
  farmerA: {
    label: 'Field tenant smoke probe A',
    role: 'farmer' as const,
    recommendedEmail: 'field+tenant-smoke-a@tracebud.com',
  },
  farmerB: {
    label: 'Field tenant smoke probe B',
    role: 'farmer' as const,
    recommendedEmail: 'field+tenant-smoke-b@tracebud.com',
  },
  probes: {
    foreignFarmerList: {
      method: 'GET' as const,
      path: '/v1/plots',
      query: { scope: 'farmer' },
      expectStatus: 403,
    },
    foreignPlotPatch: {
      method: 'PATCH' as const,
      pathPrefix: '/v1/plots/',
      expectStatusMin: 400,
      probeName: 'Tenant probe',
    },
  },
} as const;
