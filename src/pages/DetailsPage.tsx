import { useNavigate, useParams } from 'react-router-dom';
import { emojiFor } from '../components/IconPicker';
import { Icon } from '../components/Icons';
import { StatusChip } from '../components/StatusChip';
import { Toggle } from '../components/Toggle';
import { useReminders } from '../hooks/useReminders';
import { occursOn } from '../scheduler/nextOccurrence';
import { statusOn } from '../services/reminderService';
import { formatNext, formatSchedule, formatTime, toKey } from '../utils/date';

export default function DetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { reminders, occurrences, mark, setPaused, remove } = useReminders();
  const r = reminders.find((x) => x.id === id);

  if (!r) {
    return (
      <main className="screen">
        <button className="icon-btn" aria-label="Back" onClick={() => nav(-1)}><Icon name="back" /></button>
        <p className="muted center">This reminder no longer exists.</p>
      </main>
    );
  }

  const now = new Date();
  const today = toKey(now);
  const dueToday = occursOn(r, now);
  const status = statusOn(r, today, occurrences, now);

  return (
    <main className="screen">
      <div className="topbar">
        <button className="icon-btn" aria-label="Back" onClick={() => nav(-1)}><Icon name="back" /></button>
        <button className="icon-btn" aria-label="Edit" onClick={() => nav(`/edit/${r.id}`)}><Icon name="edit" /></button>
      </div>

      <div className="hero">
        <span className="hero__icon" aria-hidden="true">{emojiFor(r.icon)}</span>
        <h1 className="h1">{r.title}</h1>
        {r.description && <p className="hero__desc">{r.description}</p>}
      </div>

      <dl className="card facts">
        <div><dt>Schedule</dt><dd>{formatSchedule(r)}</dd></div>
        <div><dt>Notification time</dt><dd>{formatTime(r.time)}{r.isAllDay ? ' · stays all day' : ''}</dd></div>
        <div><dt>Next occurrence</dt><dd>{r.isPaused ? 'Paused' : formatNext(r.nextOccurrence)}</dd></div>
        <div><dt>Status today</dt><dd>{dueToday || r.isPaused ? <StatusChip status={status} /> : 'Not scheduled today'}</dd></div>
      </dl>

      <div className="card">
        <Toggle
          checked={!r.isPaused}
          onChange={(on) => void setPaused(r.id, !on)}
          label={r.isPaused ? 'Paused' : 'Active'}
          hint={r.isPaused ? 'No notifications until you resume.' : 'Notifications are on for this reminder.'}
        />
      </div>

      <div className="stack">
        {dueToday && !r.isPaused && (
          <button
            className={`btn btn--block ${status === 'completed' ? 'btn--ghost' : 'btn--done'}`}
            onClick={() => void mark(r.id, today, status === 'completed' ? 'reset' : 'completed')}
          >
            {status === 'completed' ? 'Undo completed' : 'Mark completed'}
          </button>
        )}
        {dueToday && !r.isPaused && status !== 'skipped' && status !== 'completed' && (
          <button className="btn btn--ghost btn--block" onClick={() => void mark(r.id, today, 'skipped')}>
            Skip today
          </button>
        )}
        <button
          className="btn btn--danger btn--block"
          onClick={async () => {
            if (window.confirm(`Delete "${r.title}"?`)) {
              await remove(r.id);
              nav('/reminders', { replace: true });
            }
          }}
        >
          Delete reminder
        </button>
      </div>
    </main>
  );
}
