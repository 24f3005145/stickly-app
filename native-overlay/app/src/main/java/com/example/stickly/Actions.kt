package com.example.stickly

/** Shared intent actions and extras used by alarms and notification buttons. */
object Actions {
    const val FIRE = "com.example.stickly.action.FIRE"
    const val SNOOZE_FIRE = "com.example.stickly.action.SNOOZE_FIRE"
    const val DONE = "com.example.stickly.action.DONE"
    const val SNOOZE = "com.example.stickly.action.SNOOZE"
    const val SKIP = "com.example.stickly.action.SKIP"
    const val DISMISSED = "com.example.stickly.action.DISMISSED"

    const val EXTRA_REMINDER_ID = "reminder_id"
    const val EXTRA_DATE = "date" // 'YYYY-MM-DD' local date of the occurrence
}
