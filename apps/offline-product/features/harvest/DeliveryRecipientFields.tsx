'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import {
  fetchMyConsentGrants,
  type ConsentGrant,
} from '@/features/api/consentGrants';
import type { TranslateFn } from '@/features/i18n/translate';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import { createDeliveryRecipientFieldsStyles } from '@/features/harvest/deliveryRecipientFieldsStyles';

export type DeliveryRecipientSelection =
  | { mode: 'buyer'; tenantId: string; label: string; email?: string | null }
  | { mode: 'email'; email: string }
  | { mode: 'qr_only' };

export interface DeliveryRecipientFieldsProps {
  t: TranslateFn;
  value: DeliveryRecipientSelection | null;
  onChange: (value: DeliveryRecipientSelection) => void;
}

export function DeliveryRecipientFields({ t, value, onChange }: DeliveryRecipientFieldsProps) {
  const styles = useThemedStyles(createDeliveryRecipientFieldsStyles);
  const [grants, setGrants] = useState<ConsentGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState(
    value?.mode === 'email' ? value.email : '',
  );

  useEffect(() => {
    let cancelled = false;
    void fetchMyConsentGrants().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setGrants(result.items.filter((grant) => grant.status === 'active'));
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeBuyers = useMemo(
    () =>
      grants.map((grant) => ({
        tenantId: grant.grantee_tenant_id,
        label: grant.grantee_org_name?.trim() || grant.grantee_tenant_id,
      })),
    [grants],
  );

  const selectedTenantId = value?.mode === 'buyer' ? value.tenantId : null;
  const isQrOnly = value?.mode === 'qr_only';
  const isEmailMode = value?.mode === 'email';

  return (
    <View style={styles.wrap}>
      <ThemedText type="caption" style={styles.sectionLabel}>
        {t('delivery_recipient_title')}
      </ThemedText>
      <ThemedText type="caption" style={styles.hint}>
        {t('delivery_recipient_hint')}
      </ThemedText>

      {loading ? (
        <ThemedText type="caption">{t('delivery_recipient_loading')}</ThemedText>
      ) : activeBuyers.length > 0 ? (
        <View style={styles.gapSm}>
          {activeBuyers.map((buyer) => {
            const selected = selectedTenantId === buyer.tenantId;
            return (
              <Pressable
                key={buyer.tenantId}
                onPress={() =>
                  onChange({ mode: 'buyer', tenantId: buyer.tenantId, label: buyer.label })
                }
              >
                <Card
                  variant="outlined"
                  style={[styles.optionCard, selected ? styles.optionCardSelected : null]}
                >
                  <View style={styles.optionRow}>
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selected ? '#0A7F59' : '#9CA3AF'}
                    />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="default">{buyer.label}</ThemedText>
                      <ThemedText type="caption" style={styles.optionHint}>
                        {t('delivery_recipient_buyer_option')}
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Card variant="outlined" style={styles.noBuyersCard}>
          <ThemedText type="defaultSemiBold">{t('delivery_recipient_no_buyers_title')}</ThemedText>
          <ThemedText type="caption" style={styles.hint}>
            {t('delivery_recipient_no_buyers_body')}
          </ThemedText>
        </Card>
      )}

      <View style={styles.gapSm}>
        <ThemedText type="caption" style={styles.sectionLabel}>
          {t('delivery_recipient_email_label')}
        </ThemedText>
        <TextInput
          value={emailInput}
          onChangeText={(text) => {
            setEmailInput(text);
            const trimmed = text.trim();
            if (trimmed) {
              onChange({ mode: 'email', email: trimmed });
            }
          }}
          placeholder={t('delivery_recipient_email_placeholder')}
          placeholderTextColor="#98A2A0"
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.emailInput, isEmailMode ? styles.emailInputActive : null]}
        />
      </View>

      <Pressable onPress={() => onChange({ mode: 'qr_only' })}>
        <Card variant="outlined" style={[styles.optionCard, isQrOnly ? styles.optionCardSelected : null]}>
          <View style={styles.optionRow}>
            <Ionicons
              name={isQrOnly ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={isQrOnly ? '#0A7F59' : '#9CA3AF'}
            />
            <View style={{ flex: 1 }}>
              <ThemedText type="default">{t('delivery_recipient_qr_only_title')}</ThemedText>
              <ThemedText type="caption" style={styles.optionHint}>
                {t('delivery_recipient_qr_only_body')}
              </ThemedText>
            </View>
          </View>
        </Card>
      </Pressable>
    </View>
  );
}

export function deliveryRecipientToApiPayload(
  selection: DeliveryRecipientSelection | null,
): { deliverToTenantId?: string; deliverToEmail?: string } {
  if (!selection || selection.mode === 'qr_only') {
    return {};
  }
  if (selection.mode === 'buyer') {
    return { deliverToTenantId: selection.tenantId };
  }
  return { deliverToEmail: selection.email };
}

export function isDeliveryRecipientComplete(selection: DeliveryRecipientSelection | null): boolean {
  if (!selection) return false;
  if (selection.mode === 'email') {
    return selection.email.trim().includes('@');
  }
  return true;
}

