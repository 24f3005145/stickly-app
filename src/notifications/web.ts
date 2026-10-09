import type { Occurrence, PermissionState, Reminder, ReminderInput } from '../types';
import { nextOccurrenceAfter } from '../scheduler/nextOccurrence';
import type { NativeSettings, SticklyPluginApi } from './SticklyPlugin';

/**
 * BROWSER DEV MOCK ONLY (npm run dev). It stores reminders in localStorage so
 * you can design the UI in a browser. It does NOT schedule notifications.
 * On Android the native SticklyPlugin.kt is used instead.
 */
const RK = 'stickly-dev-reminders';
const OK = 'stickly-dev-occurrences';

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[];
  } catch {
    return [];
  }
}
const write = (key: string, value: unknown): void => localStorage.setItem(key, JSON.stringify(value));

function withNext(r: Reminder): Reminder {
  if (r.isPaused) return { ...r, nextOccurrence: null };
  const occ = read<Occurrence>(OK);
  const suppressed = (key: string): boolean =>
    occ.some(
      (o) => o.reminderId === r.id && o.date === key && (o.status === 'completed' || o.status === 'skipped'),
    );
  const n = nextOccurrenceAfter(r, new Date(), suppressed);
  return { ...r, nextOccurrence: n ? n.getTime() : null };
}

export class SticklyWeb implements SticklyPluginApi {
  async getReminders() {
    return { reminders: read<Reminder>(RK).map(withNext) };
  }

  async saveReminder({ reminder }: { reminder: ReminderInput }) {
    if (!reminder.title.trim()) throw new Error('Title is required.');
    const all = read<Reminder>(RK);
    const existing = all.find((r) => r.id === reminder.id);
    const now = Date.now();
    const saved = withNext({
      ...reminder,
      id: existing?.id ?? crypto.randomUUID(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      nextOccurrence: null,
      notificationId: existing?.notificationId ?? Math.floor(Math.random() * 1e6),
    });
    write(RK, [...all.filter((r) => r.id !== saved.id), saved]);
    return { reminder: saved };
  }

  async deleteReminder({ id }: { id: string }) {
    write(RK, read<Reminder>(RK).filter((r) => r.id !== id));
    write(OK, read<Occurrence>(OK).filter((o) => o.reminderId !== id));
  }

  async setPaused({ id, paused }: { id: string; paused: boolean }) {
    const all = read<Reminder>(RK).map((r) => (r.id === id ? { ...r, isPaused: paused } : r));
    write(RK, all);
    return { reminder: withNext(all.find((r) => r.id === id) as Reminder) };
  }

  async markOccurrence({ id, date, status }: { id: string; date: string; status: 'completed' | 'skipped' | 'reset' }) {
    const occ = read<Occurrence>(OK).filter((o) => !(o.reminderId === id && o.date === date));
    occ.push({
      reminderId: id,
      date,
      status: status === 'reset' ? 'upcoming' : status,
      updatedAt: Date.now(),
    });
    write(OK, occ);
    return { reminder: withNext(read<Reminder>(RK).find((r) => r.id === id) as Reminder) };
  }

  async getOccurrences({ from, to }: { from: string; to: string }) {
    return { occurrences: read<Occurrence>(OK).filter((o) => o.date >= from && o.date <= to) };
  }

  async rescheduleAll() {}
  async setSettings(_options: NativeSettings) {}

  async getPermissions(): Promise<PermissionState> {
    return { notifications: true, exactAlarms: true, batteryUnrestricted: true };
  }
  async requestNotificationPermission(): Promise<PermissionState> {
    return this.getPermissions();
  }
  async openNotificationSettings() {}
  async openExactAlarmSettings() {}
  async openBatterySettings() {}
}
