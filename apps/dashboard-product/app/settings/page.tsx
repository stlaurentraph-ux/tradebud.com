'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  CreditCard,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { hasSupabaseSessionTokens, setAuthTokens } from '@/lib/auth-session';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase-browser';
import { NOTIFICATION_CAPABILITIES } from '@/lib/settings-capabilities';
import { DemoDataToggleCard } from '@/components/demo/demo-data-toggle-card';
import { OrgSupplyChainRolesPanel } from '@/components/settings/org-supply-chain-roles-panel';
import { useLocale } from '@/lib/locale-context';
import {
  getLocaleLabel,
  getLocalePickerGroupsForRole,
  getLocalePolicyDescriptionKey,
  isLocaleForRole,
  type Locale,
} from '@/lib/locale-policy';
import {
  getNotificationCapabilityCopy,
  getSettingsLicensePageCopy,
  getSettingsPageCopy,
} from '@/lib/workflow-terminology-labels';
import { SETTINGS_LICENSE_PATH } from '@/lib/settings-paths';
import {
  isDashboardTimezone,
  TIMEZONE_OPTIONS,
  type DashboardTimezone,
} from '@/lib/i18n';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { locale, timezone, availableLocales, setLocale, setTimezone, t } = useLocale();
  const role = user?.active_role ?? null;
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
        if (storedLocale && isLocaleForRole(storedLocale, role)) {
          setPreferencesDraft((previous) => ({ ...previous, locale: storedLocale }));
        }
        if (storedTimezone && isDashboardTimezone(storedTimezone)) {
          setPreferencesDraft((previous) => ({ ...previous, timezone: storedTimezone }));
        }
      } catch (error) {
        if (!cancelled) {
          setProfileError(error instanceof Error ? error.message : getSettingsPageCopy('error_load_profile', t));
        }
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [activeTab, user?.id, user?.name, role, locale, timezone, t]);

  const handlePreferencesSave = async () => {
    setIsSavingPreferences(true);
    try {
      const nextLocale = isLocaleForRole(preferencesDraft.locale, role)
        ? preferencesDraft.locale
        : availableLocales[0];
      setLocale(nextLocale);
      setTimezone(preferencesDraft.timezone);

      if (hasSupabaseSessionTokens()) {
        const supabase = await getAuthenticatedSupabaseClient();
        const { error } = await supabase.auth.updateUser({
          data: {
            locale: nextLocale,
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
      toast.error(error instanceof Error ? error.message : getSettingsPageCopy('error_save_preferences', t));
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleProfileSave = async () => {
    const fullName = profileForm.fullName.trim();
    if (!fullName) {
      toast.error(getSettingsPageCopy('error_name_required', t));
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
      toast.success(getSettingsPageCopy('toast_profile_saved', t));
    } catch (error) {
      const message = error instanceof Error ? error.message : getSettingsPageCopy('error_save_profile', t);
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
      setSecurityError(getSettingsPageCopy('error_security_session', t));
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
          setSecurityError(error instanceof Error ? error.message : getSettingsPageCopy('error_load_security', t));
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
  }, [activeTab, isTwoFactorDialogOpen, t]);

  const handlePasswordUpdate = async () => {
    if (!passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(getSettingsPageCopy('error_password_mismatch', t));
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error(getSettingsPageCopy('error_password_length', t));
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const supabase = await getAuthenticatedSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      toast.success(getSettingsPageCopy('toast_password_updated', t));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : getSettingsPageCopy('error_password_update', t));
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
                { id: 'profile', label: getSettingsPageCopy('tab_profile', t), icon: User },
                { id: 'organization', label: getSettingsPageCopy('tab_organization', t), icon: Building2 },
                { id: 'notifications', label: getSettingsPageCopy('tab_notifications', t), icon: Bell },
                { id: 'security', label: getSettingsPageCopy('tab_security', t), icon: Shield },
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
              <Link
                href={SETTINGS_LICENSE_PATH}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <CreditCard className="w-4 h-4" />
                {getSettingsLicensePageCopy('nav_link', t)}
              </Link>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            <DemoDataToggleCard />
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
                          {getSettingsPageCopy('change_photo', t)}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">{getSettingsPageCopy('photo_not_wired', t)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{getSettingsPageCopy('field_full_name', t)}</label>
                        <Input
                          value={profileForm.fullName}
                          onChange={(event) =>
                            setProfileForm((previous) => ({ ...previous, fullName: event.target.value }))
                          }
                          disabled={isLoadingProfile || isSavingProfile}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{getSettingsPageCopy('field_email', t)}</label>
                        <Input value={user?.email || ''} type="email" disabled />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{getSettingsPageCopy('field_phone', t)}</label>
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
                        <label className="text-sm font-medium">{getSettingsPageCopy('field_role', t)}</label>
                        <Input value={user?.active_role || ''} disabled />
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {!hasSupabaseSessionTokens() ? (
                        <p className="text-xs text-muted-foreground">
                          {getSettingsPageCopy('sign_in_to_save', t)}
                        </p>
                      ) : null}
                      <Button
                        onClick={() => void handleProfileSave()}
                        disabled={isLoadingProfile || isSavingProfile || !hasSupabaseSessionTokens()}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSavingProfile ? getSettingsPageCopy('saving', t) : getSettingsPageCopy('save_changes', t)}
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
                        <p className="text-sm text-muted-foreground">
                          {t(getLocalePolicyDescriptionKey(role))}
                        </p>
                      </div>
                      <select
                        value={preferencesDraft.locale}
                        onChange={(event) =>
                          setPreferencesDraft((previous) => ({
                            ...previous,
                            locale: event.target.value as Locale,
                          }))
                        }
                        className="min-w-[12rem] max-w-[14rem] rounded-md border bg-background px-3 py-2 text-sm"
                        disabled={isSavingPreferences}
                      >
                        {getLocalePickerGroupsForRole(role).map((group) => (
                          <optgroup key={group.labelKey} label={t(group.labelKey)}>
                            {group.locales.map((option) => (
                              <option key={option} value={option}>
                                {getLocaleLabel(option)}
                              </option>
                            ))}
                          </optgroup>
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
              <div className="space-y-6">
                <OrgSupplyChainRolesPanel />
              <Card>
                <CardHeader>
                  <CardTitle>{getSettingsPageCopy('org_settings_title', t)}</CardTitle>
                  <CardDescription>{getSettingsPageCopy('org_settings_description', t)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{getSettingsPageCopy('org_name', t)}</label>
                      <Input defaultValue="Brazil Export Co." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{getSettingsPageCopy('org_type', t)}</label>
                      <Input value="Exporter" disabled />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{getSettingsPageCopy('org_country', t)}</label>
                      <Input defaultValue="Brazil" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{getSettingsPageCopy('org_registration', t)}</label>
                      <Input defaultValue="BR-EXP-2024-001" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{getSettingsPageCopy('org_address', t)}</label>
                    <Input defaultValue="Av. Paulista, 1000 - Sao Paulo, SP" />
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">{getSettingsPageCopy('org_api_access', t)}</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Input value="sk_live_xxxxxxxxxxxxxxxxx" type="password" disabled />
                      </div>
                      <Button variant="outline">
                        <Key className="w-4 h-4 mr-2" />
                        {getSettingsPageCopy('org_regenerate', t)}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button>
                      <Save className="w-4 h-4 mr-2" />
                      {getSettingsPageCopy('save_changes', t)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>{getSettingsPageCopy('notifications_title', t)}</CardTitle>
                  <CardDescription>{getSettingsPageCopy('notifications_description', t)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertDescription>{getSettingsPageCopy('notifications_beta_alert', t)}</AlertDescription>
                  </Alert>

                  {NOTIFICATION_CAPABILITIES.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4 border-b border-border/60 pb-4 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{getNotificationCapabilityCopy(item.id, 'title', t)}</p>
                          <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                            {item.status === 'active'
                              ? getSettingsPageCopy('notifications_active_today', t)
                              : getSettingsPageCopy('notifications_planned', t)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getNotificationCapabilityCopy(item.id, 'description', t)}
                        </p>
                        {item.note ? (
                          <p className="text-xs text-muted-foreground">
                            {getNotificationCapabilityCopy(item.id, 'note', t)}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 text-xs text-muted-foreground">
                        {item.deliveries.email ? (
                          <span>
                            {item.status === 'active'
                              ? getSettingsPageCopy('notifications_email_sent', t)
                              : getSettingsPageCopy('notifications_email_planned', t)}
                          </span>
                        ) : null}
                        {item.deliveries.in_app ? (
                          <span>{getSettingsPageCopy('notifications_in_app_planned', t)}</span>
                        ) : null}
                        {item.deliveries.push ? (
                          <span>{getSettingsPageCopy('notifications_push_not_wired', t)}</span>
                        ) : null}
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
                    <CardTitle>{getSettingsPageCopy('security_password_title', t)}</CardTitle>
                    <CardDescription>{getSettingsPageCopy('security_password_description', t)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{getSettingsPageCopy('security_current_password', t)}</label>
                      <Input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(event) =>
                          setPasswordForm((previous) => ({ ...previous, currentPassword: event.target.value }))
                        }
                        disabled
                        placeholder={getSettingsPageCopy('security_current_password_hint', t)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{getSettingsPageCopy('security_new_password', t)}</label>
                      <Input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(event) =>
                          setPasswordForm((previous) => ({ ...previous, newPassword: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{getSettingsPageCopy('security_confirm_password', t)}</label>
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
                        {isUpdatingPassword
                          ? getSettingsPageCopy('security_updating', t)
                          : getSettingsPageCopy('security_update_password', t)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{getSettingsPageCopy('security_twofa_title', t)}</CardTitle>
                    <CardDescription>{getSettingsPageCopy('security_twofa_description', t)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{getSettingsPageCopy('security_status', t)}</p>
                        <p className="text-sm text-muted-foreground">
                          {isLoadingSecurity
                            ? getSettingsPageCopy('security_checking_2fa', t)
                            : isTwoFactorEnabled
                              ? getSettingsPageCopy('security_2fa_enabled', t)
                              : getSettingsPageCopy('security_2fa_disabled', t)}
                        </p>
                      </div>
                      {!isTwoFactorEnabled ? (
                        <Button
                          variant="outline"
                          onClick={() => setIsTwoFactorDialogOpen(true)}
                          disabled={!hasSupabaseSessionTokens() || isLoadingSecurity}
                        >
                          {getSettingsPageCopy('security_enable_2fa', t)}
                        </Button>
                      ) : (
                        <Badge variant="secondary">{getSettingsPageCopy('security_enabled_badge', t)}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{getSettingsPageCopy('security_sessions_title', t)}</CardTitle>
                    <CardDescription>{getSettingsPageCopy('security_sessions_description', t)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {getSettingsPageCopy('security_sessions_body', t)}
                    </p>
                  </CardContent>
                </Card>

                <TwoFactorSetupDialog
                  open={isTwoFactorDialogOpen}
                  onOpenChange={setIsTwoFactorDialogOpen}
                  onEnabled={() => {
                    setIsTwoFactorEnabled(true);
                    toast.success(getSettingsPageCopy('toast_2fa_enabled', t));
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
