/**
 * Shared types. These mirror the Kotlin Room entities.
 * Weekdays use ISO numbering (1 = Monday ... 7 = Sunday),
 * identical to java.time.DayOfWeek.getValue().
 */

export type ScheduleType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

/** 1 = Mon ... 7 = Sun */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type SnoozeOption = '10m' | '30m' | '1h' | 'tomorrow';

export type OccurrenceStatus =
  | 'upcoming'
  | 'active'
  | 'completed'
  | 'skipped'
  | 'snoozed';

export type IconKey =
  | 'personal'
  | 'water'
  | 'study'
  | 'exercise'
  | 'cleaning'
  | 'plants'
  | 'health'
  | 'shopping'
  | 'home'
  | 'general';

export interface Reminder {
  id: string;
  title: string;
  description: string;
  icon: IconKey;
  scheduleType: ScheduleType;
  /** Used by 'weekly' and 'custom' (ISO weekdays). */
  selectedDays: Weekday[];
  /** 'HH:mm' local wall-clock time. */
  time: string;
  /** 'once' only: 'YYYY-MM-DD'. */
  onceDate?: string;
  /** 'monthly' only: 1-31 (clamped to month length). */
  dayOfMonth?: number;
  isAllDay: boolean;
  isPaused: boolean;
  createdAt: number;
  updatedAt: number;
  /** Epoch millis of next occurrence, or null if none. */
  nextOccurrence: number | null;
  /** Stable int used for the notification and alarm request code. */
  notificationId: number;
  defaultSnoozeDuration: SnoozeOption;
}

/** Input when creating/editing; native assigns id, timestamps, notificationId. */
export type ReminderInput = Omit<
  Reminder,
  'id' | 'createdAt' | 'updatedAt' | 'nextOccurrence' | 'notificationId'
> & { id?: string };

export interface Occurrence {
  reminderId: string;
  /** 'YYYY-MM-DD' local date this occurrence belongs to. */
  date: string;
  status: OccurrenceStatus;
  /** Epoch millis the occurrence is snoozed until, if snoozed. */
  snoozedUntil?: number;
  updatedAt: number;
}

export interface Settings {
  notificationsEnabled: boolean;
  sound: boolean;
  vibration: boolean;
  allDayOngoing: boolean;
  defaultSnooze: SnoozeOption;
  theme: 'system' | 'light' | 'dark';
}

export const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: true,
  sound: true,
  vibration: true,
  allDayOngoing: true,
  defaultSnooze: '30m',
  theme: 'system',
};

export interface PermissionState {
  /** POST_NOTIFICATIONS (Android 13+); true on older versions. */
  notifications: boolean;
  /** Can schedule exact alarms (Android 12+). */
  exactAlarms: boolean;
  /** App is exempt from battery optimization. */
  batteryUnrestricted: boolean;
}

/** What a card/row shows: an occurrence status, or 'paused' for paused reminders. */
export type DisplayStatus = OccurrenceStatus | 'paused';
