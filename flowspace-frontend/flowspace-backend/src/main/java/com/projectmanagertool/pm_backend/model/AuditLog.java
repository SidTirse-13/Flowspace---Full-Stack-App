package com.projectmanagertool.pm_backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // "TASK" or "PROJECT"
    @Column(nullable = false)
    private String entityType;

    @Column(nullable = false)
    private Long entityId;

    // "CREATE", "UPDATE", "DELETE", "ASSIGN", "STATUS_CHANGE", "COMMENT"
    @Column(nullable = false)
    private String action;

    // Human-readable description e.g. "Changed status from TODO to DONE"
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String performedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
