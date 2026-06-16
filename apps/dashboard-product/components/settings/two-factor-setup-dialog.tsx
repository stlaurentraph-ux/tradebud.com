'use client';

import { useContext, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase-browser';
import { setAuthTokens } from '@/lib/auth-session';
import { LocaleContext } from '@/lib/locale-context';
import { getSettingsCopy } from '@/lib/workflow-terminology-labels';

interface TwoFactorSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnabled: () => void;
}

export function TwoFactorSetupDialog({ open, onOpenChange, onEnabled }: TwoFactorSetupDialogProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!open) {
      setFactorId(null);
      setQrCode(null);
      setSecret(null);
      setVerifyCode('');
      setError(null);
      return;
    }

    let cancelled = false;
    const startEnrollment = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const supabase = await getAuthenticatedSupabaseClient();
        const { data, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'Tracebud Dashboard',
        });
        if (enrollError) throw enrollError;
        if (cancelled || !data) return;
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
      } catch (enrollError) {
        if (!cancelled) {
          setError(
            enrollError instanceof Error ? enrollError.message : getSettingsCopy('twofa_error_start', t),
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void startEnrollment();
    return () => {
      cancelled = true;
    };
  }, [open, t]);

  const handleVerify = async () => {
    if (!factorId || verifyCode.trim().length < 6) {
      setError(getSettingsCopy('twofa_error_code', t));
      return;
    }

    setIsVerifying(true);
    setError(null);
    try {
      const supabase = await getAuthenticatedSupabaseClient();
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode.trim(),
      });
      if (verify.error) throw verify.error;

      const session = verify.data;
      if (session?.access_token && session?.refresh_token) {
        setAuthTokens(session.access_token, session.refresh_token);
      }

      onEnabled();
      onOpenChange(false);
    } catch (verifyError) {
      setError(
        verifyError instanceof Error ? verifyError.message : getSettingsCopy('twofa_error_verify', t),
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getSettingsCopy('twofa_title', t)}</DialogTitle>
          <DialogDescription>{getSettingsCopy('twofa_description', t)}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{getSettingsCopy('twofa_loading', t)}</p>
        ) : null}

        {qrCode ? (
          <div className="space-y-4">
            <div className="flex justify-center rounded-lg border bg-white p-4">
              <Image
                src={qrCode}
                alt={getSettingsCopy('twofa_qr_alt', t)}
                width={180}
                height={180}
                unoptimized
              />
            </div>
            {secret ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {getSettingsCopy('twofa_manual_key', t)}{' '}
                <span className="font-mono text-foreground">{secret}</span>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="totp-code">{getSettingsCopy('twofa_code_label', t)}</Label>
              <Input
                id="totp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verifyCode}
                onChange={(event) => setVerifyCode(event.target.value)}
                placeholder="123456"
              />
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {getSettingsCopy('twofa_cancel', t)}
          </Button>
          <Button onClick={() => void handleVerify()} disabled={isVerifying || !factorId}>
            {isVerifying ? getSettingsCopy('twofa_verifying', t) : getSettingsCopy('twofa_verify_enable', t)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
