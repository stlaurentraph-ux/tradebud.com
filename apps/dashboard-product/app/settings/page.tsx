'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/layout/app-header';
import { TwoFactorSetupDialog } from '@/components/settings/two-factor-setup-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Building2,
  Bell,
  Shield,
  Key,
  Save,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { hasSupabaseSessionTokens, setAuthTokens } from '@/lib/auth-session';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase-browser';
import { NOTIFICATION_CAPABILITIES } from '@/lib/settings-capabilities';
import { useLocale } from '@/lib/locale-context';
import {
  getAvailableLocales,
  getLocaleLabel,
  isDashboardTimezone,
  isLocale,
  TIMEZONE_OPTIONS,
  type DashboardTimezone,
  type Locale,
} from '@/lib/i18n';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { locale, timezone, setLocale, setTimezone, t } = useLocale();
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'notifications' | 'security'>('profile');
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isTwoFactorDialogOpen, setIsTwoFactorDialogOpen] = useState(false);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [isLoadingSecurity, setIsLoadingSecurity] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [preferencesDraft, setPreferencesDraft] = useState<{ locale: Locale; timezone: DashboardTimezone }>({
    locale: 'en',
    timezone: 'UTC',
  });
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  useEffect(() => {
    setPreferencesDraft({ locale, timezone });
  }, [locale, timezone]);

  useEffect(() => {
    if (activeTab !== 'profile') return;
    setProfileForm({
      fullName: user?.name ?? '',
      phone: '',
    });
    setPreferencesDraft({ locale, timezone });

    if (!hasSupabaseSessionTokens()) {
      setProfileError(null);
      return;
    }

    let cancelled = false;
    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setProfileError(null);
      try {
        const supabase = await getAuthenticatedSupabaseClient();
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (cancelled || !data.user) return;
        const metadata = (data.user.user_metadata ?? {}) as Record<string, unknown>;
        const fullName =
          (typeof metadata.full_name === 'string' && metadata.full_name) ||
          (typeof metadata.fullName === 'string' && metadata.fullName) ||
          user?.name ||
          '';
        const phone = typeof metadata.phone === 'string' ? metadata.phone : '';
        const storedLocale = typeof metadata.locale === 'string' ? metadata.locale : null;
        const storedTimezone = typeof metadata.timezone === 'string' ? metadata.timezone : null;
        setProfileForm({ fullName, phone });
        if (storedLocale && isLocale(storedLocale)) {
          setPreferencesDraft((previous) => ({ ...previous, locale: storedLocale }));
        }
        if (storedTimezone && isDashboardTimezone(storedTimezone)) {
          setPreferencesDraft((previous) => ({ ...previous, timezone: storedTimezone }));
        }
      } catch (error) {
        if (!cancelled) {
          setProfileError(error instanceof Error ? error.message : 'Unable to load profile.');
        }
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [activeTab, user?.id, user?.name]);

  const handlePreferencesSave = async () => {
    setIsSavingPreferences(true);
    try {
      setLocale(preferencesDraft.locale);
      setTimezone(preferencesDraft.timezone);

      if (hasSupabaseSessionTokens()) {
        const supabase = await getAuthenticatedSupabaseClient();
        const { error } = await supabase.auth.updateUser({
          data: {
            locale: preferencesDraft.locale,
            timezone: preferencesDraft.timezone,
          },
        });
        if (error) throw error;

        const refresh = await supabase.auth.refreshSession();
        if (refresh.data.session?.access_token && refresh.data.session.refresh_token) {
          setAuthTokens(refresh.data.session.access_token, refresh.data.session.refresh_token);
        }
      }

      toast.success(t('settings.preferences.saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save preferences.');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleProfileSave = async () => {
    const fullName = profileForm.fullName.trim();
    if (!fullName) {
      toast.error('Full name is required.');
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    try {
      const supabase = await getAuthenticatedSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: profileForm.phone.trim() || null,
        },
      });
      if (error) throw error;

      const refresh = await supabase.auth.refreshSession();
      if (refresh.data.session?.access_token && refresh.data.session.refresh_token) {
        setAuthTokens(refresh.data.session.access_token, refresh.data.session.refresh_token);
      }

      updateProfile({ name: fullName });
      toast.success('Profile saved');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save profile.';
      setProfileError(message);
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'security') return;
    if (!hasSupabaseSessionTokens()) {
      setIsTwoFactorEnabled(false);
      setSecurityError('Sign out and sign in again to manage security settings.');
      return;
    }

    let cancelled = false;
    const loadSecurityState = async () => {
      setIsLoadingSecurity(true);
      setSecurityError(null);
      try {
        const supabase = await getAuthenticatedSupabaseClient();
        const factors = await supabase.auth.mfa.listFactors();
        if (factors.error) throw factors.error;
        if (!cancelled) {
          const verifiedTotp = factors.data.totp.filter((factor) => factor.status === 'verified');
          setIsTwoFactorEnabled(verifiedTotp.length > 0);
        }
      } catch (error) {
        if (!cancelled) {
          setSecurityError(error instanceof Error ? error.message : 'Unable to load security settings.');
          setIsTwoFactorEnabled(false);
        }
      } finally {
        if (!cancelled) setIsLoadingSecurity(false);
      }
    };

    void loadSecurityState();
    return () => {
      cancelled = true;
    };
  }, [activeTab, isTwoFactorDialogOpen]);

  const handlePasswordUpdate = async () => {
    if (!passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const supabase = await getAuthenticatedSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      toast.success('Password updated');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title={t('settings.title')}
        description={t('settings.description')}
      />

      <main className="flex-1 p-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-56 flex-shrink-0">
            <nav className="space-y-1">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'organization', label: 'Organization', icon: Building2 },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'security', label: 'Security', icon: Shield },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.profile.title')}</CardTitle>
                    <CardDescription>{t('settings.profile.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profileError ? (
                      <Alert className="border-amber-500/40 bg-amber-500/10">
                        <AlertDescription className="text-amber-800">{profileError}</AlertDescription>
                      </Alert>
                    ) : null}

                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold">
                        {profileForm.fullName.split(' ').map((n) => n[0]).join('') || user?.name?.[0] || 'U'}
                      </div>
                      <div>
                        <Button variant="outline" size="sm" disabled>
                          <Upload className="w-4 h-4 mr-2" />
                          Change Photo
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">Profile photos are not wired yet</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input
                          value={profileForm.fullName}
                          onChange={(event) =>
                            setProfileForm((previous) => ({ ...previous, fullName: event.target.value }))
                          }
                          disabled={isLoadingProfile || isSavingProfile}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input value={user?.email || ''} type="email" disabled />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone</label>
                        <Input
                          value={profileForm.phone}
                          onChange={(event) =>
                            setProfileForm((previous) => ({ ...previous, phone: event.target.value }))
                          }
                          type="tel"
                          placeholder="+55 11 99999-9999"
                          disabled={isLoadingProfile || isSavingProfile}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <Input value={user?.active_role || ''} disabled />
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {!hasSupabaseSessionTokens() ? (
                        <p className="text-xs text-muted-foreground">
                          Sign out and sign back in to save profile changes.
                        </p>
                      ) : null}
                      <Button
                        onClick={() => void handleProfileSave()}
                        disabled={isLoadingProfile || isSavingProfile || !hasSupabaseSessionTokens()}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSavingProfile ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.preferences.title')}</CardTitle>
                    <CardDescription>{t('settings.preferences.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{t('settings.preferences.language')}</p>
                        <p className="text-sm text-muted-foreground">{t('settings.preferences.language_hint')}</p>
                      </div>
                      <select
                        value={preferencesDraft.locale}
                        onChange={(event) =>
                          setPreferencesDraft((previous) => ({
                            ...previous,
                            locale: event.target.value as Locale,
                          }))
                        }
                        className="min-w-[10rem] rounded-md border bg-background px-3 py-2 text-sm"
                        disabled={isSavingPreferences}
                      >
                        {getAvailableLocales().map((option) => (
                          <option key={option} value={option}>
                            {getLocaleLabel(option)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{t('settings.preferences.timezone')}</p>
                        <p className="text-sm text-muted-foreground">{t('settings.preferences.timezone_hint')}</p>
                      </div>
                      <select
                        value={preferencesDraft.timezone}
                        onChange={(event) =>
                          setPreferencesDraft((previous) => ({
                            ...previous,
                            timezone: event.target.value as DashboardTimezone,
                          }))
                        }
                        className="min-w-[10rem] rounded-md border bg-background px-3 py-2 text-sm"
                        disabled={isSavingPreferences}
                      >
                        {TIMEZONE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {t(option.labelKey)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button onClick={() => void handlePreferencesSave()} disabled={isSavingPreferences}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSavingPreferences ? t('common.loading') : t('settings.preferences.save')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Organization Tab */}
            {activeTab === 'organization' && (
              <Card>
                <CardHeader>
                  <CardTitle>Organization Settings</CardTitle>
                  <CardDescription>Manage your organization details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Organization Name</label>
                      <Input defaultValue="Brazil Export Co." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Organization Type</label>
                      <Input value="Exporter" disabled />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Country</label>
                      <Input defaultValue="Brazil" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Registration Number</label>
                      <Input defaultValue="BR-EXP-2024-001" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Address</label>
                    <Input defaultValue="Av. Paulista, 1000 - Sao Paulo, SP" />
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">API Access</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Input value="sk_live_xxxxxxxxxxxxxxxxx" type="password" disabled />
                      </div>
                      <Button variant="outline">
                        <Key className="w-4 h-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification delivery</CardTitle>
                  <CardDescription>
                    What Tracebud can send today versus what is still on the roadmap
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertDescription>
                      Most toggles in the old settings screen were placeholders. Only the items marked
                      <span className="font-medium"> Active today</span> are wired in the current beta setup.
                      Per-user notification preferences are not persisted yet.
                    </AlertDescription>
                  </Alert>

                  {NOTIFICATION_CAPABILITIES.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4 border-b border-border/60 pb-4 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.title}</p>
                          <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                            {item.status === 'active' ? 'Active today' : 'Planned'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        {item.note ? <p className="text-xs text-muted-foreground">{item.note}</p> : null}
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 text-xs text-muted-foreground">
                        {item.deliveries.email ? (
                          <span>{item.status === 'active' ? 'Email: sent' : 'Email: planned'}</span>
                        ) : null}
                        {item.deliveries.in_app ? <span>In-app: planned</span> : null}
                        {item.deliveries.push ? <span>Push: not wired</span> : null}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <>
                {securityError ? (
                  <Alert className="border-amber-500/40 bg-amber-500/10">
                    <AlertDescription className="text-amber-800">{securityError}</AlertDescription>
                  </Alert>
                ) : null}

                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Updates your Supabase auth password for this account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Current Password</label>
                      <Input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(event) =>
                          setPasswordForm((previous) => ({ ...previous, currentPassword: event.target.value }))
                        }
                        disabled
                        placeholder="Not required for Supabase password reset in-session"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">New Password</label>
                      <Input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(event) =>
                          setPasswordForm((previous) => ({ ...previous, newPassword: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Confirm New Password</label>
                      <Input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(event) =>
                          setPasswordForm((previous) => ({ ...previous, confirmPassword: event.target.value }))
                        }
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => void handlePasswordUpdate()}
                        disabled={isUpdatingPassword || !hasSupabaseSessionTokens()}
                      >
                        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>
                      Protect your account with a TOTP authenticator app via Supabase Auth
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">Status</p>
                        <p className="text-sm text-muted-foreground">
                          {isLoadingSecurity
                            ? 'Checking authenticator status...'
                            : isTwoFactorEnabled
                              ? '2FA is enabled for this account'
                              : '2FA is currently disabled'}
                        </p>
                      </div>
                      {!isTwoFactorEnabled ? (
                        <Button
                          variant="outline"
                          onClick={() => setIsTwoFactorDialogOpen(true)}
                          disabled={!hasSupabaseSessionTokens() || isLoadingSecurity}
                        >
                          Enable 2FA
                        </Button>
                      ) : (
                        <Badge variant="secondary">Enabled</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>Session revocation is not wired in beta yet</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      You are signed in on this browser. Multi-device session management will be added in a
                      later release.
                    </p>
                  </CardContent>
                </Card>

                <TwoFactorSetupDialog
                  open={isTwoFactorDialogOpen}
                  onOpenChange={setIsTwoFactorDialogOpen}
                  onEnabled={() => {
                    setIsTwoFactorEnabled(true);
                    toast.success('Two-factor authentication enabled');
                  }}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
