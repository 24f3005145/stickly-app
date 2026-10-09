import { App as CapApp } from '@capacitor/app';
import { useCallback, useEffect, useState } from 'react';
import { Stickly } from '../notifications/SticklyPlugin';
import type { PermissionState } from '../types';

export function usePermissions() {
  const [perms, setPerms] = useState<PermissionState | null>(null);
  /** True once we asked and Android won't show the dialog again: send user to Settings. */
  const [needsSettings, setNeedsSettings] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setPerms(await Stickly.getPermissions());
    } catch {
      /* ignore: treat as unknown */
    }
  }, []);

  useEffect(() => {
    void refresh();
    let cancelled = false;
    let remove: (() => void) | undefined;
    void CapApp.addListener('appStateChange', (s) => {
      if (s.isActive) void refresh();
    }).then((h) => {
      if (cancelled) void h.remove();
      else remove = () => void h.remove();
    });
    return () => {
      cancelled = true;
      remove?.();
    };
  }, [refresh]);

  /** Shows the system dialog; if still blocked afterwards, offers the Settings route. */
  const enableNotifications = useCallback(async () => {
    if (needsSettings) {
      await Stickly.openNotificationSettings();
      return;
    }
    const p = await Stickly.requestNotificationPermission();
    setPerms(p);
    if (!p.notifications) setNeedsSettings(true);
  }, [needsSettings]);

  return {
    perms,
    needsSettings,
    refresh,
    enableNotifications,
    openExactAlarmSettings: () => Stickly.openExactAlarmSettings(),
    openBatterySettings: () => Stickly.openBatterySettings(),
  };
}
