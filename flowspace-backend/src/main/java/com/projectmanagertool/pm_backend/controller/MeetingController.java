package com.projectmanagertool.pm_backend.controller;

import com.projectmanagertool.pm_backend.dto.MeetingDTO;
import com.projectmanagertool.pm_backend.dto.MeetingRequest;
import com.projectmanagertool.pm_backend.service.MeetingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meetings")
public class MeetingController {

    private final MeetingService meetingService;

    public MeetingController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    // GET /api/meetings — all meetings for the logged-in user
    @GetMapping
    public List<MeetingDTO> getAll(Authentication auth) {
        return meetingService.getAllForUser(auth.getName());
    }

    // GET /api/meetings/upcoming — only future meetings
    @GetMapping("/upcoming")
    public List<MeetingDTO> getUpcoming(Authentication auth) {
        return meetingService.getUpcoming(auth.getName());
    }

    // GET /api/meetings/{id}
    @GetMapping("/{id}")
    public MeetingDTO getById(@PathVariable Long id, Authentication auth) {
        return meetingService.getById(id, auth.getName());
    }

    // POST /api/meetings — create a new meeting
    @PostMapping
    public ResponseEntity<MeetingDTO> create(@RequestBody MeetingRequest request,
                                             Authentication auth) {
        return ResponseEntity.ok(meetingService.create(request, auth.getName()));
    }

    // PUT /api/meetings/{id} — update a meeting
    @PutMapping("/{id}")
    public ResponseEntity<MeetingDTO> update(@PathVariable Long id,
                                             @RequestBody MeetingRequest request,
                                             Authentication auth) {
        return ResponseEntity.ok(meetingService.update(id, request, auth.getName()));
    }

    // PATCH /api/meetings/{id}/status — update status only
    @PatchMapping("/{id}/status")
    public ResponseEntity<MeetingDTO> updateStatus(@PathVariable Long id,
                                                   @RequestBody Map<String, String> body,
                                                   Authentication auth) {
        return ResponseEntity.ok(meetingService.updateStatus(id, body.get("status"), auth.getName()));
    }

    // DELETE /api/meetings/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id, Authentication auth) {
        meetingService.delete(id, auth.getName());
        return ResponseEntity.ok("Meeting deleted");
    }

    // GET /api/meetings/project/{projectId} — meetings for a specific project
    @GetMapping("/project/{projectId}")
    public List<MeetingDTO> getByProject(@PathVariable Long projectId, Authentication auth) {
        return meetingService.getByProject(projectId);
    }
}