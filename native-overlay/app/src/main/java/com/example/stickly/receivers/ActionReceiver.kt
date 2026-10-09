package com.example.stickly.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.example.stickly.Actions
import com.example.stickly.SticklyPrefs
import com.example.stickly.db.AppDatabase
import com.example.stickly.db.OccurrenceEntity
import com.example.stickly.notify.NotificationHelper
import com.example.stickly.scheduler.Scheduler
import java.time.LocalDate

/** Handles Done / Snooze / Skip today buttons and swipe-away of all-day notifications. */
class ActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val pending = goAsync()
        val app = context.applicationContext
        Thread {
            try {
                handle(app, intent)
            } catch (e: Exception) {
                Log.e("Stickly", "ActionReceiver failed", e)
            } finally {
                pending.finish()
            }
        }.start()
    }

    private fun handle(ctx: Context, intent: Intent) {
        val id = intent.getStringExtra(Actions.EXTRA_REMINDER_ID) ?: return
        val date = intent.getStringExtra(Actions.EXTRA_DATE) ?: LocalDate.now().toString()
        val db = AppDatabase.get(ctx)
        val r = db.reminders().get(id) ?: return
        val now = System.currentTimeMillis()

        when (intent.action) {
            Actions.DONE, Actions.SKIP -> {
                val status = if (intent.action == Actions.DONE) "completed" else "skipped"
                db.occurrences().upsert(OccurrenceEntity(id, date, status, null, now))
                Scheduler.cancelSnooze(ctx, r)
                NotificationHelper.cancel(ctx, r)
                Scheduler.scheduleNext(ctx, r)
            }
            Actions.SNOOZE -> {
                val until = Scheduler.scheduleSnooze(ctx, r, date, r.defaultSnoozeDuration)
                db.occurrences().upsert(OccurrenceEntity(id, date, "snoozed", until, now))
                NotificationHelper.cancel(ctx, r)
            }
            Actions.DISMISSED -> {
                // User swiped away an all-day notification: quietly put it back,
                // but only while it is still unresolved and still today.
                val occ = db.occurrences().get(id, date)
                if (r.isAllDay && SticklyPrefs.allDayOngoing(ctx) &&
                    occ?.status == "active" && date == LocalDate.now().toString()
                ) {
                    NotificationHelper.show(ctx, r, date)
                }
            }
        }
    }
}
