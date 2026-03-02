package com.projectmanagertool.pm_backend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class MyTaskDTO {

    private Long   taskId;
    private String title;
    private String description;
    private String status;
    private String assignedTo;

    private LocalDate startDate;
    private LocalDate endDate;

    // Which project this task belongs to
    private Long   projectId;
    private String projectName;
    private String projectOwner;

    private Long   dependencyTaskId;
}