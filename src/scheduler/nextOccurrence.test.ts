import { describe, expect, it } from 'vitest';
import { nextOccurrenceAfter, occursOn } from './nextOccurrence';

const wedFri = {
  scheduleType: 'weekly' as const,
  selectedDays: [3, 5] as (1 | 2 | 3 | 4 | 5 | 6 | 7)[],
  time: '09:00',
};

describe('nextOccurrenceAfter', () => {
  it('returns later today when the time has not passed (Fri 08:00)', () => {
    const n = nextOccurrenceAfter(wedFri, new Date(2026, 9, 9, 8, 0));
    expect(n).toEqual(new Date(2026, 9, 9, 9, 0));
  });

  it('jumps to next Wednesday when Friday time has passed', () => {
    const n = nextOccurrenceAfter(wedFri, new Date(2026, 9, 9, 10, 0));
    expect(n).toEqual(new Date(2026, 9, 14, 9, 0));
  });

  it('skips suppressed (completed/skipped) dates', () => {
    const n = nextOccurrenceAfter(wedFri, new Date(2026, 9, 9, 8, 0), (k) => k === '2026-10-09');
    expect(n).toEqual(new Date(2026, 9, 14, 9, 0));
  });

  it('returns null for a one-time reminder in the past', () => {
    const n = nextOccurrenceAfter(
      { scheduleType: 'once', selectedDays: [], time: '09:00', onceDate: '2026-01-01' },
      new Date(2026, 9, 9),
    );
    expect(n).toBeNull();
  });
});

describe('occursOn', () => {
  it('clamps monthly day 31 to the last day of February', () => {
    const r = { scheduleType: 'monthly' as const, selectedDays: [], time: '09:00', dayOfMonth: 31 };
    expect(occursOn(r, new Date(2027, 1, 28))).toBe(true);
    expect(occursOn(r, new Date(2027, 1, 27))).toBe(false);
  });
});
