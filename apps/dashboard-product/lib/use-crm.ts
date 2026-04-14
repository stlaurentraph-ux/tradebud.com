'use client';

import { useEffect, useState } from 'react';
import { useCallback } from 'react';
import type { DailyAction, OutreachActivity, OutreachTemplate, Prospect } from '@/types';

export function useProspects() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/crm/prospects', { cache: 'no-store' });
      const body = (await response.json()) as { prospects?: Prospect[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Failed to load prospects.');
      setProspects(body.prospects ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prospects.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createProspect = async (input: {
    name: string;
    company: string;
    email?: string;
    notes?: string;
  }) => {
    const response = await fetch('/api/crm/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = (await response.json()) as { prospect?: Prospect; error?: string };
    if (!response.ok) throw new Error(body.error ?? 'Failed to create prospect.');
    setProspects((prev) => [body.prospect as Prospect, ...prev]);
  };

  return { prospects, isLoading, error, reload, createProspect };
}

export function useDailyActions(actionDate?: string) {
  const [actions, setActions] = useState<DailyAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = actionDate ? `?date=${encodeURIComponent(actionDate)}` : '';
      const response = await fetch(`/api/crm/daily-actions${query}`, { cache: 'no-store' });
      const body = (await response.json()) as { actions?: DailyAction[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Failed to load daily actions.');
      setActions(body.actions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load daily actions.');
    } finally {
      setIsLoading(false);
    }
  }, [actionDate]);

  const markComplete = async (id: string) => {
    const response = await fetch('/api/crm/daily-actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const body = (await response.json()) as { action?: DailyAction; error?: string };
    if (!response.ok) throw new Error(body.error ?? 'Failed to update action.');
    setActions((prev) => prev.map((item) => (item.id === id ? { ...item, completed: true } : item)));
  };

  const ensureDailyTarget = async (date: string, target = 3) => {
    const before = actions.length;
    const response = await fetch('/api/crm/daily-actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, target }),
    });
    const body = (await response.json()) as { actions?: DailyAction[]; error?: string };
    if (!response.ok) throw new Error(body.error ?? 'Failed to plan daily actions.');
    const nextActions = body.actions ?? [];
    setActions(nextActions);
    return Math.max(0, nextActions.length - before);
  };

  useEffect(() => {
    void reload();
  }, [reload]);

  return { actions, isLoading, error, reload, markComplete, ensureDailyTarget };
}

export function useDailyActionHistory(historyDays = 30) {
  const [actions, setActions] = useState<DailyAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/daily-actions?historyDays=${encodeURIComponent(historyDays)}`, {
        cache: 'no-store',
      });
      const body = (await response.json()) as { actions?: DailyAction[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Failed to load daily action history.');
      setActions(body.actions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load daily action history.');
    } finally {
      setIsLoading(false);
    }
  }, [historyDays]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { actions, isLoading, error, reload };
}

export function useOutreachTemplates() {
  const [templates, setTemplates] = useState<OutreachTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/crm/templates', { cache: 'no-store' });
      const body = (await response.json()) as { templates?: OutreachTemplate[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Failed to load templates.');
      setTemplates(body.templates ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createTemplate = async (input: {
    name: string;
    stage: string;
    channel: string;
    content: string;
  }) => {
    const response = await fetch('/api/crm/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = (await response.json()) as { template?: OutreachTemplate; error?: string };
    if (!response.ok) throw new Error(body.error ?? 'Failed to create template.');
    setTemplates((prev) => [...prev, body.template as OutreachTemplate]);
  };

  return { templates, isLoading, error, reload, createTemplate };
}

export function useOutreachActivity() {
  const [activities, setActivities] = useState<OutreachActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/crm/exchanges', { cache: 'no-store' });
      const body = (await response.json()) as { activities?: OutreachActivity[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Failed to load outreach activity.');
      setActivities(body.activities ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outreach activity.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createActivity = async (input: {
    prospect_id: string;
    content: string;
    activity_type?: string;
    channel?: string;
  }) => {
    const response = await fetch('/api/crm/exchanges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = (await response.json()) as { activity?: OutreachActivity; error?: string };
    if (!response.ok) throw new Error(body.error ?? 'Failed to create outreach activity.');
    setActivities((prev) => [body.activity as OutreachActivity, ...prev]);
  };

  return { activities, isLoading, error, reload, createActivity };
}
