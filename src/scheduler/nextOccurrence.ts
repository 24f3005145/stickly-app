import type { Reminder } from '../types';
import { addDays, toKey } from '../utils/date';

/**
 * UI-side mirror of the native schedule rules (used for the calendar and the
 * browser dev mock). The native scheduler is the source of truth for alarms.
 */
type Sched = Pick<Reminder, 'scheduleType' | 'selectedDays' | 'time' | 'onceDate' | 'dayOfMonth'>;

export function occursOn(r: Sched, d: Date): boolean {
  switch (r.scheduleType) {
    case 'once':
      return r.onceDate === toKey(d);
    case 'daily':
      return true;
    case 'weekly':
    case 'custom': {
      const iso = d.getDay() === 0 ? 7 : d.getDay();
      return (r.selectedDays as number[]).includes(iso);
    }
    case 'monthly': {
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return d.getDate() === Math.min(r.dayOfMonth ?? 0, last);
    }
    default:
      return false;
  }
}

export function triggerAt(r: Pick<Reminder, 'time'>, d: Date): Date {
  const [h, m] = r.time.split(':').map(Number);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0);
}

export function nextOccurrenceAfter(
  r: Sched,
  from: Date,
  isSuppressed: (dateKey: string) => boolean = () => false,
): Date | null {
  for (let i = 0; i < 800; i++) {
    const d = addDays(from, i);
    if (!occursOn(r, d) || isSuppressed(toKey(d))) continue;
    const t = triggerAt(r, d);
    if (t.getTime() > from.getTime()) return t;
  }
  return null;
}
