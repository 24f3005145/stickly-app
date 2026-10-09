package com.example.stickly.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.example.stickly.Actions
import com.example.stickly.db.AppDatabase
import com.example.stickly.db.OccurrenceEntity
import com.example.stickly.notify.NotificationHelper
import com.example.stickly.scheduler.Scheduler
import java.time.LocalDate

/** Fires when a scheduled (or snoozed) alarm goes off, even if the app is closed. */
class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val pending = goAsync()
        val app = context.applicationContext
        Thread {
            try {
                handle(app, intent)
            } catch (e: Exception) {
                Log.e("Stickly", "AlarmReceiver failed", e)
            } finally {
                pending.finish()
            }
        }.start()
    }

    private fun handle(ctx: Context, intent: Intent) {
        val id = intent.getStringExtra(Actions.EXTRA_REMINDER_ID) ?: return
        val db = AppDatabase.get(ctx)
        val r = db.reminders().get(id) ?: return
        val now = System.currentTimeMillis()

        when (intent.action) {
            Actions.FIRE -> {
                val today = LocalDate.now().toString()
                val status = db.occurrences().get(id, today)?.status
                if (!r.isPaused && status != "completed" && status != "skipped") {
                    db.occurrences().upsert(OccurrenceEntity(id, today, "active", null, now))
                    NotificationHelper.show(ctx, r, today)
                }
                Scheduler.scheduleNext(ctx, r) // always chain the next occurrence
            }
            Actions.SNOOZE_FIRE -> {
                val date = intent.getStringExtra(Actions.EXTRA_DATE) ?: LocalDate.now().toString()
                val occ = db.occurrences().get(id, date)
                if (!r.isPaused && occ?.status == "snoozed") {
                    db.occurrences().upsert(occ.copy(status = "active", snoozedUntil = null, updatedAt = now))
                    NotificationHelper.show(ctx, r, date)
                }
            }
        }
    }
}
