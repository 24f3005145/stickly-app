import { Toggle } from '../components/Toggle';
import { usePermissions } from '../hooks/usePermissions';
import { useSettings } from '../hooks/useSettings';
import type { SnoozeOption } from '../types';

const SNOOZES: { key: SnoozeOption; label: string }[] = [
  { key: '10m', label: '10 minutes' },
  { key: '30m', label: '30 minutes' },
  { key: '1h', label: '1 hour' },
  { key: 'tomorrow', label: 'Tomorrow' },
];

function Row({ title, ok, text, action, onAction }: {
  title: string; ok: boolean; text: string; action?: string; onAction?: () => void;
}) {
  return (
    <div className="perm">
      <div>
        <div className="perm__title">{title} <span className={`dot ${ok ? 'dot--ok' : 'dot--bad'}`} aria-label={ok ? 'OK' : 'Needs attention'} /></div>
        <p className="perm__text">{text}</p>
      </div>
      {!ok && action && onAction && <button className="btn btn--primary btn--sm" onClick={onAction}>{action}</button>}
    </div>
  );
}

export default function SettingsPage() {
  const { settings, update } = useSettings();
  const { perms, needsSettings, enableNotifications, openExactAlarmSettings, openBatterySettings } = usePermissions();

  return (
    <main className="screen">
      <header className="header"><h1 className="h1">Settings</h1></header>

      <h2 className="h2">Notifications</h2>
      <div className="card group">
        <Toggle label="Notifications enabled" checked={settings.notificationsEnabled} onChange={(v) => void update({ notificationsEnabled: v })} />
        <Toggle label="Sound" checked={settings.sound} onChange={(v) => void update({ sound: v })} />
        <Toggle label="Vibration" checked={settings.vibration} onChange={(v) => void update({ vibration: v })} />
        <Toggle label="All-day reminders stay in the shade" hint="Ongoing, silent notification that Stickly restores if swiped away." checked={settings.allDayOngoing} onChange={(v) => void update({ allDayOngoing: v })} />
      </div>

      <h2 className="h2">Default snooze</h2>
      <div className="seg seg--scroll" role="tablist">
        {SNOOZES.map((s) => (
          <button key={s.key} role="tab" aria-selected={settings.defaultSnooze === s.key}
            className={settings.defaultSnooze === s.key ? 'is-on' : ''} onClick={() => void update({ defaultSnooze: s.key })}>
            {s.label}
          </button>
        ))}
      </div>
      <p className="muted small">Used for new reminders. Each reminder can override it.</p>

      <h2 className="h2">Appearance</h2>
      <div className="seg" role="tablist">
        {(['system', 'light', 'dark'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={settings.theme === t} className={settings.theme === t ? 'is-on' : ''} onClick={() => void update({ theme: t })}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <h2 className="h2">Android permissions</h2>
      <div className="card group">
        <Row
          title="Notifications"
          ok={!!perms?.notifications}
          text={perms?.notifications ? 'Allowed.' : 'Blocked. Reminders can\u2019t appear until you allow them.'}
          action={needsSettings ? 'Open Settings' : 'Enable Notifications'}
          onAction={() => void enableNotifications()}
        />
        <Row
          title="Exact timing"
          ok={!!perms?.exactAlarms}
          text={perms?.exactAlarms ? 'Reminders fire at the exact minute.' : 'Not allowed. Reminders still work but Android may delay them by a few minutes.'}
          action="Allow"
          onAction={() => void openExactAlarmSettings()}
        />
        <Row
          title="Battery"
          ok={!!perms?.batteryUnrestricted}
          text={perms?.batteryUnrestricted ? 'Unrestricted.' : 'Some phones (Xiaomi, Samsung, Huawei, OnePlus) stop background apps to save power. If reminders arrive late, exempt Stickly.'}
          action="Open battery settings"
          onAction={() => void openBatterySettings()}
        />
      </div>

      <h2 className="h2">Good to know</h2>
      <div className="card prose">
        <p>Android lets you swipe away or mute any notification, and Stickly respects that. For all-day reminders it keeps a quiet notification in your shade and restores it if you swipe it away, but it can't make it impossible to dismiss.</p>
        <p>Your reminders are stored only on this phone. Stickly has no account, no server and no analytics.</p>
      </div>
      <p className="muted small center">Stickly 1.0.0</p>
    </main>
  );
}
