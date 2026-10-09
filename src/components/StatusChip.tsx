import type { DisplayStatus } from '../types';

const LABEL: Record<DisplayStatus, string> = {
  upcoming: 'Upcoming',
  active: 'Not completed',
  completed: 'Completed ✓',
  skipped: 'Skipped',
  snoozed: 'Snoozed',
  paused: 'Paused',
};

export function StatusChip({ status, label }: { status: DisplayStatus; label?: string }) {
  return <span className={`chip chip--${status}`}>{label ?? LABEL[status]}</span>;
}
