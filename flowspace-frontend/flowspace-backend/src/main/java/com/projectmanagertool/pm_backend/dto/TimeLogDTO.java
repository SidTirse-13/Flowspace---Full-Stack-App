package com.projectmanagertool.pm_backend.dto;
import lombok.*; import java.time.LocalDate; import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TimeLogDTO {
    private Long id;
    private Long taskId;
    private String taskTitle;
    private String username;
    private double hours;
    private String note;
    private LocalDate logDate;
    private LocalDateTime createdAt;
}
