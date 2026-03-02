package com.projectmanagertool.pm_backend.repository;

import com.projectmanagertool.pm_backend.model.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    // All meetings created by user
    List<Meeting> findByCreatedByOrderByStartTimeAsc(String username);

    // Meetings where user is an attendee OR creator
    @Query("SELECT m FROM Meeting m WHERE m.createdBy = :username OR m.attendees LIKE %:username%")
    List<Meeting> findAllForUser(@Param("username") String username);

    // Meetings for a specific project
    List<Meeting> findByProjectIdOrderByStartTimeAsc(Long projectId);

    // Upcoming meetings (startTime in future)
    @Query("SELECT m FROM Meeting m WHERE (m.createdBy = :username OR m.attendees LIKE %:username%) AND m.startTime >= :now ORDER BY m.startTime ASC")
    List<Meeting> findUpcomingForUser(@Param("username") String username, @Param("now") LocalDateTime now);

    // Meetings in a date range
    @Query("SELECT m FROM Meeting m WHERE (m.createdBy = :username OR m.attendees LIKE %:username%) AND m.startTime BETWEEN :start AND :end ORDER BY m.startTime ASC")
    List<Meeting> findInRange(@Param("username") String username, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}