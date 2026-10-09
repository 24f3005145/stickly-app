import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icons';
import { ReminderCard } from '../components/ReminderCard';
import { useReminders } from '../hooks/useReminders';
import { statusOn } from '../services/reminderService';
import { toKey } from '../utils/date';

type Filter = 'all' | 'active' | 'paused';
type Sort = 'alpha' | 'next' | 'recent';

export default function RemindersPage() {
  const { reminders, occurrences, remove } = useReminders();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('next');

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = reminders.filter((r) => {
      if (filter === 'active' && r.isPaused) return false;
      if (filter === 'paused' && !r.isPaused) return false;
      return !term || r.title.toLowerCase().includes(term) || r.description.toLowerCase().includes(term);
    });
    return list.sort((a, b) => {
      if (sort === 'alpha') return a.title.localeCompare(b.title);
      if (sort === 'recent') return b.createdAt - a.createdAt;
      return (a.nextOccurrence ?? Infinity) - (b.nextOccurrence ?? Infinity);
    });
  }, [reminders, q, filter, sort]);

  const now = new Date();
  const today = toKey(now);

  return (
    <main className="screen">
      <header className="header"><h1 className="h1">Reminders</h1></header>

      {reminders.length === 0 ? (
        <EmptyState
          emoji="📝"
          title="No reminders yet."
          text="Create your first reminder and stop forgetting the little things."
          actionLabel="+ Add Reminder"
          onAction={() => nav('/edit/new')}
        />
      ) : (
        <>
          <div className="search">
            <Icon name="search" size={20} />
            <input
              type="search"
              placeholder="Search reminders"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search reminders"
            />
          </div>

          <div className="toolbar">
            <div className="seg" role="tablist" aria-label="Filter">
              {(['all', 'active', 'paused'] as Filter[]).map((f) => (
                <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>
                  {f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
              <option value="next">Next occurrence</option>
              <option value="alpha">A–Z</option>
              <option value="recent">Recently created</option>
            </select>
          </div>

          {shown.length === 0 ? (
            <p className="muted center">No reminders match.</p>
          ) : (
            <div className="list">
              {shown.map((r) => (
                <ReminderCard
                  key={r.id}
                  reminder={r}
                  status={statusOn(r, today, occurrences, now)}
                  onOpen={() => nav(`/reminder/${r.id}`)}
                  onEdit={() => nav(`/edit/${r.id}`)}
                  onDelete={() => {
                    if (window.confirm(`Delete "${r.title}"?`)) void remove(r.id);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
