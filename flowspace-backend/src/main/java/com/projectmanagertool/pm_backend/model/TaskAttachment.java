package com.projectmanagertool.pm_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;

@Entity
@Table(name = "task_attachments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class TaskAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName;          // Original filename shown to user

    @Column(nullable = false)
    private String storedFileName;    // UUID-based name on disk

    @Column(nullable = false)
    private Long fileSize;            // Bytes

    @Column(nullable = false)
    private String contentType;       // e.g. "application/pdf"

    @Column(nullable = false)
    private String uploadedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime uploadedAt;
}
