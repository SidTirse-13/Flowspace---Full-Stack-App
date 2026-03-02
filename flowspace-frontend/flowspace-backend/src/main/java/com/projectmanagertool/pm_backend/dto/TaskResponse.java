package com.projectmanagertool.pm_backend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private String status;
    private String priority;          // LOW, MEDIUM, HIGH, URGENT
    private String assignedTo;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long dependencyTaskId;
    private boolean critical;
    private long slackDays;
    private Long parentTaskId;        // null if top-level task
    private int subtaskCount;         // total subtasks
    private int subtaskDoneCount;     // completed subtasks
}
