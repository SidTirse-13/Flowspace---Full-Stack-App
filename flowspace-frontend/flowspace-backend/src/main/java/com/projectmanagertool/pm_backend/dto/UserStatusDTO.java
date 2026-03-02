package com.projectmanagertool.pm_backend.dto;
import lombok.*; import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserStatusDTO {
    private String username;
    private String status;
    private String statusMessage;
    private LocalDateTime updatedAt;
}
