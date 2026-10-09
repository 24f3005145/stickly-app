import { App as CapApp } from '@capacitor/app';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { occKey, reminderService } from '../services/reminderService';
import type { Occurrence, Reminder, ReminderInput } from '../types';

interface Ctx {
  reminders: Reminder[];
  occurrences: Map<string, Occurrence>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (input: ReminderInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setPaused: (id: string, paused: boolean) => Promise<void>;
  mark: (id: string, date: string, status: 'completed' | 'skipped' | 'reset') => Promise<void>;
}
const RemindersContext = createContext<Ctx | null>(null);

export function RemindersProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [occList, setOccList] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [r, o] = await Promise.all([reminderService.list(), reminderService.occurrences()]);
      setReminders(r);
      setOccList(o);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load reminders.');
    } finally {
      setLoading(false);
    }
  }, []);

  // First load: re-sync native alarms (covers reinstall/restore), then read.
  useEffect(() => {
    void reminderService.resync().catch(() => undefined).then(refresh);
  }, [refresh]);

  // Refresh whenever the app returns to the foreground (e.g. after tapping Done in the shade).
  useEffect(() => {
    let cancelled = false;
    let remove: (() => void) | undefined;
    void CapApp.addListener('appStateChange', (state) => {
      if (state.isActive) void refresh();
    }).then((handle) => {
      if (cancelled) void handle.remove();
      else remove = () => void handle.remove();
    });
    return () => {
      cancelled = true;
      remove?.();
    };
  }, [refresh]);

  const occurrences = useMemo(() => new Map(occList.map((o) => [occKey(o.reminderId, o.date), o])), [occList]);

  const value = useMemo<Ctx>(
    () => ({
      reminders,
      occurrences,
      loading,
      error,
      refresh,
      save: async (input) => {
        await reminderService.save(input);
        await refresh();
      },
      remove: async (id) => {
        await reminderService.remove(id);
        await refresh();
      },
      setPaused: async (id, paused) => {
        await reminderService.setPaused(id, paused);
        await refresh();
      },
      mark: async (id, date, status) => {
        await reminderService.mark(id, date, status);
        await refresh();
      },
    }),
    [reminders, occurrences, loading, error, refresh],
  );

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useReminders(): Ctx {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error('useReminders must be used inside RemindersProvider');
  return ctx;
}
