package com.projectmanagertool.pm_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "meetings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Meeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    // When the meeting starts
    @Column(nullable = false)
    private LocalDateTime startTime;

    // When it ends (optional)
    private LocalDateTime endTime;

    // Location or video link (Zoom, Google Meet, etc.)
    private String location;

    // SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED
    @Column(nullable = false)
    private String status = "SCHEDULED";

    // STANDUP | PLANNING | REVIEW | RETROSPECTIVE | ONE_ON_ONE | GENERAL
    @Column(nullable = false)
    private String meetingType = "GENERAL";

    // Project this meeting belongs to (optional)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    // Who created the meeting
    @Column(nullable = false)
    private String createdBy;

    // Comma-separated usernames of attendees
    @Column(columnDefinition = "TEXT")
    private String attendees;

    // Meeting notes / agenda
    @Column(columnDefinition = "TEXT")
    private String agenda;

    // Notes taken during/after the meeting
    @Column(columnDefinition = "TEXT")
    private String notes;

    // Action items from the meeting
    @Column(columnDefinition = "TEXT")
    private String actionItems;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}