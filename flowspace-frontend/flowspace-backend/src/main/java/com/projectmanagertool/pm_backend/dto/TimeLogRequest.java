package com.projectmanagertool.pm_backend.dto;
import lombok.Data; import java.time.LocalDate;

@Data
public class TimeLogRequest {
    private double hours;
    private String note;
    private LocalDate logDate;
}
