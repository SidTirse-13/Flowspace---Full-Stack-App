package com.projectmanagertool.pm_backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDTO {
    private Long          id;
    private String        entityType;
    private Long          entityId;
    private String        action;
    private String        description;
    private String        performedBy;
    private LocalDateTime timestamp;
}
