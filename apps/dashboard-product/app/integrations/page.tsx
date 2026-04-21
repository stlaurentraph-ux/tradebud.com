'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RunQueueSection } from '@/components/integrations/run-queue-section';
import { SchedulerSection } from '@/components/integrations/scheduler-section';

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState('run-queue');

  return (
    <div className="page-padding">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Integrations Operations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor and operate Cool Farm + SAI V2 run workflows
        </p>
      </div>

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
  );
}
