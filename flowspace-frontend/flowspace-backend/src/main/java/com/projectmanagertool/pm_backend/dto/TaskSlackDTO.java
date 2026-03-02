package com.projectmanagertool.pm_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TaskSlackDTO {
    private Long taskId;
    private String title;
    private long slackDays;
}