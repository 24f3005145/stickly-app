# Testing checklist (use a real phone; emulators are less reliable for alarms)

Tip: use reminders a few minutes in the future and "Once" or a day/time near now.

1. [ ] Create a **daily** reminder for 2 minutes from now.
2. [ ] Create a **Wednesday/Friday** reminder; check it shows "Every Wed & Fri" and the right Next date.
3. [ ] **Close the app** (swipe from recents).
4. [ ] **Wait**: the notification appears at the scheduled time with Done / Snooze / Skip today.
5. [ ] Tap **Done**: notification disappears; open app, card shows Completed ✓, next occurrence is the following day.
6. [ ] Verify the notification **disappears** and doesn't return.
7. [ ] Next reminder: tap **Snooze**; it reappears after the snooze time (use 10 min).
8. [ ] Next reminder: tap **Skip today**; no further notification today; shows Skipped; next occurrence is correct.
9. [ ] **Restart the phone** (don't open Stickly).
10. [ ] Verify future reminders still fire after reboot.
11. [ ] **Disable** notification permission in Android settings; open Stickly: banner shows "Notifications are off".
12. [ ] **Re-enable** it via the Enable Notifications / Open Settings button; banner disappears; reminders fire again.
13. [ ] **Change timezone** (or set clock +1h): reminders still fire at the same local wall-clock time.
14. [ ] **Pause** a reminder: no notification fires; a visible notification is removed.
15. [ ] **Resume**: Next occurrence returns; it fires.
16. [ ] **Delete** a reminder: no notification fires; it's gone after restart.
17. [ ] Create **several reminders at different times**; each fires once, no duplicates.

Extra:
- [ ] All-day reminder: stays in shade; swipe it away, it returns; it disappears at midnight.
- [ ] Android 13+: onboarding "Turn on reminders" shows the system permission dialog.
- [ ] Android 14+: Settings > Exact timing shows "Allow"; reminders still fire (maybe a few minutes late) without it.
- [ ] Edit a reminder's time: old alarm doesn't fire.
- [ ] Uninstall/reinstall: app opens without crashing.
- [ ] Dark and light themes; font size set to Large.
