package com.projectmanagertool.pm_backend.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingDTO {
    private Long          id;
    private String        title;
    private String        description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String        location;
    private String        status;
    private String        meetingType;
    private Long          projectId;
    private String        projectName;
    private String        createdBy;
    private List<String>  attendees;
    private String        agenda;
    private String        notes;
    private String        actionItems;
    private LocalDateTime createdAt;
}