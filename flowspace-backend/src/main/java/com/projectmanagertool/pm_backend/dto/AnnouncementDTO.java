package com.projectmanagertool.pm_backend.dto;
import lombok.*; import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AnnouncementDTO {
    private Long id;
    private Long projectId;
    private String authorUsername;
    private String content;
    private boolean pinned;
    private LocalDateTime createdAt;
}
