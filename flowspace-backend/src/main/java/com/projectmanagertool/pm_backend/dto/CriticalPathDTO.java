package com.projectmanagertool.pm_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class CriticalPathDTO {

    private long totalDurationDays;
    private List<CriticalTask> criticalTasks;

    @Data
    @AllArgsConstructor
    public static class CriticalTask {
        private Long id;
        private String name;
    }
}