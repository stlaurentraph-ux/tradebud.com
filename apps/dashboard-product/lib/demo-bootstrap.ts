import { resetAdminData, seedFirstCustomerTenants } from '@/lib/admin-service';
import {
  resetPackageData,
  seedFirstCustomerPackages,
  seedGoldenPathScenarioPackages,
} from '@/lib/package-service';
import {
  resetRequestData,
  seedFirstCustomerRequests,
  seedGoldenPathRequests,
} from '@/lib/request-service';

async function syncRequestBootstrap(
  action: 'reset' | 'seed_first_customer' | 'seed_golden_path'
): Promise<void> {
  try {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
    const response = await fetch('/api/inbox-requests/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      throw new Error('Bootstrap API unavailable.');
    }
  } catch {
    // Local state remains the source of truth if API sync is unavailable.
  }
}

export async function resetDemoWorkspace(): Promise<void> {
  resetAdminData();
  resetPackageData();
  resetRequestData();
  await syncRequestBootstrap('reset');
}

export async function seedFirstCustomerWorkspace(): Promise<void> {
  seedFirstCustomerTenants();
  seedFirstCustomerPackages();
  seedFirstCustomerRequests();
  await syncRequestBootstrap('seed_first_customer');
}

export async function seedGoldenPathWorkspace(): Promise<void> {
  seedFirstCustomerTenants();
  seedGoldenPathScenarioPackages();
  seedGoldenPathRequests();
  await syncRequestBootstrap('seed_golden_path');
}

