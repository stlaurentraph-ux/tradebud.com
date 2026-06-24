import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { requestFarmerPhoneOtp } from '@/features/auth/phoneOtpSignIn';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import { createAuthSheetStyles } from '@/components/auth/authSheetStyles';

type PhoneOtpSignInPanelProps = {
  initialPhone?: string;
  busy: boolean;
  hint: string | null;
  t: (key: string, params?: Record<string, string | number>) => string;
  onHint: (message: string | null) => void;
  onBusy: (busy: boolean) => void;
  onVerified: (phone: string, code: string) => void | Promise<void>;
};

export function PhoneOtpSignInPanel({
  initialPhone = '',
  busy,
  hint,
  t,
  onHint,
  onBusy,
  onVerified,
}: PhoneOtpSignInPanelProps) {
  const authSheetStyles = useThemedStyles(createAuthSheetStyles);
  const [step, setStep] = useState<'phone' | 'code'>(initialPhone.trim() ? 'code' : 'phone');
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState('');

  const handleSendCode = async () => {
    onHint(null);
    onBusy(true);
    try {
      const result = await requestFarmerPhoneOtp(phone);
      if (!result.ok) {
        onHint(t('phone_otp_send_failed'));
        return;
      }
      setStep('code');
    } finally {
      onBusy(false);
    }
  };

  const handleVerify = async () => {
    onHint(null);
    onBusy(true);
    try {
      await onVerified(phone, code);
    } finally {
      onBusy(false);
    }
  };

  return (
    <View style={{ gap: Spacing.sm }}>
      {step === 'phone' ? (
        <>
          <ThemedText type="caption" style={authSheetStyles.subtitle}>
            {t('phone_otp_campaign_body')}
          </ThemedText>
          <Input
            label={t('label_phone')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
            placeholder="+233241234567"
            dense
          />
          {busy ? (
            <ActivityIndicator color={Brand.primary} style={{ marginVertical: Spacing.xs }} />
          ) : (
            <Button variant="primary" size="sm" fullWidth onPress={() => void handleSendCode()}>
              {t('phone_otp_send_code')}
            </Button>
          )}
        </>
      ) : (
        <>
          <ThemedText type="caption" style={authSheetStyles.subtitle}>
            {t('phone_otp_verify_body', { phone })}
          </ThemedText>
          <Input
            label={t('phone_otp_code_label')}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoCapitalize="none"
            placeholder="123456"
            dense
          />
          {busy ? (
            <ActivityIndicator color={Brand.primary} style={{ marginVertical: Spacing.xs }} />
          ) : (
            <Button variant="primary" size="sm" fullWidth onPress={() => void handleVerify()}>
              {t('phone_otp_verify')}
            </Button>
          )}
          <Pressable
            onPress={() => {
              setStep('phone');
              onHint(null);
            }}
            style={authSheetStyles.textLink}
          >
            <ThemedText type="defaultSemiBold" style={authSheetStyles.textLinkLabel}>
              {t('phone_otp_change_number')}
            </ThemedText>
          </Pressable>
        </>
      )}
      {hint ? (
        <ThemedText type="caption" style={authSheetStyles.hint}>
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}
