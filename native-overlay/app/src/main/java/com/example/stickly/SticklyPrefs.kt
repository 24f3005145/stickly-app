package com.example.stickly

import android.content.Context
import android.content.SharedPreferences

/**
 * Native copy of the settings that background receivers need
 * (they run without the WebView). The UI pushes changes via the plugin.
 */
object SticklyPrefs {
    private fun p(ctx: Context): SharedPreferences =
        ctx.applicationContext.getSharedPreferences("stickly_prefs", Context.MODE_PRIVATE)

    fun notificationsEnabled(ctx: Context) = p(ctx).getBoolean("notifications_enabled", true)
    fun sound(ctx: Context) = p(ctx).getBoolean("sound", true)
    fun vibration(ctx: Context) = p(ctx).getBoolean("vibration", true)
    fun allDayOngoing(ctx: Context) = p(ctx).getBoolean("all_day_ongoing", true)
    fun defaultSnooze(ctx: Context) = p(ctx).getString("default_snooze", "30m") ?: "30m"

    fun save(
        ctx: Context,
        notificationsEnabled: Boolean,
        sound: Boolean,
        vibration: Boolean,
        allDayOngoing: Boolean,
        defaultSnooze: String,
    ) {
        p(ctx).edit()
            .putBoolean("notifications_enabled", notificationsEnabled)
            .putBoolean("sound", sound)
            .putBoolean("vibration", vibration)
            .putBoolean("all_day_ongoing", allDayOngoing)
            .putString("default_snooze", defaultSnooze)
            .apply()
    }

    /** Unique, stable int per reminder (used for notification id + alarm request code). */
    @Synchronized
    fun nextNotificationId(ctx: Context): Int {
        val sp = p(ctx)
        val next = sp.getInt("id_counter", 100) + 1
        sp.edit().putInt("id_counter", next).apply()
        return next
    }
}
