package com.projectmanagertool.pm_backend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class CommentDTO {
    private Long          id;
    private String        content;
    private String        authorUsername;
    private LocalDateTime createdAt;
}
