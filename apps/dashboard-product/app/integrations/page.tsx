'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppHeader } from '@/components/layout/app-header';
import { PermissionGate } from '@/components/common/permission-gate';
import { RunQueueSection } from '@/components/integrations/run-queue-section';
import { SchedulerSection } from '@/components/integrations/scheduler-section';

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState('run-queue');

  return (
    <PermissionGate permission="admin:view">
      <div className="flex flex-col">
        <AppHeader
          title="Integrations Operations"
          subtitle="Monitor and operate Cool Farm + SAI V2 run workflows"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Integrations Operations' },
          ]}
        />

        <div className="flex-1 space-y-6 p-6">
          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="run-queue" className="data-[state=active]:bg-card">
                Run Queue
              </TabsTrigger>
              <TabsTrigger value="scheduler" className="data-[state=active]:bg-card">
                Scheduler
              </TabsTrigger>
            </TabsList>

            <TabsContent value="run-queue" className="mt-6">
              <RunQueueSection />
            </TabsContent>

            <TabsContent value="scheduler" className="mt-6">
              <SchedulerSection />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PermissionGate>
  );
}
