import type { Weekday } from '../types';
import { weekdayLong, weekdayShort } from '../utils/date';

const DAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

export function DayPicker({ value, onChange }: { value: Weekday[]; onChange: (v: Weekday[]) => void }) {
  const toggle = (d: Weekday) =>
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d].sort((a, b) => a - b));
  return (
    <div className="daypicker" role="group" aria-label="Days of the week">
      {DAYS.map((d) => (
        <button
          key={d}
          type="button"
          aria-pressed={value.includes(d)}
          aria-label={weekdayLong(d)}
          className={`daypicker__day ${value.includes(d) ? 'is-on' : ''}`}
          onClick={() => toggle(d)}
        >
          {weekdayShort(d).slice(0, 3)}
        </button>
      ))}
    </div>
  );
}
