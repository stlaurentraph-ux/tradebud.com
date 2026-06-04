import type { LaunchService } from '../launch/launch.service';

export function createLaunchServiceMock(): LaunchService {
  return {
    requireFeatureAccess: jest.fn().mockResolvedValue(undefined),
  } as unknown as LaunchService;
}
