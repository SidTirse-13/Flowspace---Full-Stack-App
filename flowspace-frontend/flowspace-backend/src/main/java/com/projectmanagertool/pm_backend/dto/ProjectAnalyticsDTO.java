package com.projectmanagertool.pm_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProjectAnalyticsDTO {

    private long totalTasks;
    private long todo;
    private long inProgress;
    private long done;
    private int completionPercentage;
}