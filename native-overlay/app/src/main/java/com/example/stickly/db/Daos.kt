package com.example.stickly.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

/** Blocking DAOs: always call from a background thread (plugin executor / goAsync). */
@Dao
interface ReminderDao {
    @Query("SELECT * FROM reminders ORDER BY createdAt DESC")
    fun getAll(): List<ReminderEntity>

    @Query("SELECT * FROM reminders WHERE id = :id")
    fun get(id: String): ReminderEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun upsert(r: ReminderEntity)

    @Query("DELETE FROM reminders WHERE id = :id")
    fun delete(id: String)
}

@Dao
interface OccurrenceDao {
    @Query("SELECT * FROM occurrences WHERE reminderId = :reminderId AND date = :date")
    fun get(reminderId: String, date: String): OccurrenceEntity?

    @Query("SELECT * FROM occurrences WHERE date >= :from AND date <= :to")
    fun range(from: String, to: String): List<OccurrenceEntity>

    @Query("SELECT * FROM occurrences WHERE status = 'snoozed'")
    fun getSnoozed(): List<OccurrenceEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun upsert(o: OccurrenceEntity)

    @Query("DELETE FROM occurrences WHERE reminderId = :reminderId")
    fun deleteFor(reminderId: String)

    @Query("DELETE FROM occurrences WHERE date < :before")
    fun prune(before: String)
}
