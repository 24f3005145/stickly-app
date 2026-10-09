import { registerPlugin } from '@capacitor/core';
import type { Occurrence, PermissionState, Reminder, ReminderInput, Settings } from '../types';

export type NativeSettings = Pick<
  Settings,
  'notificationsEnabled' | 'sound' | 'vibration' | 'allDayOngoing' | 'defaultSnooze'
>;

/** Typed bridge to SticklyPlugin.kt. */
export interface SticklyPluginApi {
  getReminders(): Promise<{ reminders: Reminder[] }>;
  saveReminder(options: { reminder: ReminderInput }): Promise<{ reminder: Reminder }>;
  deleteReminder(options: { id: string }): Promise<void>;
  setPaused(options: { id: string; paused: boolean }): Promise<{ reminder: Reminder }>;
  markOccurrence(options: {
    id: string;
    date: string;
    status: 'completed' | 'skipped' | 'reset';
  }): Promise<{ reminder: Reminder }>;
  getOccurrences(options: { from: string; to: string }): Promise<{ occurrences: Occurrence[] }>;
  rescheduleAll(): Promise<void>;
  setSettings(options: NativeSettings): Promise<void>;
  getPermissions(): Promise<PermissionState>;
  requestNotificationPermission(): Promise<PermissionState>;
  openNotificationSettings(): Promise<void>;
  openExactAlarmSettings(): Promise<void>;
  openBatterySettings(): Promise<void>;
}

export const Stickly = registerPlugin<SticklyPluginApi>('Stickly', {
  web: () => import('./web').then((m) => new m.SticklyWeb()),
});
