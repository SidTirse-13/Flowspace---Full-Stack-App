package com.projectmanagertool.pm_backend.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeetingRequest {
    private String        title;
    private String        description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String        location;
    private String        status;
    private String        meetingType;
    private Long          projectId;
    private List<String>  attendees;
    private String        agenda;
    private String        notes;
    private String        actionItems;
}