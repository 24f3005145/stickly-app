package com.example.stickly.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "reminders")
data class ReminderEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String,
    val icon: String,
    val scheduleType: String,        // once | daily | weekly | monthly | custom
    val selectedDays: String,        // ISO weekdays, e.g. "3,5"
    val time: String,                // "HH:mm"
    val onceDate: String?,           // "YYYY-MM-DD"
    val dayOfMonth: Int?,
    val isAllDay: Boolean,
    val isPaused: Boolean,
    val createdAt: Long,
    val updatedAt: Long,
    val nextOccurrence: Long?,
    val notificationId: Int,
    val defaultSnoozeDuration: String, // 10m | 30m | 1h | tomorrow
) {
    fun days(): Set<Int> =
        selectedDays.split(",").mapNotNull { it.trim().toIntOrNull() }.filter { it in 1..7 }.toSet()
}

/** One row per (reminder, local date). status: active | completed | skipped | snoozed */
@Entity(tableName = "occurrences", primaryKeys = ["reminderId", "date"])
data class OccurrenceEntity(
    val reminderId: String,
    val date: String,
    val status: String,
    val snoozedUntil: Long?,
    val updatedAt: Long,
)
