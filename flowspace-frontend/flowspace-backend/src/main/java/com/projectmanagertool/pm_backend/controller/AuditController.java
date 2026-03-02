package com.projectmanagertool.pm_backend.controller;

import com.projectmanagertool.pm_backend.dto.AuditLogDTO;
import com.projectmanagertool.pm_backend.exception.UnauthorizedException;
import com.projectmanagertool.pm_backend.model.Task;
import com.projectmanagertool.pm_backend.repository.ProjectRepository;
import com.projectmanagertool.pm_backend.repository.TaskRepository;
import com.projectmanagertool.pm_backend.service.AuditService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditService auditService;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    public AuditController(AuditService auditService,
                           TaskRepository taskRepository,
                           ProjectRepository projectRepository) {
        this.auditService      = auditService;
        this.taskRepository    = taskRepository;
        this.projectRepository = projectRepository;
    }

    // GET /api/audit/task/{taskId}
    // FIX (Security): Added ownership check — only the project owner OR the task assignee
    // can view a task's audit log. Previously any authenticated user could see any task's history.
    @GetMapping("/task/{taskId}")
    public List<AuditLogDTO> getTaskLogs(@PathVariable Long taskId, Authentication authentication) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        String username   = authentication.getName();
        boolean isOwner   = task.getProject().getOwnerUsername().equals(username);
        boolean isAssignee = username.equals(task.getAssignedTo());

        if (!isOwner && !isAssignee) {
            throw new UnauthorizedException("Access denied to this task's audit log");
        }

        return auditService.getLogsForTask(taskId);
    }

    // GET /api/audit/project/{projectId}
    // FIX (Security): Only the project owner can view the full project audit log.
    @GetMapping("/project/{projectId}")
    public List<AuditLogDTO> getProjectLogs(@PathVariable Long projectId, Authentication authentication) {
        projectRepository.findById(projectId)
                .filter(p -> p.getOwnerUsername().equals(authentication.getName()))
                .orElseThrow(() -> new UnauthorizedException("Access denied to this project's audit log"));

        return auditService.getLogsForProject(projectId);
    }

    // GET /api/audit/me — logged-in user's own activity feed (no change needed)
    @GetMapping("/me")
    public List<AuditLogDTO> getMyActivity(Authentication authentication) {
        return auditService.getLogsForUser(authentication.getName());
    }
}
