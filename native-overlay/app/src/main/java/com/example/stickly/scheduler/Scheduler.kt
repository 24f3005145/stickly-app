package com.example.stickly.scheduler

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.example.stickly.Actions
import com.example.stickly.db.AppDatabase
import com.example.stickly.db.ReminderEntity
import com.example.stickly.notify.NotificationHelper
import com.example.stickly.receivers.AlarmReceiver
import java.time.LocalDate
import java.time.ZonedDateTime

/**
 * Owns all AlarmManager work. One "fire" alarm and at most one "snooze" alarm
 * per reminder; request codes are derived from the reminder's notificationId,
 * so rescheduling replaces the old alarm (no duplicates).
 * Blocking: call from a background thread.
 */
object Scheduler {

    fun canScheduleExact(ctx: Context): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
            ctx.getSystemService(AlarmManager::class.java).canScheduleExactAlarms()

    private fun pending(
        ctx: Context, r: ReminderEntity, action: String, requestCode: Int, date: String? = null,
    ): PendingIntent {
        val intent = Intent(ctx, AlarmReceiver::class.java).apply {
            this.action = action
            putExtra(Actions.EXTRA_REMINDER_ID, r.id)
            if (date != null) putExtra(Actions.EXTRA_DATE, date)
        }
        return PendingIntent.getBroadcast(
            ctx, requestCode, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun firePi(ctx: Context, r: ReminderEntity) =
        pending(ctx, r, Actions.FIRE, r.notificationId)

    private fun snoozePi(ctx: Context, r: ReminderEntity, date: String) =
        pending(ctx, r, Actions.SNOOZE_FIRE, r.notificationId + 1_000_000, date)

    private fun setAlarm(ctx: Context, triggerAtMillis: Long, pi: PendingIntent) {
        val am = ctx.getSystemService(AlarmManager::class.java)
        try {
            if (canScheduleExact(ctx)) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi)
            } else {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi)
            }
        } catch (_: SecurityException) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi)
        }
    }

    private fun suppressedDates(ctx: Context, r: ReminderEntity): (LocalDate) -> Boolean {
        val dao = AppDatabase.get(ctx).occurrences()
        return { date ->
            val s = dao.get(r.id, date.toString())?.status
            s == "completed" || s == "skipped"
        }
    }

    /** Computes + schedules the next occurrence, persists it, returns the updated reminder. */
    fun scheduleNext(ctx: Context, r: ReminderEntity): ReminderEntity {
        val am = ctx.getSystemService(AlarmManager::class.java)
        am.cancel(firePi(ctx, r))

        val next = if (r.isPaused) null
        else NextOccurrence.next(r, ZonedDateTime.now(), suppressedDates(ctx, r))
        val millis = next?.toInstant()?.toEpochMilli()
        if (millis != null) setAlarm(ctx, millis, firePi(ctx, r))

        val updated = r.copy(nextOccurrence = millis)
        AppDatabase.get(ctx).reminders().upsert(updated)
        return updated
    }

    /** Cancels both alarms and any visible notification. */
    fun cancelAll(ctx: Context, r: ReminderEntity) {
        val am = ctx.getSystemService(AlarmManager::class.java)
        am.cancel(firePi(ctx, r))
        am.cancel(snoozePi(ctx, r, ""))
        NotificationHelper.cancel(ctx, r)
    }

    fun cancelSnooze(ctx: Context, r: ReminderEntity) {
        ctx.getSystemService(AlarmManager::class.java).cancel(snoozePi(ctx, r, ""))
    }

    /** Returns the epoch millis the snooze will fire at. */
    fun scheduleSnooze(ctx: Context, r: ReminderEntity, date: String, option: String): Long {
        val now = ZonedDateTime.now()
        val at = when (option) {
            "10m" -> now.plusMinutes(10)
            "1h" -> now.plusHours(1)
            "tomorrow" -> {
                val t = NextOccurrence.parseTime(r.time)
                if (t != null) ZonedDateTime.of(now.toLocalDate().plusDays(1), t, now.zone)
                else now.plusDays(1)
            }
            else -> now.plusMinutes(30)
        }
        val millis = at.toInstant().toEpochMilli()
        setAlarm(ctx, millis, snoozePi(ctx, r, date))
        return millis
    }

    /** Boot, timezone/time change, app update, and app open. Safe to call repeatedly. */
    fun rescheduleAll(ctx: Context) {
        val db = AppDatabase.get(ctx)
        val now = System.currentTimeMillis()

        db.reminders().getAll().forEach { scheduleNext(ctx, it) }

        db.occurrences().prune(LocalDate.now().minusDays(60).toString())

        db.occurrences().getSnoozed().forEach { o ->
            val r = db.reminders().get(o.reminderId) ?: return@forEach
            if (r.isPaused) return@forEach
            val until = o.snoozedUntil ?: return@forEach
            if (until > now) {
                setAlarm(ctx, until, snoozePi(ctx, r, o.date))
            } else {
                // Snooze elapsed while the device was off.
                NotificationHelper.show(ctx, r, o.date)
                db.occurrences().upsert(o.copy(status = "active", snoozedUntil = null, updatedAt = now))
            }
        }
    }
}
