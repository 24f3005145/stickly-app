import { useState } from 'react';
import { Link } from 'react-router-dom';
import { emojiFor } from '../components/IconPicker';
import { StatusChip } from '../components/StatusChip';
import { useReminders } from '../hooks/useReminders';
import { occursOn } from '../scheduler/nextOccurrence';
import { statusOn } from '../services/reminderService';
import { addDays, formatTime, toKey } from '../utils/date';

type View = 'today' | 'tomorrow' | 'week' | 'month';
const VIEWS: { key: View; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'Month' },
];

export default function CalendarPage() {
  const { reminders, occurrences } = useReminders();
  const [view, setView] = useState<View>('today');
  const now = new Date();
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(toKey(now));

  const forDay = (d: Date) =>
    reminders.filter((r) => !r.isPaused && occursOn(r, d)).sort((a, b) => a.time.localeCompare(b.time));

  const DayList = ({ date }: { date: Date }) => {
    const items = forDay(date);
    const key = toKey(date);
    if (items.length === 0) return <p className="muted">Nothing scheduled.</p>;
    return (
      <div className="list list--tight">
        {items.map((r) => (
          <Link key={r.id} to={`/reminder/${r.id}`} className="card row">
            <span className="rc__icon" aria-hidden="true">{emojiFor(r.icon)}</span>
            <span className="row__body">
              <span className="rc__title">{r.title}</span>
              <span className="rc__meta">{formatTime(r.time)}</span>
            </span>
            <StatusChip status={statusOn(r, key, occurrences, now)} />
          </Link>
        ))}
      </div>
    );
  };

  const dayHeading = (d: Date) =>
    d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  // month grid (Monday first)
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  const total = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];

  return (
    <main className="screen">
      <header className="header"><h1 className="h1">Schedule</h1></header>

      <div className="seg seg--scroll" role="tablist" aria-label="View">
        {VIEWS.map((v) => (
          <button key={v.key} role="tab" aria-selected={view === v.key} className={view === v.key ? 'is-on' : ''} onClick={() => setView(v.key)}>
            {v.label}
          </button>
        ))}
      </div>

      {view === 'today' && <section><h2 className="h2">{dayHeading(now)}</h2><DayList date={now} /></section>}
      {view === 'tomorrow' && <section><h2 className="h2">{dayHeading(addDays(now, 1))}</h2><DayList date={addDays(now, 1)} /></section>}
      {view === 'week' &&
        Array.from({ length: 7 }, (_, i) => addDays(now, i)).map((d) => (
          <section key={toKey(d)}>
            <h2 className="h2">{i18nDay(d, now)}</h2>
            <DayList date={d} />
          </section>
        ))}

      {view === 'month' && (
        <section>
          <div className="month-head">
            <button className="icon-btn" aria-label="Previous month" onClick={() => setCursor(new Date(y, m - 1, 1))}>‹</button>
            <h2 className="h2">{cursor.toLocaleDateString([], { month: 'long', year: 'numeric' })}</h2>
            <button className="icon-btn" aria-label="Next month" onClick={() => setCursor(new Date(y, m + 1, 1))}>›</button>
          </div>
          <div className="cal">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="cal__dow">{d}</span>)}
            {cells.map((n, i) => {
              if (n == null) return <span key={`b${i}`} />;
              const d = new Date(y, m, n);
              const key = toKey(d);
              const has = forDay(d).length > 0;
              return (
                <button
                  key={key}
                  className={`cal__day ${key === selected ? 'is-sel' : ''} ${key === toKey(now) ? 'is-today' : ''}`}
                  onClick={() => setSelected(key)}
                  aria-label={dayHeading(d)}
                >
                  {n}
                  {has && <i className="cal__dot" />}
                </button>
              );
            })}
          </div>
          <h2 className="h2">{dayHeading(new Date(selected + 'T00:00:00'))}</h2>
          <DayList date={new Date(selected + 'T00:00:00')} />
        </section>
      )}
    </main>
  );
}

function i18nDay(d: Date, now: Date): string {
  if (toKey(d) === toKey(now)) return 'Today';
  if (toKey(d) === toKey(addDays(now, 1))) return 'Tomorrow';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}
