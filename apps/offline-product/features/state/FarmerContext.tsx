/**
 * FarmerContext - Separated state management for farmer profile
 *
 * This context handles all farmer profile-related state and operations, separated from
 * plots state to reduce unnecessary re-renders and improve performance.
 *
 * Migration: Use both FarmerContext and PlotsContext instead of AppStateContext.
 */

import { createContext, ReactNode, useContext, useState, useCallback } from 'react';
import {
  persistFarmer,
  logAuditEvent,
  saveFarmerProfilePhotoUri,
} from './persistence';
import { logError } from '../errors/ErrorLogger';

export type Role = 'farmer';

export type FarmerProfile = {
  id: string;
  name?: string;
  /** Local file URI for profile photo (settings-backed, not sent to backend by default). */
  profilePhotoUri?: string | null;
  role: Role;
  selfDeclared: boolean;
  selfDeclaredAt?: number;
  fpicConsent?: boolean;
  laborNoChildLabor?: boolean;
  laborNoForcedLabor?: boolean;
  /** One-time simplified declaration: postal or mailing address (EUDR micro/small operator path). */
  postalAddress?: string;
  /** Primary commodity for this producer (HS-style codes later; values: coffee, cocoa, rubber, soy, timber). */
  commodityCode?: string;
  /**
   * Optional WGS84 point for micro/small simplified declaration path (postal OR basic geolocation).
   * Six-decimal precision when captured from the device.
   */
  declarationLatitude?: number;
  declarationLongitude?: number;
  declarationGeoCapturedAt?: number;
};

type FarmerContextValue = {
  farmer: FarmerProfile | undefined;
  setFarmer: (farmer: FarmerProfile) => void;
  updateFarmer: (patch: Partial<FarmerProfile>) => void;
  updateFarmerProfilePhoto: (uri: string | null) => void;
};

const FarmerContext = createContext<FarmerContextValue | undefined>(undefined);

export function FarmerProvider({ children }: { children: ReactNode }) {
  const [farmer, setFarmerState] = useState<FarmerProfile | undefined>(undefined);

  const setFarmer = useCallback((nextFarmer: FarmerProfile) => {
    setFarmerState((prev) => {
      const merged: FarmerProfile = {
        ...nextFarmer,
        profilePhotoUri: nextFarmer.profilePhotoUri ?? prev?.profilePhotoUri,
      };

      persistFarmer(merged).catch((err) => {
        logError(err, { context: 'set_farmer', action: 'persist' });
      });

      logAuditEvent({
        userId: nextFarmer.id,
        eventType: 'farmer_set',
        payload: {
          role: nextFarmer.role,
          selfDeclared: nextFarmer.selfDeclared,
          selfDeclaredAt: nextFarmer.selfDeclaredAt ?? null,
          fpicConsent: nextFarmer.fpicConsent ?? null,
          laborNoChildLabor: nextFarmer.laborNoChildLabor ?? null,
          laborNoForcedLabor: nextFarmer.laborNoForcedLabor ?? null,
          postalAddress: nextFarmer.postalAddress ?? null,
          commodityCode: nextFarmer.commodityCode ?? null,
          declarationLatitude: nextFarmer.declarationLatitude ?? null,
          declarationLongitude: nextFarmer.declarationLongitude ?? null,
          declarationGeoCapturedAt: nextFarmer.declarationGeoCapturedAt ?? null,
        },
      }).catch((err) => {
        logError(err, { context: 'set_farmer', action: 'audit_log' });
      });

      return merged;
    });
  }, []);

  const updateFarmer = useCallback((patch: Partial<FarmerProfile>) => {
    setFarmerState((prev) => {
      if (!prev) return prev;

      const next: FarmerProfile = { ...prev, ...patch };

      persistFarmer(next).catch((err) => {
        logError(err, { context: 'update_farmer', action: 'persist' });
      });

      logAuditEvent({
        userId: prev.id,
        eventType: 'farmer_updated',
        payload: patch,
      }).catch((err) => {
        logError(err, { context: 'update_farmer', action: 'audit_log' });
      });

      return next;
    });
  }, []);

  const updateFarmerProfilePhoto = useCallback((uri: string | null) => {
    setFarmerState((prev) => {
      if (!prev) return prev;

      const next = { ...prev, profilePhotoUri: uri ?? undefined };

      saveFarmerProfilePhotoUri(uri).catch((err) => {
        logError(err, { context: 'update_farmer_photo', action: 'persist' });
      });

      return next;
    });
  }, []);

  return (
    <FarmerContext.Provider
      value={{
        farmer,
        setFarmer,
        updateFarmer,
        updateFarmerProfilePhoto,
      }}
    >
      {children}
    </FarmerContext.Provider>
  );
}

export function useFarmer() {
  const ctx = useContext(FarmerContext);
  if (!ctx) {
    throw new Error('useFarmer must be used within FarmerProvider');
  }
  return ctx;
}
