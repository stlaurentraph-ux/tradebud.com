/**
 * Pure decision for whether GPS capture can start.
 *
 * On Android the foreground location permission can be *granted* while the device's Location master
 * switch is *off*. In that state `watchPositionAsync` never emits and — unlike iOS — the OS shows no
 * "Turn on Location Services" prompt, so the walk screen would hang on a blank map with no fix and
 * no error. Checking `hasServicesEnabledAsync()` lets callers surface a clear, actionable message.
 */
export type LocationReadiness = 'ready' | 'permission_denied' | 'services_off';

export function evaluateLocationReadiness(input: {
  permissionGranted: boolean;
  servicesEnabled: boolean;
}): LocationReadiness {
  if (!input.permissionGranted) return 'permission_denied';
  if (!input.servicesEnabled) return 'services_off';
  return 'ready';
}
