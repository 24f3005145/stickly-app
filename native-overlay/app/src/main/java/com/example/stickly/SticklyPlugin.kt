package com.example.stickly

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.example.stickly.db.AppDatabase
import com.example.stickly.db.OccurrenceEntity
import com.example.stickly.db.ReminderEntity
import com.example.stickly.notify.NotificationHelper
import com.example.stickly.scheduler.NextOccurrence
import com.example.stickly.scheduler.Scheduler
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.UUID
import java.util.concurrent.Executors

@CapacitorPlugin(
    name = "Stickly",
    permissions = [Permission(strings = [Manifest.permission.POST_NOTIFICATIONS], alias = "notifications")],
)
class SticklyPlugin : Plugin() {

    private val executor = Executors.newSingleThreadExecutor()
    private val appCtx: Context get() = context.applicationContext

    /** Runs DB/alarm work off the main thread and turns exceptions into rejections. */
    private fun io(call: PluginCall, block: () -> Unit) {
        executor.execute {
            try {
                block()
            } catch (e: Exception) {
                call.reject(e.message ?: "Unexpected error", e)
            }
        }
    }

    override fun load() {
        // Covers reinstall/restore-from-backup: alarms are never restored by Android itself.
        executor.execute { runCatching { Scheduler.rescheduleAll(appCtx) } }
    }

    // ---------- reminders ----------

    @PluginMethod
    fun getReminders(call: PluginCall) = io(call) {
        val arr = JSArray()
        AppDatabase.get(appCtx).reminders().getAll().forEach { arr.put(it.toJs()) }
        call.resolve(JSObject().apply { put("reminders", arr) })
    }

    @PluginMethod
    fun saveReminder(call: PluginCall) {
        val o = call.getObject("reminder")
        if (o == null) { call.reject("Missing reminder"); return }
        io(call) {
            val dao = AppDatabase.get(appCtx).reminders()
            val existing = o.optString("id", "").ifBlank { null }?.let { dao.get(it) }
            val now = System.currentTimeMillis()

            val daysArr = o.optJSONArray("selectedDays")
            val days = if (daysArr == null) emptyList() else (0 until daysArr.length()).map { daysArr.getInt(it) }

            val entity = ReminderEntity(
                id = existing?.id ?: UUID.randomUUID().toString(),
                title = o.optString("title", "").trim(),
                description = o.optString("description", "").trim(),
                icon = o.optString("icon", "general"),
                scheduleType = o.optString("scheduleType", "daily"),
                selectedDays = days.filter { it in 1..7 }.distinct().sorted().joinToString(","),
                time = o.optString("time", "09:00"),
                onceDate = if (o.has("onceDate") && !o.isNull("onceDate")) o.getString("onceDate") else null,
                dayOfMonth = if (o.has("dayOfMonth") && !o.isNull("dayOfMonth")) o.getInt("dayOfMonth") else null,
                isAllDay = o.optBoolean("isAllDay", false),
                isPaused = o.optBoolean("isPaused", existing?.isPaused ?: false),
                createdAt = existing?.createdAt ?: now,
                updatedAt = now,
                nextOccurrence = null,
                notificationId = existing?.notificationId ?: SticklyPrefs.nextNotificationId(appCtx),
                defaultSnoozeDuration = o.optString("defaultSnoozeDuration", SticklyPrefs.defaultSnooze(appCtx)),
            )

            val error = NextOccurrence.validate(entity)
            if (error != null) { call.reject(error); return@io }

            if (entity.scheduleType == "once") {
                val t = NextOccurrence.parseTime(entity.time)
                val d = runCatching { LocalDate.parse(entity.onceDate) }.getOrNull()
                if (t != null && d != null &&
                    !ZonedDateTime.of(d, t, ZoneId.systemDefault()).isAfter(ZonedDateTime.now())
                ) {
                    call.reject("That date and time has already passed.")
                    return@io
                }
            }

            if (existing != null) Scheduler.cancelSnooze(appCtx, existing)
            val saved = Scheduler.scheduleNext(appCtx, entity)
            call.resolve(JSObject().apply { put("reminder", saved.toJs()) })
        }
    }

    @PluginMethod
    fun deleteReminder(call: PluginCall) {
        val id = call.getString("id")
        if (id == null) { call.reject("Missing id"); return }
        io(call) {
            val db = AppDatabase.get(appCtx)
            db.reminders().get(id)?.let { Scheduler.cancelAll(appCtx, it) }
            db.occurrences().deleteFor(id)
            db.reminders().delete(id)
            call.resolve()
        }
    }

    @PluginMethod
    fun setPaused(call: PluginCall) {
        val id = call.getString("id")
        val paused = call.getBoolean("paused", false) ?: false
        if (id == null) { call.reject("Missing id"); return }
        io(call) {
            val dao = AppDatabase.get(appCtx).reminders()
            val r = dao.get(id)
            if (r == null) { call.reject("Reminder not found"); return@io }
            if (paused) Scheduler.cancelAll(appCtx, r)
            val saved = Scheduler.scheduleNext(appCtx, r.copy(isPaused = paused, updatedAt = System.currentTimeMillis()))
            call.resolve(JSObject().apply { put("reminder", saved.toJs()) })
        }
    }

