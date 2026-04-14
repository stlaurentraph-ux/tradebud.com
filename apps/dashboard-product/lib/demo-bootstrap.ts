import { resetAdminData, seedFirstCustomerTenants } from '@/lib/admin-service';
import { resetPackageData, seedFirstCustomerPackages } from '@/lib/package-service';

export function resetDemoWorkspace(): void {
  resetAdminData();
  resetPackageData();
}

export function seedFirstCustomerWorkspace(): void {
  seedFirstCustomerTenants();
  seedFirstCustomerPackages();
}

