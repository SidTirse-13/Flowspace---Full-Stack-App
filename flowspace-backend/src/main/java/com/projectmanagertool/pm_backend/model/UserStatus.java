package com.projectmanagertool.pm_backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_statuses")
@Data @NoArgsConstructor @AllArgsConstructor
public class UserStatus {
    @Id
    private String username;  // PK = username (one row per user)

    // AVAILABLE, BUSY, IN_MEETING, ON_LEAVE, OFFLINE
    @Column(nullable = false)
    private String status = "AVAILABLE";

    private String statusMessage;  // custom message e.g. "Back at 3pm"

    private LocalDateTime updatedAt;
}
