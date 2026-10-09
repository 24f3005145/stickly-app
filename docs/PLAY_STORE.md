# Google Play preparation

## Store listing
**App name:** Stickly: Reminders
**Short description (80):** Simple, offline reminders for the little things you always forget.
**Full description:**
Stickly helps you remember the little things: washing your hair, watering plants, taking your keys, studying, cleaning, exercising.

• Pick the days (e.g. every Wednesday and Friday) and a time
• Real Android notifications that work even when the app is closed
• Mark Done, Snooze or Skip today right from the notification
• All-day reminders that wait quietly in your notification shade
• Today dashboard, schedule view and calendar
• Pause and resume any reminder
• Light and dark themes
• 100% offline: no account, no ads, no tracking. Your reminders stay on your phone.

Note: Android always lets you dismiss or mute notifications. Stickly can quietly restore all-day reminders, but you stay in control.

**Category:** Productivity. **Tags:** reminders, habits, to-do.

## Assets you still need
512×512 icon, 1024×500 feature graphic, 2-8 phone screenshots, privacy-policy URL (host `public/privacy.html` or `docs/PRIVACY.md` on any HTTPS page).

## Permissions and how to justify them
| Permission | Why | Play note |
|---|---|---|
| `POST_NOTIFICATIONS` | Show reminders (Android 13+) | Runtime prompt, asked after onboarding explains why |
| `SCHEDULE_EXACT_ALARM` | Fire at the chosen minute | User-grantable; app falls back to inexact alarms. If Play Console asks, explain: reminders the user schedules for a specific time. Do **not** switch to `USE_EXACT_ALARM` (restricted to alarm/calendar apps) |
| `RECEIVE_BOOT_COMPLETED` | Restore alarms after restart | |
| `INTERNET` | Capacitor default only | Optional: remove after verifying a release build works without it |

Not used: battery-optimization exemption permission (the app only opens Android's settings screen), location, contacts, storage.

## Data safety form
Data collected: **None**. Data shared: **None**. Data processed locally only. No ads, no analytics, no account.

## Compliance checklist
- [ ] Replace `com.example.stickly` with your own unique package ID
- [ ] Privacy policy hosted at a public URL and linked in Play Console
- [ ] Target SDK meets Play's current requirement (check the Play Console "App content" page; Capacitor 7 targets 35)
- [ ] Signed AAB with Play App Signing, keystore backed up
- [ ] Data safety form completed ("no data collected")
- [ ] Content rating questionnaire completed
- [ ] Declare exact-alarm usage if prompted
- [ ] Screenshots on light + dark theme, feature graphic, 512px icon
- [ ] Tested on Android 8, 12, 13, 14+ (see TESTING.md)
- [ ] New personal developer accounts must run a **closed test** (currently 12+ testers for 14 days) before production; verify the current rule in Play Console
