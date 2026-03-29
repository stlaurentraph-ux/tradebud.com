'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Bell, Shield, Users, Save } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: 'Global Cocoa Export Co.',
    email: 'admin@cocoaexport.com',
    phone: '+55 11 98765-4321',
    notificationsEnabled: true,
    emailAlerts: true,
    smsAlerts: false,
    twoFactorAuth: true,
    dataExportEnabled: false,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and system preferences</p>
        </div>

        {/* Save notification */}
        {saved && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            ✓ Settings saved successfully
          </div>
        )}

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates about your exports</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                className="w-5 h-5 rounded"
              />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">Email Alerts</p>
                <p className="text-sm text-muted-foreground">Get important updates via email</p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailAlerts}
                onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })}
                className="w-5 h-5 rounded"
              />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">SMS Alerts</p>
                <p className="text-sm text-muted-foreground">Critical updates via text message</p>
              </div>
              <input
                type="checkbox"
                checked={settings.smsAlerts}
                onChange={(e) => setSettings({ ...settings, smsAlerts: e.target.checked })}
                className="w-5 h-5 rounded"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Enhanced security for your account</p>
              </div>
              <input
                type="checkbox"
                checked={settings.twoFactorAuth}
                onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                className="w-5 h-5 rounded"
              />
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium border-t pt-4">
              Change Password
            </button>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Data & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export My Data</p>
                <p className="text-sm text-muted-foreground">Download all your account data</p>
              </div>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">Data Retention</p>
                <p className="text-sm text-muted-foreground">Compliant with GDPR and local regulations</p>
              </div>
              <span className="text-sm text-green-600 font-medium">Compliant</span>
            </div>
          </CardContent>
        </Card>

        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Organization Type</label>
              <select className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background">
                <option>Exporter / Trader</option>
                <option>Importer</option>
                <option>Cooperative</option>
                <option>Government Agency</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Industry</label>
              <select className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background">
                <option>Cocoa</option>
                <option>Coffee</option>
                <option>Timber</option>
                <option>Cattle</option>
                <option>Soy</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button onClick={handleSave} size="lg" className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" size="lg">
            Cancel
          </Button>
        </div>

        {/* Danger Zone */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-red-800">
                These actions cannot be undone. Please proceed with caution.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="border-red-300">
                  Deactivate Account
                </Button>
                <Button variant="outline" className="border-red-300">
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
