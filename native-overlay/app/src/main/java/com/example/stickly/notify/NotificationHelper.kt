package com.example.stickly.notify

import android.Manifest
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.example.stickly.Actions
import com.example.stickly.R
import com.example.stickly.SticklyPrefs
import com.example.stickly.db.ReminderEntity
import com.example.stickly.receivers.ActionReceiver
import java.time.ZonedDateTime

object NotificationHelper {

    fun emoji(icon: String): String = when (icon) {
        "personal" -> "🧴"
        "water" -> "💧"
        "study" -> "📚"
        "exercise" -> "🏃"
        "cleaning" -> "🧹"
        "plants" -> "🌱"
        "health" -> "💊"
        "shopping" -> "🛒"
        "home" -> "🏠"
        else -> "⭐"
    }

    fun canPost(ctx: Context): Boolean {
        if (!SticklyPrefs.notificationsEnabled(ctx)) return false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) return false
        return NotificationManagerCompat.from(ctx).areNotificationsEnabled()
    }

    fun cancel(ctx: Context, r: ReminderEntity) {
        NotificationManagerCompat.from(ctx).cancel(r.notificationId)
    }

    /** Posts (or replaces) the notification. Same id => never duplicates. */
    fun show(ctx: Context, r: ReminderEntity, date: String) {
        if (!canPost(ctx)) return

        val sound = SticklyPrefs.sound(ctx)
        val vibration = SticklyPrefs.vibration(ctx)
        val ongoing = r.isAllDay && SticklyPrefs.allDayOngoing(ctx)
        val channelId = Channels.ensure(ctx, sound, vibration, ongoing)

        val body = r.description.ifBlank { "Time for: ${r.title}" }

        val builder = NotificationCompat.Builder(ctx, channelId)
            .setSmallIcon(R.drawable.ic_stat_stickly)
            .setContentTitle("${emoji(r.icon)} ${r.title}")
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setOngoing(ongoing)
            .setAutoCancel(!ongoing)
            .setContentIntent(openAppIntent(ctx, r))
            .addAction(0, "✓ Done", actionIntent(ctx, r, date, Actions.DONE, 0))
            .addAction(0, "⏰ Snooze", actionIntent(ctx, r, date, Actions.SNOOZE, 1))
            .addAction(0, "Skip today", actionIntent(ctx, r, date, Actions.SKIP, 2))

        if (ongoing) {
            builder.setPriority(NotificationCompat.PRIORITY_LOW)
                .setOnlyAlertOnce(true)
                .setDeleteIntent(actionIntent(ctx, r, date, Actions.DISMISSED, 3))
                // Auto-remove at local midnight so it doesn't linger into tomorrow.
                .setTimeoutAfter(millisUntilMidnight())
        } else {
            builder.setPriority(NotificationCompat.PRIORITY_HIGH)
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
                var defaults = 0
                if (sound) defaults = defaults or NotificationCompat.DEFAULT_SOUND
                if (vibration) defaults = defaults or NotificationCompat.DEFAULT_VIBRATE
                builder.setDefaults(defaults)
            }
        }

        try {
            NotificationManagerCompat.from(ctx).notify(r.notificationId, builder.build())
        } catch (_: SecurityException) {
            // Permission revoked between check and post; nothing to do.
        }
    }

    private fun millisUntilMidnight(): Long {
        val now = ZonedDateTime.now()
        val midnight = now.toLocalDate().plusDays(1).atStartOfDay(now.zone)
        return maxOf(60_000L, midnight.toInstant().toEpochMilli() - now.toInstant().toEpochMilli())
    }

    private fun openAppIntent(ctx: Context, r: ReminderEntity): PendingIntent {
        val launch = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
            ?: Intent()
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        return PendingIntent.getActivity(
            ctx, r.notificationId * 4 + 3, launch,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun actionIntent(
        ctx: Context, r: ReminderEntity, date: String, action: String, slot: Int,
    ): PendingIntent {
        val intent = Intent(ctx, ActionReceiver::class.java).apply {
            this.action = action
            putExtra(Actions.EXTRA_REMINDER_ID, r.id)
            putExtra(Actions.EXTRA_DATE, date)
        }
        return PendingIntent.getBroadcast(
            ctx, r.notificationId * 4 + slot, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}
