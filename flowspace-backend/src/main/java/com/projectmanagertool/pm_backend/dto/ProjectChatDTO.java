package com.projectmanagertool.pm_backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectChatDTO {
    private Long id;
    private Long projectId;
    private String senderUsername;
    private String message;
    private LocalDateTime sentAt;
}