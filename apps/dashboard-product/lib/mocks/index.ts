/**
 * Consolidated Mock Data Module
 * 
 * This module provides centralized mock data for UI development and testing.
 * In production, replace these with actual API calls.
 * 
 * Usage:
 *   import { mockFarmers, mockPackages, getMockDashboardMetrics } from '@/lib/mocks';
 */

// Re-export all domain-specific mocks
export * from './farmers';
export * from './packages';
export * from './plots';
export * from './activities';
export * from './compliance';
export * from './dashboard-metrics';
export * from './sponsor';
export * from './integrations';
