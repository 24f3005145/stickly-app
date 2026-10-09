import { Preferences } from '@capacitor/preferences';
import { DEFAULT_SETTINGS, type Settings } from '../types';

const SETTINGS_KEY = 'settings';
const ONBOARDED_KEY = 'onboarded';

export async function loadSettings(): Promise<Settings> {
  try {
    const { value } = await Preferences.get({ key: SETTINGS_KEY });
    return value ? { ...DEFAULT_SETTINGS, ...(JSON.parse(value) as Partial<Settings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS; // corrupted/old data: fall back, never crash
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(settings) });
}

export async function isOnboarded(): Promise<boolean> {
  const { value } = await Preferences.get({ key: ONBOARDED_KEY });
  return value === '1';
}

export async function setOnboarded(): Promise<void> {
  await Preferences.set({ key: ONBOARDED_KEY, value: '1' });
}
