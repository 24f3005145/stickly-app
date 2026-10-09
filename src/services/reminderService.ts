import { Stickly } from '../notifications/SticklyPlugin';
import { occursOn, triggerAt } from '../scheduler/nextOccurrence';
import type { DisplayStatus, Occurrence, Reminder, ReminderInput } from '../types';
import { addDays, toKey } from '../utils/date';

/** UI-facing API. All persistence + scheduling happens natively. */
export const reminderService = {
  async list(): Promise<Reminder[]> {
    return (await Stickly.getReminders()).reminders;
  },
  async save(input: ReminderInput): Promise<Reminder> {
    return (await Stickly.saveReminder({ reminder: input })).reminder;
  },
  async remove(id: string): Promise<void> {
    await Stickly.deleteReminder({ id });
  },
  async setPaused(id: string, paused: boolean): Promise<void> {
    await Stickly.setPaused({ id, paused });
  },
  async mark(id: string, date: string, status: 'completed' | 'skipped' | 'reset'): Promise<void> {
    await Stickly.markOccurrence({ id, date, status });
  },
  async occurrences(): Promise<Occurrence[]> {
    const now = new Date();
    const range = { from: toKey(addDays(now, -45)), to: toKey(addDays(now, 90)) };
    return (await Stickly.getOccurrences(range)).occurrences;
  },
  async resync(): Promise<void> {
    await Stickly.rescheduleAll();
  },
};

export const occKey = (reminderId: string, date: string): string => `${reminderId}|${date}`;

/** Status of a reminder's occurrence on a given local date. */
export function statusOn(
  r: Reminder,
  date: string,
  occ: Map<string, Occurrence>,
  now: Date = new Date(),
): DisplayStatus {
  if (r.isPaused) return 'paused';
  const o = occ.get(occKey(r.id, date));
  if (o && o.status !== 'upcoming') return o.status;
  if (date === toKey(now) && occursOn(r, now) && triggerAt(r, now).getTime() <= now.getTime()) {
    return 'active';
  }
  return 'upcoming';
}
