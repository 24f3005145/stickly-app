import { usePermissions } from '../hooks/usePermissions';

/** Shown on Home when reminders can't currently be delivered. */
export function PermissionBanner() {
  const { perms, needsSettings, enableNotifications } = usePermissions();
  if (!perms || perms.notifications) return null;
  return (
    <div className="banner" role="alert">
      <div>
        <strong>Notifications are off</strong>
        <p>Stickly can't remind you until notifications are allowed.</p>
      </div>
      <button className="btn btn--primary btn--sm" onClick={() => void enableNotifications()}>
        {needsSettings ? 'Open Settings' : 'Enable Notifications'}
      </button>
    </div>
  );
}
