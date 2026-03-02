package com.projectmanagertool.pm_backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class ProjectResponse {

    private Long id;
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String ownerUsername;
    private String color;

    // ── Task summary counts ───────────────────────────────────────
    private int totalTasks;
    private int doneTasks;
    private int inProgressTasks;
    private int todoTasks;
    private int completionPercent;
}