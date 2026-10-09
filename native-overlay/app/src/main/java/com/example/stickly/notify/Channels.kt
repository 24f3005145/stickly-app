package com.example.stickly.notify

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

/**
 * Android freezes a channel's sound/vibration after creation, so each
 * sound/vibration combination gets its own channel id. Channels are
 * (re)created on every post, so a channel the user deleted comes back.
 */
object Channels {
    const val ALL_DAY = "stickly_all_day_v1"

    fun idFor(sound: Boolean, vibration: Boolean, allDay: Boolean): String =
        if (allDay) ALL_DAY
        else "stickly_reminders_${if (sound) "s" else "m"}${if (vibration) "v" else "n"}"

    fun ensure(ctx: Context, sound: Boolean, vibration: Boolean, allDay: Boolean): String {
        val id = idFor(sound, vibration, allDay)
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return id

        val nm = ctx.getSystemService(NotificationManager::class.java)
        if (nm.getNotificationChannel(id) != null) return id

        val channel = if (allDay) {
            NotificationChannel(id, "All-day reminders", NotificationManager.IMPORTANCE_LOW).apply {
                description = "Quiet reminders that stay in your notification shade for the day."
                setSound(null, null)
                enableVibration(false)
            }
        } else {
            NotificationChannel(id, "Reminders", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Your scheduled reminders."
                if (!sound) setSound(null, null)
                enableVibration(vibration)
            }
        }
        nm.createNotificationChannel(channel)
        return id
    }
}
