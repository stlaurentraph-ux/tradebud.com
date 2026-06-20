'use client';

import { useEffect, useState } from 'react';
import type { ContentCalendarItem, ContentTask } from '@/types';

export function useContentCalendar() {
  const [items, setItems] = useState<ContentCalendarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/content/calendar', { cache: 'no-store' });
      const body = (await response.json()) as { items?: ContentCalendarItem[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Failed to load content calendar.');
      setItems(body.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content calendar.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const createItem = async (input: {
    channel: string;
    pillar?: string;
    hook?: string;
    scheduled_at?: string;
  }) => {
    const response = await fetch('/api/content/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = (await response.json()) as { item?: ContentCalendarItem; error?: string };
    if (!response.ok) throw new Error(body.error ?? 'Failed to create content item.');
    setItems((prev) => [...prev, body.item as ContentCalendarItem]);
  };

  const ensureWeeklyTarget = async (weekDate: string, weeklyTarget = 2) => {
    const before = items.length;
    const response = await fetch('/api/content/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekDate, weeklyTarget }),
    });
    const body = (await response.json()) as { items?: ContentCalendarItem[]; error?: string };
    if (!response.ok) throw new Error(body.error ?? 'Failed to create weekly post plan.');
    const nextItems = body.items ?? [];
    setItems(nextItems);
    return Math.max(0, nextItems.length - before);
  };

  return { items, isLoading, error, reload, createItem, ensureWeeklyTarget };
}

export function useContentTasks() {
  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/content/tasks', { cache: 'no-store' });
      const body = (await response.json()) as { tasks?: ContentTask[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Failed to load content tasks.');
      setTasks(body.tasks ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  const setStatus = async (id: string, status: 'open' | 'in_progress' | 'done' | 'missed') => {
    const response = await fetch('/api/content/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    const body = (await response.json()) as { task?: ContentTask; error?: string };
    if (!response.ok) throw new Error(body.error ?? 'Failed to update task.');
    setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  useEffect(() => {
    void reload();
  }, []);

  const createTask = async (input: { task_type: string; due_date?: string; notes?: string }) => {
    const response = await fetch('/api/content/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = (await response.json()) as { task?: ContentTask; error?: string };
    if (!response.ok) throw new Error(body.error ?? 'Failed to create content task.');
    setTasks((prev) => [...prev, body.task as ContentTask]);
  };

  return { tasks, isLoading, error, reload, setStatus, createTask };
}
