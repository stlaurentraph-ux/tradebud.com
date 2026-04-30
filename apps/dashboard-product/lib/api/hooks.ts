'use client';

import useSWR from 'swr';

/**
 * API Hooks Foundation
 * 
 * This file provides a collection of SWR hooks for fetching dashboard metrics,
 * onboarding state, trial status, and other dashboard-related data.
 * 
 * Usage:
 * - Replace mock data in dashboard components with these hooks
 * - All hooks return { data, error, isLoading } from SWR
 * - Add proper error boundaries in components using these hooks
 */

// Type definitions
export interface DashboardMetrics {
  total_plots: number;
  compliant_plots: number;
  total_farmers: number;
  total_packages: number;
  packages_by_status?: Record<string, number>;
}

export interface OnboardingData {
  current_step: string;
  completed_steps: string[];
  is_complete: boolean;
}

export interface TrialStatus {
  status: 'ACTIVE' | 'PAUSED' | 'ENDED';
  days_remaining: number;
  has_compliance_data: boolean;
}

// Default fetcher - replace with your API endpoint
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const fetcher = async (url: string) => {
  const res = await fetch(`${API_BASE_URL}${url}`);
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
};

/**
 * Fetch dashboard metrics for the current user's role
 * @param role - User role (EXPORTER, IMPORTER, COOPERATIVE, REVIEWER, SPONSOR)
 */
export function useDashboardMetrics(role?: string) {
  const { data, error, isLoading } = useSWR<DashboardMetrics>(
    role ? `/metrics?role=${role}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    metrics: data,
    error,
    isLoading,
  };
}

/**
 * Fetch onboarding progress for the current user
 */
export function useOnboardingProgress() {
  const { data, error, isLoading } = useSWR<OnboardingData>(
    '/onboarding/progress',
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    onboarding: data,
    error,
    isLoading,
  };
}

/**
 * Fetch trial status for the current tenant
 */
export function useTrialStatus() {
  const { data, error, isLoading } = useSWR<TrialStatus>(
    '/trial/status',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  return {
    trial: data,
    error,
    isLoading,
  };
}

/**
 * Hook to update onboarding step
 * Returns a mutate function to call with new step
 */
export function useUpdateOnboarding() {
  const { mutate } = useSWR<OnboardingData>(
    '/onboarding/progress',
    fetcher
  );

  const updateStep = async (step: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_step: step }),
      });
      
      if (!response.ok) throw new Error('Failed to update onboarding');
      
      const data = await response.json();
      mutate(data, false);
      return data;
    } catch (error) {
      console.error('[v0] Error updating onboarding:', error);
      throw error;
    }
  };

  return { updateStep };
}

/**
 * Generic hook for fetching any API endpoint
 * Use this for custom endpoints not covered above
 */
export function useApiData<T>(endpoint: string | null, options = {}) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    endpoint,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}
