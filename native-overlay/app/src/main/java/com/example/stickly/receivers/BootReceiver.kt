package com.example.stickly.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.example.stickly.scheduler.Scheduler

/** Restores all alarms after reboot, time/timezone change, app update, or exact-alarm permission change. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val pending = goAsync()
        val app = context.applicationContext
        Thread {
            try {
                Scheduler.rescheduleAll(app)
            } catch (e: Exception) {
                Log.e("Stickly", "Reschedule failed for ${intent.action}", e)
            } finally {
                pending.finish()
            }
        }.start()
    }
}
