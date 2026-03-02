package com.projectmanagertool.pm_backend.dto;
import lombok.*; import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DirectMessageDTO {
    private Long id;
    private String senderUsername;
    private String recipientUsername;
    private String message;
    private boolean read;
    private LocalDateTime sentAt;
}
