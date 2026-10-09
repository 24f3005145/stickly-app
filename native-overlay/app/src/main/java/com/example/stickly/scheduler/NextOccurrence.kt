package com.example.stickly.scheduler

import com.example.stickly.db.ReminderEntity
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZonedDateTime

/**
 * Pure schedule logic. Uses local wall-clock date + time in the given zone,
 * so timezone changes and DST are handled by java.time
 * (a nonexistent local time in a DST gap is shifted forward automatically).
 */
object NextOccurrence {
    private const val MAX_DAYS = 800

    fun parseTime(time: String): LocalTime? =
        runCatching { LocalTime.parse(time) }.getOrNull()

    fun matches(r: ReminderEntity, date: LocalDate): Boolean {
        return when (r.scheduleType) {
            "once" -> runCatching { LocalDate.parse(r.onceDate) }.getOrNull() == date
            "daily" -> true
            "weekly", "custom" -> date.dayOfWeek.value in r.days()
            "monthly" -> {
                val dom = r.dayOfMonth ?: return false
                date.dayOfMonth == minOf(dom, date.lengthOfMonth())
            }
            else -> false
        }
    }

    /** Returns an error message if the schedule is invalid, otherwise null. */
    fun validate(r: ReminderEntity): String? {
        if (r.title.isBlank()) return "Title is required."
        if (parseTime(r.time) == null) return "Invalid time."
        return when (r.scheduleType) {
            "once" ->
                if (runCatching { LocalDate.parse(r.onceDate) }.isFailure) "Pick a date." else null
            "weekly", "custom" ->
                if (r.days().isEmpty()) "Pick at least one day." else null
            "monthly" ->
                if (r.dayOfMonth == null || r.dayOfMonth !in 1..31) "Pick a day of the month." else null
            "daily" -> null
            else -> "Unknown schedule type."
        }
    }

    /**
     * Next trigger strictly after [from]. Dates for which [isSuppressed] is true
     * (completed or skipped) are passed over.
     */
    fun next(
        r: ReminderEntity,
        from: ZonedDateTime,
        isSuppressed: (LocalDate) -> Boolean = { false },
    ): ZonedDateTime? {
        val time = parseTime(r.time) ?: return null
        val zone = from.zone
        var date = from.toLocalDate()

        if (r.scheduleType == "once") {
            val d = runCatching { LocalDate.parse(r.onceDate) }.getOrNull() ?: return null
            if (isSuppressed(d)) return null
            val c = ZonedDateTime.of(d, time, zone)
            return if (c.isAfter(from)) c else null
        }

        repeat(MAX_DAYS) {
            if (matches(r, date) && !isSuppressed(date)) {
                val candidate = ZonedDateTime.of(date, time, zone)
                if (candidate.isAfter(from)) return candidate
            }
            date = date.plusDays(1)
        }
        return null
    }
}
