import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { PermissionBanner } from '../components/PermissionBanner';
import { ReminderCard } from '../components/ReminderCard';
import { useReminders } from '../hooks/useReminders';
import { occursOn } from '../scheduler/nextOccurrence';
import { statusOn } from '../services/reminderService';
import { greeting, toKey } from '../utils/date';

export default function Home() {
  const { reminders, occurrences, loading, error, mark, remove } = useReminders();
  const nav = useNavigate();
  const now = new Date();
  const today = toKey(now);

  const todays = reminders
    .filter((r) => !r.isPaused && occursOn(r, now))
    .sort((a, b) => a.time.localeCompare(b.time));
  const doneCount = todays.filter((r) => statusOn(r, today, occurrences, now) === 'completed').length;

  const onDelete = async (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"?`)) await remove(id);
  };

  return (
    <main className="screen">
      <header className="header">
        <p className="eyebrow">{now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="h1">{greeting(now)}</h1>
      </header>

      <PermissionBanner />
      {error && <div className="banner banner--error" role="alert">{error}</div>}

      {!loading && reminders.length === 0 ? (
        <EmptyState
          emoji="📝"
          title="No reminders yet."
          text="Create your first reminder and stop forgetting the little things."
          actionLabel="+ Add Reminder"
          onAction={() => nav('/edit/new')}
        />
      ) : (
        <>
          <div className="section-head">
            <h2 className="h2">Today's reminders</h2>
            {todays.length > 0 && <span className="muted">{doneCount} of {todays.length} done</span>}
          </div>
          {todays.length === 0 ? (
            <div className="card calm">
              <span aria-hidden="true">🌤️</span>
              <p>Nothing to do today. Enjoy it!</p>
            </div>
          ) : (
            <div className="list">
              {todays.map((r) => {
                const status = statusOn(r, today, occurrences, now);
                const o = occurrences.get(`${r.id}|${today}`);
                const label =
                  status === 'snoozed' && o?.snoozedUntil
                    ? `Snoozed until ${new Date(o.snoozedUntil).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                    : undefined;
                return (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    status={status}
                    statusLabel={label}
                    onOpen={() => nav(`/reminder/${r.id}`)}
                    onToggleDone={() => void mark(r.id, today, status === 'completed' ? 'reset' : 'completed')}
                    onEdit={() => nav(`/edit/${r.id}`)}
                    onDelete={() => void onDelete(r.id, r.title)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
}
