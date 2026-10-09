import type { Reminder } from '../types';

export const pad = (n: number): string => String(n).padStart(2, '0');

/** Local date key 'YYYY-MM-DD' (matches native LocalDate.toString()). */
export const toKey = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const SHORT = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LONG = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const weekdayShort = (n: number): string => SHORT[n];
export const weekdayLong = (n: number): string => LONG[n];

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatSchedule(r: Reminder): string {
  switch (r.scheduleType) {
    case 'once':
      return r.onceDate
        ? `Once on ${parseKey(r.onceDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}`
        : 'Once';
    case 'daily':
      return 'Every day';
    case 'monthly':
      return `Monthly on the ${ordinal(r.dayOfMonth ?? 1)}`;
    default: {
      const days = [...r.selectedDays].sort((a, b) => a - b);
      if (days.length === 7) return 'Every day';
      if (days.length === 1) return `Every ${weekdayLong(days[0])}`;
      if (days.length === 0) return 'No days selected';
      return `Every ${days.map(weekdayShort).join(' & ')}`;
    }
  }
}

export function formatNext(ms: number | null, now: Date = new Date()): string {
  if (ms == null) return 'None scheduled';
  const d = new Date(ms);
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (toKey(d) === toKey(now)) return `Today, ${time}`;
  if (toKey(d) === toKey(addDays(now, 1))) return `Tomorrow, ${time}`;
  return `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}, ${time}`;
}
