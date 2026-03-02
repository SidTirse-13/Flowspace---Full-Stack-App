package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.dto.MeetingDTO;
import com.projectmanagertool.pm_backend.dto.MeetingRequest;
import com.projectmanagertool.pm_backend.model.Meeting;
import com.projectmanagertool.pm_backend.model.Project;
import com.projectmanagertool.pm_backend.repository.MeetingRepository;
import com.projectmanagertool.pm_backend.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final ProjectRepository projectRepository;

    public MeetingService(MeetingRepository meetingRepository,
                          ProjectRepository projectRepository) {
        this.meetingRepository = meetingRepository;
        this.projectRepository = projectRepository;
    }

    // ── CREATE ─────────────────────────────────────────────────────
    public MeetingDTO create(MeetingRequest req, String username) {
        Meeting meeting = new Meeting();
        meeting.setTitle(req.getTitle());
        meeting.setDescription(req.getDescription());
        meeting.setStartTime(req.getStartTime());
        meeting.setEndTime(req.getEndTime());
        meeting.setLocation(req.getLocation());
        meeting.setStatus(req.getStatus() != null ? req.getStatus() : "SCHEDULED");
        meeting.setMeetingType(req.getMeetingType() != null ? req.getMeetingType() : "GENERAL");
        meeting.setCreatedBy(username);
        meeting.setAgenda(req.getAgenda());
        meeting.setNotes(req.getNotes());
        meeting.setActionItems(req.getActionItems());

        // Attendees stored as comma-separated
        if (req.getAttendees() != null) {
            meeting.setAttendees(String.join(",", req.getAttendees()));
        }

        // Link to project if provided
        if (req.getProjectId() != null) {
            projectRepository.findById(req.getProjectId())
                    .ifPresent(meeting::setProject);
        }

        return toDTO(meetingRepository.save(meeting));
    }

    // ── GET ALL FOR USER ───────────────────────────────────────────
    public List<MeetingDTO> getAllForUser(String username) {
        return meetingRepository.findAllForUser(username)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── GET UPCOMING ───────────────────────────────────────────────
    public List<MeetingDTO> getUpcoming(String username) {
        return meetingRepository.findUpcomingForUser(username, LocalDateTime.now())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── GET BY PROJECT ─────────────────────────────────────────────
    public List<MeetingDTO> getByProject(Long projectId) {
        return meetingRepository.findByProjectIdOrderByStartTimeAsc(projectId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── GET BY ID ──────────────────────────────────────────────────
    public MeetingDTO getById(Long id, String username) {
        Meeting m = meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));
        return toDTO(m);
    }

    // ── UPDATE ─────────────────────────────────────────────────────
    public MeetingDTO update(Long id, MeetingRequest req, String username) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        if (!meeting.getCreatedBy().equals(username)) {
            throw new RuntimeException("Only the meeting creator can edit it");
        }

        if (req.getTitle()       != null) meeting.setTitle(req.getTitle());
        if (req.getDescription() != null) meeting.setDescription(req.getDescription());
        if (req.getStartTime()   != null) meeting.setStartTime(req.getStartTime());
        if (req.getEndTime()     != null) meeting.setEndTime(req.getEndTime());
        if (req.getLocation()    != null) meeting.setLocation(req.getLocation());
        if (req.getStatus()      != null) meeting.setStatus(req.getStatus());
        if (req.getMeetingType() != null) meeting.setMeetingType(req.getMeetingType());
        if (req.getAgenda()      != null) meeting.setAgenda(req.getAgenda());
        if (req.getNotes()       != null) meeting.setNotes(req.getNotes());
        if (req.getActionItems() != null) meeting.setActionItems(req.getActionItems());
        if (req.getAttendees()   != null) meeting.setAttendees(String.join(",", req.getAttendees()));

        if (req.getProjectId() != null) {
            projectRepository.findById(req.getProjectId())
                    .ifPresent(meeting::setProject);
        }

        return toDTO(meetingRepository.save(meeting));
    }

    // ── DELETE ─────────────────────────────────────────────────────
    public void delete(Long id, String username) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));
        if (!meeting.getCreatedBy().equals(username)) {
            throw new RuntimeException("Only the meeting creator can delete it");
        }
        meetingRepository.deleteById(id);
    }

    // ── UPDATE STATUS ──────────────────────────────────────────────
    public MeetingDTO updateStatus(Long id, String status, String username) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));
        meeting.setStatus(status.toUpperCase());
        return toDTO(meetingRepository.save(meeting));
    }

    // ── MAPPER ────────────────────────────────────────────────────
    private MeetingDTO toDTO(Meeting m) {
        List<String> attendeeList = (m.getAttendees() != null && !m.getAttendees().isBlank())
                ? Arrays.asList(m.getAttendees().split(","))
                : List.of();

        return MeetingDTO.builder()
                .id(m.getId())
                .title(m.getTitle())
                .description(m.getDescription())
                .startTime(m.getStartTime())
                .endTime(m.getEndTime())
                .location(m.getLocation())
                .status(m.getStatus())
                .meetingType(m.getMeetingType())
                .projectId(m.getProject() != null ? m.getProject().getId() : null)
                .projectName(m.getProject() != null ? m.getProject().getName() : null)
                .createdBy(m.getCreatedBy())
                .attendees(attendeeList)
                .agenda(m.getAgenda())
                .notes(m.getNotes())
                .actionItems(m.getActionItems())
                .createdAt(m.getCreatedAt())
                .build();
    }
}