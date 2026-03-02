package com.projectmanagertool.pm_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class GanttTaskDTO {

    private Long id;
    private String name;
    private LocalDate start;
    private LocalDate end;
    private int progress;        // percentage
    private Long dependencyId;   // dependsOn task id
}
