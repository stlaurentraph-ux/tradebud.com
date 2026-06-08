function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
  return body.error ?? body.message ?? fallback;
}

export type GeneratePackageResult = {
  packageId: string;
  status: string;
  artifactVersion?: string;
  lotCount?: number;
  generatedAt?: string;
};

export type SubmitPackageResult = {
  packageId: string;
  idempotencyKey: string;
  status: string;
  submissionState?: string;
  tracesReference?: string;
  replayed?: boolean;
  persistedAt?: string;
};

export async function generateHarvestPackage(packageId: string): Promise<GeneratePackageResult> {
  const response = await fetch(`/api/harvest/packages/${encodeURIComponent(packageId)}/generate`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to generate filing artifacts.'));
  }

  return (await response.json()) as GeneratePackageResult;
}

export async function submitHarvestPackage(
  packageId: string,
  idempotencyKey: string,
): Promise<SubmitPackageResult> {
  const response = await fetch(`/api/harvest/packages/${encodeURIComponent(packageId)}/submit`, {
    method: 'PATCH',
    cache: 'no-store',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idempotencyKey }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to submit package.'));
  }

  return (await response.json()) as SubmitPackageResult;
}
