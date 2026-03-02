package com.projectmanagertool.pm_backend.dto;
import lombok.*; import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProjectReportDTO {
    private String projectName;
    private String ownerUsername;
    private String startDate;
    private String endDate;
    private int totalTasks;
    private int doneTasks;
    private int inProgressTasks;
    private int todoTasks;
    private int completionPercent;
    private int overdueTasks;
    private double totalHoursLogged;
    private List<MemberStat> memberStats;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MemberStat {
        private String username;
        private int assigned;
        private int done;
        private double hoursLogged;
    }
}
