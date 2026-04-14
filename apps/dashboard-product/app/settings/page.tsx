'use client';

import React, { useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building2, 
  Bell, 
  Shield, 
  Key,
  Globe,
  Save,
  Upload
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'notifications' | 'security'>('profile');

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Settings"
        description="Manage your account and organization settings"
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
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold">
                        {user?.name.split(' ').map(n => n[0]).join('') || 'U'}
                      </div>
                      <div>
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Change Photo
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG. Max 2MB</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input defaultValue={user?.name || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input defaultValue={user?.email || ''} type="email" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone</label>
                        <Input defaultValue="+1 (555) 000-0000" type="tel" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <Input value={user?.active_role || ''} disabled />
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

                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Customize your experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Language</p>
                        <p className="text-sm text-muted-foreground">Select your preferred language</p>
                      </div>
                      <select className="px-3 py-2 rounded-md border bg-background text-sm">
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>Portuguese</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Timezone</p>
                        <p className="text-sm text-muted-foreground">Set your local timezone</p>
                      </div>
                      <select className="px-3 py-2 rounded-md border bg-background text-sm">
                        <option>UTC+0 (London)</option>
                        <option>UTC+1 (Paris)</option>
                        <option>UTC+2 (Kigali)</option>
                        <option>UTC-3 (Sao Paulo)</option>
                      </select>
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
                      <Input value="Supplier" disabled />
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
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Configure how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { title: 'Package Updates', description: 'Get notified when package status changes', email: true, push: true },
                    { title: 'Compliance Alerts', description: 'Receive alerts for compliance issues', email: true, push: true },
                    { title: 'TRACES Submissions', description: 'Notifications for TRACES submission status', email: true, push: false },
                    { title: 'Weekly Reports', description: 'Receive weekly summary reports', email: true, push: false },
                    { title: 'System Updates', description: 'Important system announcements', email: true, push: false },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" defaultChecked={item.email} className="rounded border-input" />
                          Email
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" defaultChecked={item.push} className="rounded border-input" />
                          Push
                        </label>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end pt-4">
                    <Button>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your password regularly for security</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Current Password</label>
                      <Input type="password" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">New Password</label>
                      <Input type="password" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Confirm New Password</label>
                      <Input type="password" />
                    </div>
                    <div className="flex justify-end">
                      <Button>Update Password</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>Add an extra layer of security to your account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Status</p>
                        <p className="text-sm text-muted-foreground">2FA is currently disabled</p>
                      </div>
                      <Button variant="outline">Enable 2FA</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>Manage your active login sessions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { device: 'Chrome on MacOS', location: 'Sao Paulo, Brazil', current: true, lastActive: 'Now' },
                      { device: 'Safari on iPhone', location: 'Sao Paulo, Brazil', current: false, lastActive: '2 hours ago' },
                    ].map((session, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{session.device}</p>
                            <p className="text-xs text-muted-foreground">{session.location} · {session.lastActive}</p>
                          </div>
                        </div>
                        {session.current ? (
                          <Badge variant="secondary">Current</Badge>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-destructive">Revoke</Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
