package com.projectmanagertool.pm_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WorkloadDTO {
    private String username;
    private long   totalAssigned;
    private long   todo;
    private long   inProgress;
    private long   done;
    private long   overdue;   // past endDate and not DONE
}
