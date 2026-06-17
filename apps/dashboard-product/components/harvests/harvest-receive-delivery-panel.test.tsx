// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HarvestReceiveDeliveryPanel } from './harvest-receive-delivery-panel';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { active_role: 'cooperative', tenant_id: 'tenant_1' } }),
}));

vi.mock('@/lib/locale-context', () => ({
  LocaleContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/lib/harvest-voucher-client', () => ({
  listTenantHarvestVouchers: vi.fn(),
  lookupTenantVoucherByQrRef: vi.fn(),
  findTenantVoucherByQrRef: vi.fn(),
}));

import { listTenantHarvestVouchers } from '@/lib/harvest-voucher-client';

const eligibleVoucher = {
  id: 'voucher_1',
  qr_code_ref: 'V-TEST1234',
  plot_id: 'plot_1',
  plot_name: 'Nyota Block A',
  farmer_name: 'Amina N.',
  farmer_id: 'farmer_1',
  kg: 420,
  eligible_for_package: true,
  package_id: null,
};

describe('HarvestReceiveDeliveryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    push.mockReset();
    vi.mocked(listTenantHarvestVouchers).mockResolvedValue([eligibleVoucher]);
  });

  it('stages an eligible voucher and navigates to package create', async () => {
    const user = userEvent.setup();
    render(<HarvestReceiveDeliveryPanel />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Browse pending vouchers/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Browse pending vouchers/i }));
    await user.click(screen.getByRole('button', { name: /^Add$/i }));

    expect(screen.getByText(/1 voucher\(s\) staged/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Assemble batch/i }));

    expect(push).toHaveBeenCalledWith('/packages/new?voucherIds=voucher_1');
  });
});
