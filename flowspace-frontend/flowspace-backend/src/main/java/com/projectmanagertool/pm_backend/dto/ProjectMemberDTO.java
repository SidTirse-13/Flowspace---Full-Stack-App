package com.projectmanagertool.pm_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProjectMemberDTO {
    private Long id;
    private String username;
    private String email;
    private String memberRole;
    private LocalDateTime joinedAt;
}
