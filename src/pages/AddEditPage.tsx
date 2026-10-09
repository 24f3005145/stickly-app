import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DayPicker } from '../components/DayPicker';
import { IconPicker } from '../components/IconPicker';
import { Icon } from '../components/Icons';
import { Toggle } from '../components/Toggle';
import { usePermissions } from '../hooks/usePermissions';
import { useReminders } from '../hooks/useReminders';
import { useSettings } from '../hooks/useSettings';
import type { Reminder, ReminderInput, ScheduleType, SnoozeOption } from '../types';
import { ordinal, toKey } from '../utils/date';

const SCHEDULES: { key: ScheduleType; label: string }[] = [
  { key: 'once', label: 'Once' },
  { key: 'daily', label: 'Every day' },
  { key: 'weekly', label: 'Days of week' },
  { key: 'monthly', label: 'Monthly' },
];
const SNOOZES: { key: SnoozeOption; label: string }[] = [
  { key: '10m', label: '10 min' },
  { key: '30m', label: '30 min' },
  { key: '1h', label: '1 hour' },
  { key: 'tomorrow', label: 'Tomorrow' },
];

const blank = (snooze: SnoozeOption): ReminderInput => ({
  title: '',
  description: '',
  icon: 'general',
  scheduleType: 'daily',
  selectedDays: [],
  time: '09:00',
  onceDate: toKey(new Date()),
  dayOfMonth: new Date().getDate(),
  isAllDay: false,
  isPaused: false,
  defaultSnoozeDuration: snooze,
});

const toInput = (r: Reminder): ReminderInput => ({
  id: r.id,
  title: r.title,
  description: r.description,
  icon: r.icon,
  scheduleType: r.scheduleType === 'custom' ? 'weekly' : r.scheduleType,
  selectedDays: r.selectedDays,
  time: r.time,
  onceDate: r.onceDate ?? toKey(new Date()),
  dayOfMonth: r.dayOfMonth ?? new Date().getDate(),
  isAllDay: r.isAllDay,
  isPaused: r.isPaused,
  defaultSnoozeDuration: r.defaultSnoozeDuration,
});

export default function AddEditPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const nav = useNavigate();
  const { reminders, save } = useReminders();
  const { settings } = useSettings();
  const { perms, enableNotifications } = usePermissions();

  const [form, setForm] = useState<ReminderInput>(() => blank(settings.defaultSnooze));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const loaded = useRef(false);

  // Load the reminder being edited once it is available.
  useEffect(() => {
    if (isNew || loaded.current) return;
    const existing = reminders.find((r) => r.id === id);
    if (existing) {
      setForm(toInput(existing));
      loaded.current = true;
    }
  }, [isNew, id, reminders]);

  const set = <K extends keyof ReminderInput>(k: K, v: ReminderInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Please give your reminder a title.';
    if (form.scheduleType === 'weekly' && form.selectedDays.length === 0) return 'Pick at least one day.';
    if (form.scheduleType === 'once') {
      if (!form.onceDate) return 'Pick a date.';
      const [h, m] = form.time.split(':').map(Number);
      const [yy, mm, dd] = form.onceDate.split('-').map(Number);
      if (new Date(yy, mm - 1, dd, h, m).getTime() <= Date.now()) return 'That date and time has already passed.';
    }
    return null;
  };

  const onSave = async () => {
    const problem = validate();
    if (problem) return setError(problem);
    setSaving(true);
    setError(null);
    try {
      await save({ ...form, title: form.title.trim(), description: form.description.trim() });
      // Permission was explained during onboarding; ask now if it's still missing.
      if (perms && !perms.notifications) await enableNotifications();
      nav(-1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this reminder.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="screen screen--form">
      <div className="topbar">
        <button className="icon-btn" aria-label="Close" onClick={() => nav(-1)}><Icon name="back" /></button>
        <h1 className="h3">{isNew ? 'New reminder' : 'Edit reminder'}</h1>
        <span style={{ width: 44 }} />
      </div>

      <label className="field">
        <span className="field__label">Reminder title</span>
        <input className="input input--big" placeholder="Wash Hair" value={form.title} maxLength={80}
          onChange={(e) => set('title', e.target.value)} />
      </label>

      <label className="field">
        <span className="field__label">Description <em>(optional)</em></span>
        <textarea className="input" rows={2} placeholder="Don't forget to use shampoo." value={form.description}
          onChange={(e) => set('description', e.target.value)} />
      </label>

      <div className="field">
        <span className="field__label">Icon <em>(optional)</em></span>
        <IconPicker value={form.icon} onChange={(k) => set('icon', k)} />
      </div>

      <div className="field">
        <span className="field__label">Repeat</span>
        <div className="seg seg--scroll" role="tablist">
          {SCHEDULES.map((s) => (
            <button key={s.key} role="tab" aria-selected={form.scheduleType === s.key}
              className={form.scheduleType === s.key ? 'is-on' : ''} onClick={() => set('scheduleType', s.key)}>
              {s.label}
            </button>
          ))}
        </div>

        {form.scheduleType === 'weekly' && (
          <DayPicker value={form.selectedDays} onChange={(v) => set('selectedDays', v)} />
        )}
        {form.scheduleType === 'once' && (
          <input className="input" type="date" min={toKey(new Date())} value={form.onceDate ?? ''}
            onChange={(e) => set('onceDate', e.target.value)} />
        )}
        {form.scheduleType === 'monthly' && (
          <label className="inline">
            On the
            <select className="select" value={form.dayOfMonth ?? 1} onChange={(e) => set('dayOfMonth', Number(e.target.value))}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{ordinal(d)}</option>)}
            </select>
            of each month
          </label>
        )}
      </div>

      <label className="field">
        <span className="field__label">Time</span>
        <input className="input input--time" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
      </label>

      <div className="card">
        <Toggle
          checked={form.isAllDay}
          onChange={(v) => set('isAllDay', v)}
          label="All-day reminder"
          hint="Keeps the notification in your shade for the day. Android lets you swipe it away; Stickly quietly puts it back, but you stay in control."
        />
      </div>

      <div className="field">
        <span className="field__label">Snooze for</span>
        <div className="seg seg--scroll" role="tablist">
          {SNOOZES.map((s) => (
            <button key={s.key} role="tab" aria-selected={form.defaultSnoozeDuration === s.key}
              className={form.defaultSnoozeDuration === s.key ? 'is-on' : ''} onClick={() => set('defaultSnoozeDuration', s.key)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <button className="btn btn--primary btn--block btn--lg" disabled={saving} onClick={() => void onSave()}>
        {saving ? 'Saving…' : isNew ? 'Create reminder' : 'Save changes'}
      </button>
    </main>
  );
}
