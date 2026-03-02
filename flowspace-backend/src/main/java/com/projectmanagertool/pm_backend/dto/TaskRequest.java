package com.projectmanagertool.pm_backend.dto;

import com.projectmanagertool.pm_backend.model.TaskStatus;
import lombok.Data;
import java.time.LocalDate;

@Data
public class TaskRequest {
    private String title;
    private String description;
    private TaskStatus status;
    private String priority;          // LOW, MEDIUM, HIGH, URGENT
    private LocalDate startDate;
    private LocalDate endDate;
    private Long dependsOnTaskId;
    private boolean clearDependency = false;
    private Long parentTaskId;        // set to create as subtask
}
