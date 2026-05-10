/**
 * Test utilities and mocks for API and sync testing.
 * Provides mock implementations and helpers for unit/integration tests.
 */

export interface MockApiResponse<T = any> {
  status: number;
  statusText: string;
  ok: boolean;
  json: () => Promise<T>;
  text: () => Promise<string>;
}

/**
 * Create a mock fetch response for testing.
 */
export function createMockResponse<T = any>(
  data: T,
  status: number = 200,
): MockApiResponse<T> {
  return {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    ok: status >= 200 && status < 300,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

/**
 * Create a mock fetch error response.
 */
export function createMockErrorResponse(
  message: string,
  status: number = 500,
): MockApiResponse {
  return {
    status,
    statusText: 'Error',
    ok: false,
    json: async () => ({ message }),
    text: async () => JSON.stringify({ message }),
  };
}

/**
 * Mock validation result generator.
 */
export function mockValidationSuccess<T>(value: T) {
  return { ok: true as const, value };
}

export function mockValidationError(error: string) {
  return { ok: false as const, error };
}

/**
 * Simulate network delay.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock farmer object for testing.
 */
export function createMockFarmer(overrides?: Partial<any>) {
  return {
    id: 'farmer-123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    location: 'Brazil',
    ...overrides,
  };
}

/**
 * Create a mock plot object for testing.
 */
export function createMockPlot(overrides?: Partial<any>) {
  return {
    id: 'plot-123',
    farmerId: 'farmer-123',
    name: 'Plot A',
    areaHectares: 2.5,
    kind: 'polygon' as const,
    points: [
      { latitude: -10.0, longitude: -50.0 },
      { latitude: -10.0, longitude: -49.9 },
      { latitude: -10.1, longitude: -49.9 },
    ],
    createdAt: new Date().toISOString(),
    synced: false,
    ...overrides,
  };
}

/**
 * Create a mock harvest record for testing.
 */
export function createMockHarvest(overrides?: Partial<any>) {
  return {
    id: 'harvest-123',
    plotId: 'plot-123',
    farmerId: 'farmer-123',
    kg: 100,
    harvestDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
