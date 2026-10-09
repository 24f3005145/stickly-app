import type { DisplayStatus, Reminder } from '../types';
import { formatNext, formatSchedule, formatTime } from '../utils/date';
import { emojiFor } from './IconPicker';
import { Icon } from './Icons';
import { StatusChip } from './StatusChip';

interface Props {
  reminder: Reminder;
  status: DisplayStatus;
  statusLabel?: string;
  onOpen: () => void;
  onToggleDone?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ReminderCard({ reminder: r, status, statusLabel, onOpen, onToggleDone, onEdit, onDelete }: Props) {
  const done = status === 'completed';
  return (
    <article className={`card rc rc--${status}`}>
      <button className="rc__main" onClick={onOpen}>
        <span className="rc__icon" aria-hidden="true">{emojiFor(r.icon)}</span>
        <span className="rc__body">
          <span className="rc__title">{r.title}</span>
          <span className="rc__meta">{formatSchedule(r)} · {formatTime(r.time)}{r.isAllDay ? ' · All day' : ''}</span>
          {r.description && <span className="rc__desc">{r.description}</span>}
        </span>
      </button>

      <div className="rc__status">
        <StatusChip status={status} label={statusLabel} />
        <span className="rc__next">Next: {r.isPaused ? 'Paused' : formatNext(r.nextOccurrence)}</span>
      </div>

      <div className="rc__actions">
        {onToggleDone && (
          <button className={`btn ${done ? 'btn--ghost' : 'btn--done'}`} onClick={onToggleDone}>
            {done ? 'Undo' : <><Icon name="check" size={18} /> Done</>}
          </button>
        )}
        <span className="grow" />
        {onEdit && (
          <button className="icon-btn" aria-label={`Edit ${r.title}`} onClick={onEdit}>
            <Icon name="edit" size={20} />
          </button>
        )}
        {onDelete && (
          <button className="icon-btn icon-btn--danger" aria-label={`Delete ${r.title}`} onClick={onDelete}>
            <Icon name="delete" size={20} />
          </button>
        )}
      </div>
    </article>
  );
}
