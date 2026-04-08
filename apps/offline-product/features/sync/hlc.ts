const LOGICAL_WIDTH = 6;

export function generateHlcTimestamp(nowMs: number = Date.now(), lastHlc?: string | null): string {
  const parsedLast = parseHlcTimestamp(lastHlc);
  const physical = Math.max(nowMs, parsedLast?.physicalMs ?? 0);
  const logical =
    parsedLast && physical === parsedLast.physicalMs ? parsedLast.logical + 1 : 0;
  return `${physical}:${String(logical).padStart(LOGICAL_WIDTH, '0')}`;
}

export function parseHlcTimestamp(value: string | null | undefined): {
  physicalMs: number;
  logical: number;
} | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const m = /^(\d{10,16}):(\d{1,6})$/.exec(trimmed);
  if (!m) return null;
  const physicalMs = Number(m[1]);
  const logical = Number(m[2]);
  if (!Number.isFinite(physicalMs) || !Number.isFinite(logical)) return null;
  if (physicalMs < 0 || logical < 0) return null;
  return { physicalMs, logical };
}

export function compareHlcTimestamp(a: string | null | undefined, b: string | null | undefined): number {
  const pa = parseHlcTimestamp(a);
  const pb = parseHlcTimestamp(b);
  if (!pa && !pb) return 0;
  if (!pa) return 1;
  if (!pb) return -1;
  if (pa.physicalMs !== pb.physicalMs) return pa.physicalMs - pb.physicalMs;
  return pa.logical - pb.logical;
}
