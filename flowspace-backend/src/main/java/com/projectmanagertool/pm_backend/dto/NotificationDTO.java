package com.projectmanagertool.pm_backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private String type;
    private String message;
    private Long projectId;
    private Long taskId;
    private boolean read;
    private LocalDateTime createdAt;
}
