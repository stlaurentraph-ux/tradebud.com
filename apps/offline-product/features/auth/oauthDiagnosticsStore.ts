export type OAuthDiagnosticEventKind =
  | 'attempt_started'
  | 'config_snapshot'
  | 'native_prompt_start'
  | 'native_prompt_result'
  | 'native_redirect_probe'
  | 'native_oauth_disabled'
  | 'oauth2redirect_received'
  | 'oauth2redirect_code_recovered'
  | 'browser_fallback'
  | 'browser_session_result'
  | 'deep_link_received'
  | 'sign_in_failed'
  | 'sign_up_failed'
  | 'session_completed';

export type OAuthDiagnosticEvent = {
  ts: number;
  kind: OAuthDiagnosticEventKind;
  detail: string;
};

const MAX_EVENTS = 40;
const events: OAuthDiagnosticEvent[] = [];
let listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeOAuthDiagnostics(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function recordOAuthDiagnosticEvent(
  kind: OAuthDiagnosticEventKind,
  detail: string,
): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  events.push({ ts: Date.now(), kind, detail });
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
  notify();
}

export function getOAuthDiagnosticEvents(): readonly OAuthDiagnosticEvent[] {
  return events;
}

export function clearOAuthDiagnosticEvents(): void {
  events.length = 0;
  notify();
}

export function formatOAuthDiagnosticReport(snapshotLines: string[]): string {
  const lines = [
    'Tracebud OAuth diagnostics (__DEV__)',
    `generated: ${new Date().toISOString()}`,
    '',
    '--- config ---',
    ...snapshotLines,
    '',
    '--- recent events ---',
  ];
  if (events.length === 0) {
    lines.push('(no events yet)');
  } else {
    for (const event of events) {
      lines.push(`${new Date(event.ts).toISOString()} ${event.kind}: ${event.detail}`);
    }
  }
  return lines.join('\n');
}
