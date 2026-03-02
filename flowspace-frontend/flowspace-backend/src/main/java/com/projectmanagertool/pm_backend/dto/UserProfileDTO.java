package com.projectmanagertool.pm_backend.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserProfileDTO {
    private Long id;
    private String username;
    private String email;
    private String role;
    private String bio;
    private String avatarColor;   // hex color for avatar bg
    private int totalTasksAssigned;
    private int totalTasksDone;
    private int totalProjects;
}
