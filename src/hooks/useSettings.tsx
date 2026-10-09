import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Stickly } from '../notifications/SticklyPlugin';
import { loadSettings, saveSettings } from '../storage/settingsStorage';
import { DEFAULT_SETTINGS, type Settings } from '../types';

interface Ctx {
  settings: Settings;
  update: (patch: Partial<Settings>) => Promise<void>;
}
const SettingsContext = createContext<Ctx | null>(null);

function applyTheme(theme: Settings['theme']): void {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

async function syncNative(s: Settings): Promise<void> {
  try {
    await Stickly.setSettings({
      notificationsEnabled: s.notificationsEnabled,
      sound: s.sound,
      vibration: s.vibration,
      allDayOngoing: s.allDayOngoing,
      defaultSnooze: s.defaultSnooze,
    });
  } catch (e) {
    console.warn('Could not sync settings to native', e);
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    void loadSettings().then((s) => {
      setSettings(s);
      applyTheme(s.theme);
      void syncNative(s);
    });
  }, []);

  useEffect(() => {
    if (settings.theme !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [settings.theme]);

  const update = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      applyTheme(next.theme);
      await saveSettings(next);
      await syncNative(next);
    },
    [settings],
  );

  return <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
