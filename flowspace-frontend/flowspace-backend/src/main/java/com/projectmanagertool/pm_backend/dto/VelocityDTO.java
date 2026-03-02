package com.projectmanagertool.pm_backend.dto;
import lombok.*; import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VelocityDTO {
    private List<WeekData> weeks;
    private double averagePerWeek;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WeekData {
        private String weekLabel;   // "Week 1", "Mar 10–16"
        private int tasksCompleted;
        private int tasksCreated;
    }
}