    // ---------- occurrences ----------

    @PluginMethod
    fun markOccurrence(call: PluginCall) {
        val id = call.getString("id")
        val date = call.getString("date")
        val status = call.getString("status")
        if (id == null || date == null || status == null) { call.reject("Missing arguments"); return }
        io(call) {
            val db = AppDatabase.get(appCtx)
            val r = db.reminders().get(id)
            if (r == null) { call.reject("Reminder not found"); return@io }
            val stored = when (status) {
                "completed", "skipped" -> status
                else -> "upcoming" // 'reset' = undo
            }
            db.occurrences().upsert(OccurrenceEntity(id, date, stored, null, System.currentTimeMillis()))
            Scheduler.cancelSnooze(appCtx, r)
            if (stored != "upcoming") NotificationHelper.cancel(appCtx, r)
            val saved = Scheduler.scheduleNext(appCtx, r)
            call.resolve(JSObject().apply { put("reminder", saved.toJs()) })
        }
    }

    @PluginMethod
    fun getOccurrences(call: PluginCall) {
        val from = call.getString("from")
        val to = call.getString("to")
        if (from == null || to == null) { call.reject("Missing range"); return }
        io(call) {
            val arr = JSArray()
            AppDatabase.get(appCtx).occurrences().range(from, to).forEach { arr.put(it.toJs()) }
            call.resolve(JSObject().apply { put("occurrences", arr) })
        }
    }

    @PluginMethod
    fun rescheduleAll(call: PluginCall) = io(call) {
        Scheduler.rescheduleAll(appCtx)
        call.resolve()
    }

    // ---------- settings ----------

    @PluginMethod
    fun setSettings(call: PluginCall) {
        SticklyPrefs.save(
            appCtx,
            call.getBoolean("notificationsEnabled", true) ?: true,
            call.getBoolean("sound", true) ?: true,
            call.getBoolean("vibration", true) ?: true,
            call.getBoolean("allDayOngoing", true) ?: true,
            call.getString("defaultSnooze", "30m") ?: "30m",
        )
        call.resolve()
    }

    // ---------- permissions ----------

    private fun permissionsJs(): JSObject {
        val granted = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(appCtx, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
        val notifications = granted && NotificationManagerCompat.from(appCtx).areNotificationsEnabled()
        val battery = appCtx.getSystemService(PowerManager::class.java)
            .isIgnoringBatteryOptimizations(appCtx.packageName)
        return JSObject().apply {
            put("notifications", notifications)
            put("exactAlarms", Scheduler.canScheduleExact(appCtx))
            put("batteryUnrestricted", battery)
        }
    }

    @PluginMethod
    fun getPermissions(call: PluginCall) = call.resolve(permissionsJs())

    @PluginMethod
    fun requestNotificationPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            getPermissionState("notifications") == PermissionState.GRANTED
        ) {
            call.resolve(permissionsJs())
            return
        }
        requestPermissionForAlias("notifications", call, "notificationPermissionResult")
    }

    @PermissionCallback
    fun notificationPermissionResult(call: PluginCall) = call.resolve(permissionsJs())

    private fun launch(call: PluginCall, intent: Intent) {
        try {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            appCtx.startActivity(intent)
            call.resolve()
        } catch (e: Exception) {
            call.reject("Could not open Android settings.")
        }
    }

    @PluginMethod
    fun openNotificationSettings(call: PluginCall) {
        val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE, appCtx.packageName)
        } else {
            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${appCtx.packageName}"))
        }
        launch(call, intent)
    }

    @PluginMethod
    fun openExactAlarmSettings(call: PluginCall) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) { call.resolve(); return }
        launch(call, Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${appCtx.packageName}")))
    }

    @PluginMethod
    fun openBatterySettings(call: PluginCall) =
        launch(call, Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
}

// ---------- JSON mapping ----------

private fun ReminderEntity.toJs(): JSObject {
    val js = JSObject()
    js.put("id", id)
    js.put("title", title)
    js.put("description", description)
    js.put("icon", icon)
    js.put("scheduleType", scheduleType)
    val arr = JSArray()
    days().sorted().forEach { arr.put(it) }
    js.put("selectedDays", arr)
    js.put("time", time)
    onceDate?.let { js.put("onceDate", it) }
    dayOfMonth?.let { js.put("dayOfMonth", it) }
    js.put("isAllDay", isAllDay)
    js.put("isPaused", isPaused)
    js.put("createdAt", createdAt)
    js.put("updatedAt", updatedAt)
    nextOccurrence?.let { js.put("nextOccurrence", it) }
    if (nextOccurrence == null) js.put("nextOccurrence", JSONObjectNull)
    js.put("notificationId", notificationId)
    js.put("defaultSnoozeDuration", defaultSnoozeDuration)
    return js
}

private val JSONObjectNull: Any = org.json.JSONObject.NULL

private fun OccurrenceEntity.toJs(): JSObject {
    val js = JSObject()
    js.put("reminderId", reminderId)
    js.put("date", date)
    js.put("status", status)
    snoozedUntil?.let { js.put("snoozedUntil", it) }
    js.put("updatedAt", updatedAt)
    return js
}
