package com.projectmanagertool.pm_backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentDTO {
    private Long   id;
    private String fileName;
    private Long   fileSize;
    private String contentType;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
}
